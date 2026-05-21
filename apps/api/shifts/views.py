from collections import defaultdict
from decimal import Decimal

from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from audit_log.utils import log_action
from config.permissions import IsManagerOrAbove, get_effective_role
from notifications.utils import notify_user, notify_users
from .models import Shift, ShiftAssignment
from .serializers import ShiftAssignmentSerializer, ShiftSerializer


class ShiftViewSet(viewsets.ModelViewSet):
    queryset = Shift.objects.select_related("branch", "created_by").prefetch_related("assignments__user")
    serializer_class = ShiftSerializer
    permission_classes = [IsManagerOrAbove]

    def perform_create(self, serializer):
        shift = serializer.save(created_by=self.request.user)
        log_action(
            self.request,
            "shift_created",
            "shift",
            shift.id,
            f"{shift.branch.name} — {shift.start_time:%Y-%m-%d %H:%M}",
            {"branch": shift.branch.name, "status": shift.status},
        )

    def perform_update(self, serializer):
        shift = serializer.save()
        action = "shift_cancelled" if shift.status == "cancelled" else "shift_updated"
        log_action(
            self.request,
            action,
            "shift",
            shift.id,
            f"{shift.branch.name} — {shift.start_time:%Y-%m-%d %H:%M}",
            {"status": shift.status},
        )
        if shift.status == "cancelled":
            assigned_users = [a.user for a in shift.assignments.select_related("user").all()]
            if assigned_users:
                notify_users(
                    assigned_users,
                    "shift_cancelled",
                    "Shift cancelled",
                    f"Your shift at {shift.branch.name} on {shift.start_time:%b %d, %H:%M} has been cancelled.",
                    resource_type="shift",
                    resource_id=str(shift.id),
                )

    def perform_destroy(self, instance):
        log_action(
            self.request,
            "shift_cancelled",
            "shift",
            instance.id,
            f"{instance.branch.name} — {instance.start_time:%Y-%m-%d %H:%M}",
        )
        instance.delete()


class ShiftAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ShiftAssignment.objects.select_related("shift", "user", "shift__branch")
    serializer_class = ShiftAssignmentSerializer
    permission_classes = [IsManagerOrAbove]

    def perform_create(self, serializer):
        assignment = serializer.save()
        log_action(
            self.request,
            "assignment_created",
            "assignment",
            assignment.id,
            f"{assignment.user.email} → {assignment.shift.branch.name}",
            {"shift_id": str(assignment.shift.id)},
        )
        notify_user(
            assignment.user,
            "assignment_created",
            "You've been assigned to a shift",
            f"You are scheduled at {assignment.shift.branch.name} on {assignment.shift.start_time:%b %d, %H:%M}.",
            resource_type="shift",
            resource_id=str(assignment.shift.id),
        )

    def perform_destroy(self, instance):
        log_action(
            self.request,
            "assignment_removed",
            "assignment",
            instance.id,
            f"{instance.user.email} → {instance.shift.branch.name}",
        )
        instance.delete()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def hours_summary(request):
    """Per-employee worked hours summary. Non-managers only see their own."""
    role = get_effective_role(request.user)
    is_manager = role in ("manager", "owner")

    qs = ShiftAssignment.objects.select_related(
        "user", "shift", "shift__branch"
    ).filter(shift__status__in=["planned", "confirmed", "completed"])

    if not is_manager:
        qs = qs.filter(user=request.user)

    from_date = request.query_params.get("from_date")
    to_date = request.query_params.get("to_date")
    branch_id = request.query_params.get("branch")

    if from_date:
        qs = qs.filter(shift__start_time__date__gte=from_date)
    if to_date:
        qs = qs.filter(shift__start_time__date__lte=to_date)
    if branch_id:
        qs = qs.filter(shift__branch_id=branch_id)

    summary: dict = defaultdict(lambda: {
        "shifts": 0, "hours": Decimal("0"),
        "email": "", "first_name": "", "last_name": "",
    })

    for a in qs:
        uid = str(a.user_id)
        summary[uid]["email"] = a.user.email
        summary[uid]["first_name"] = a.user.first_name or ""
        summary[uid]["last_name"] = a.user.last_name or ""
        summary[uid]["shifts"] += 1

        if a.start_time and a.end_time:
            secs = (a.end_time - a.start_time).total_seconds()
        elif a.check_in_time and a.check_out_time:
            secs = (a.check_out_time - a.check_in_time).total_seconds()
        else:
            secs = (a.shift.end_time - a.shift.start_time).total_seconds()

        summary[uid]["hours"] += Decimal(str(round(secs / 3600, 2)))

    result = sorted(
        [
            {
                "user_id": uid,
                "user_email": d["email"],
                "user_first_name": d["first_name"],
                "user_last_name": d["last_name"],
                "total_shifts": d["shifts"],
                "total_hours": round(float(d["hours"]), 2),
            }
            for uid, d in summary.items()
        ],
        key=lambda x: -x["total_hours"],
    )
    return Response(result)
