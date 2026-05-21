from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from audit_log.utils import log_action
from config.permissions import IsManagerOrAbove
from notifications.utils import notify_user
from .models import LeaveRequest
from .serializers import LeaveRequestSerializer


class LeaveRequestViewSet(viewsets.ModelViewSet):
    serializer_class = LeaveRequestSerializer

    def get_permissions(self):
        if self.action in ("approve", "reject", "cancel", "update", "partial_update", "destroy"):
            return [IsManagerOrAbove()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = LeaveRequest.objects.select_related(
            "user", "employment", "employment__branch", "reviewed_by"
        )
        from config.permissions import get_effective_role  # noqa: PLC0415
        role = get_effective_role(self.request.user)
        if role not in ("manager", "owner"):
            qs = qs.filter(user=self.request.user)
        status = self.request.query_params.get("status")
        if status:
            qs = qs.filter(status=status)
        user_id = self.request.query_params.get("user")
        if user_id:
            qs = qs.filter(user_id=user_id)
        date = self.request.query_params.get("date")
        if date:
            qs = qs.filter(start_date__lte=date, end_date__gte=date)
        return qs

    def perform_create(self, serializer):
        leave = serializer.save(user=self.request.user)
        log_action(
            self.request,
            "leave_created",
            "leave_request",
            leave.id,
            f"{leave.user.email}: {leave.start_date} – {leave.end_date}",
            {"leave_type": leave.leave_type},
        )

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        leave = self.get_object()
        leave.status = "approved"
        leave.reviewed_by = request.user
        leave.reviewed_at = timezone.now()
        leave.save()
        log_action(
            request,
            "leave_approved",
            "leave_request",
            leave.id,
            f"{leave.user.email}: {leave.start_date} – {leave.end_date}",
            {"leave_type": leave.leave_type},
        )
        notify_user(
            leave.user,
            "leave_approved",
            "Leave request approved",
            f"Your {leave.leave_type.replace('_', ' ')} request for {leave.start_date} – {leave.end_date} was approved.",
            resource_type="leave_request",
            resource_id=str(leave.id),
        )
        return Response(self.get_serializer(leave).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        leave = self.get_object()
        leave.status = "rejected"
        leave.reviewed_by = request.user
        leave.reviewed_at = timezone.now()
        leave.save()
        log_action(
            request,
            "leave_rejected",
            "leave_request",
            leave.id,
            f"{leave.user.email}: {leave.start_date} – {leave.end_date}",
            {"leave_type": leave.leave_type},
        )
        notify_user(
            leave.user,
            "leave_rejected",
            "Leave request declined",
            f"Your {leave.leave_type.replace('_', ' ')} request for {leave.start_date} – {leave.end_date} was not approved.",
            resource_type="leave_request",
            resource_id=str(leave.id),
        )
        return Response(self.get_serializer(leave).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        leave = self.get_object()
        leave.status = "cancelled"
        leave.save()
        log_action(
            request,
            "leave_cancelled",
            "leave_request",
            leave.id,
            f"{leave.user.email}: {leave.start_date} – {leave.end_date}",
            {"leave_type": leave.leave_type},
        )
        return Response(self.get_serializer(leave).data)
