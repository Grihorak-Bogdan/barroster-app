from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from audit_log.utils import log_action
from config.permissions import IsManagerOrAbove
from employment.models import Employment
from notifications.utils import notify_users

from .models import PayrollPeriod, PayrollRecord
from .serializers import (
    PayrollPeriodDetailSerializer,
    PayrollPeriodSerializer,
    PayrollRecordSerializer,
)
from .utils import calculate_amounts, calculate_period_hours, get_effective_compensation


class PayrollPeriodViewSet(viewsets.ModelViewSet):
    permission_classes = [IsManagerOrAbove]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PayrollPeriodDetailSerializer
        return PayrollPeriodSerializer

    def get_queryset(self):
        qs = PayrollPeriod.objects.select_related(
            "branch", "created_by", "approved_by"
        ).prefetch_related("records")
        params = self.request.query_params
        if status_val := params.get("status"):
            qs = qs.filter(status=status_val)
        if branch_val := params.get("branch"):
            qs = qs.filter(branch_id=branch_val)
        if from_date := params.get("from_date"):
            qs = qs.filter(start_date__gte=from_date)
        if to_date := params.get("to_date"):
            qs = qs.filter(end_date__lte=to_date)
        return qs

    def perform_create(self, serializer):
        period = serializer.save(created_by=self.request.user)
        log_action(
            self.request,
            "payroll_created",
            "payroll_period",
            period.id,
            f"{period.start_date} – {period.end_date}",
            {"frequency": period.frequency},
        )

    @action(detail=True, methods=["post"])
    def generate(self, request, pk=None):
        period = self.get_object()
        if period.status != "draft":
            return Response(
                {"error": "Can only generate records for draft periods."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        period.records.all().delete()

        employments = (
            Employment.objects.filter(
                status="active",
                hire_date__lte=period.end_date,
            )
            .filter(Q(end_date__isnull=True) | Q(end_date__gte=period.start_date))
            .select_related("user", "branch")
        )
        if period.branch_id:
            employments = employments.filter(branch=period.branch)

        created = 0
        for emp in employments:
            comp = get_effective_compensation(emp, period)
            if not comp:
                continue
            hours, shifts = calculate_period_hours(emp, period)
            base, bonus = calculate_amounts(comp, hours, shifts, period)
            PayrollRecord.objects.create(
                period=period,
                employment=emp,
                compensation=comp,
                hours_worked=hours,
                shifts_count=shifts,
                base_amount=base,
                bonus_amount=bonus,
                total_amount=base + bonus,
            )
            created += 1

        log_action(
            request,
            "payroll_generated",
            "payroll_period",
            period.id,
            f"{period.start_date} – {period.end_date}",
            {"records_created": created},
        )
        return Response(PayrollPeriodDetailSerializer(period, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        period = self.get_object()
        if period.status != "draft":
            return Response(
                {"error": "Only draft periods can be approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        period.status = "approved"
        period.approved_by = request.user
        period.approved_at = timezone.now()
        period.save()
        log_action(
            request,
            "payroll_approved",
            "payroll_period",
            period.id,
            f"{period.start_date} – {period.end_date}",
        )
        users = [r.employment.user for r in period.records.select_related("employment__user").all()]
        if users:
            notify_users(
                users,
                "payroll_approved",
                "Payroll approved",
                f"Your payroll for {period.start_date} – {period.end_date} has been approved.",
                resource_type="payroll_period",
                resource_id=str(period.id),
            )
        return Response(PayrollPeriodSerializer(period, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def mark_paid(self, request, pk=None):
        period = self.get_object()
        if period.status != "approved":
            return Response(
                {"error": "Only approved periods can be marked as paid."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        period.status = "paid"
        period.paid_at = timezone.now()
        period.save()
        log_action(
            request,
            "payroll_paid",
            "payroll_period",
            period.id,
            f"{period.start_date} – {period.end_date}",
        )
        users = [r.employment.user for r in period.records.select_related("employment__user").all()]
        if users:
            notify_users(
                users,
                "payroll_paid",
                "Payroll paid",
                f"Your payroll for {period.start_date} – {period.end_date} has been paid.",
                resource_type="payroll_period",
                resource_id=str(period.id),
            )
        return Response(PayrollPeriodSerializer(period, context={"request": request}).data)


class PayrollRecordViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PayrollRecordSerializer
    permission_classes = [IsManagerOrAbove]

    def get_queryset(self):
        qs = PayrollRecord.objects.select_related(
            "employment__user", "employment__branch", "compensation", "period"
        )
        period_id = self.request.query_params.get("period")
        if period_id:
            qs = qs.filter(period_id=period_id)
        return qs
