from rest_framework import serializers

from .models import Shift, ShiftAssignment


class ShiftAssignmentSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_first_name = serializers.CharField(source="user.first_name", read_only=True)
    user_last_name = serializers.CharField(source="user.last_name", read_only=True)

    class Meta:
        model = ShiftAssignment
        fields = [
            "id",
            "shift",
            "user",
            "user_email",
            "user_first_name",
            "user_last_name",
            "status",
            "start_time",
            "end_time",
            "check_in_time",
            "check_out_time",
        ]
        read_only_fields = ["id"]


class ShiftSerializer(serializers.ModelSerializer):
    assignments = ShiftAssignmentSerializer(many=True, read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)
    conflicts = serializers.SerializerMethodField()

    def get_conflicts(self, obj):
        """
        Returns approved leave requests that overlap with this shift for any
        assigned user. Assignments are pre-fetched by the viewset queryset so
        the inner iteration is free; only one extra DB query per shift.
        """
        assignments = obj.assignments.all()
        if not assignments:
            return []
        shift_date = obj.start_time.date()
        user_ids = [a.user_id for a in assignments]

        # Import here to avoid circular dependency between shifts ↔ leave_requests
        from leave_requests.models import LeaveRequest  # noqa: PLC0415

        leaves = (
            LeaveRequest.objects.filter(
                user_id__in=user_ids,
                status="approved",
                start_date__lte=shift_date,
                end_date__gte=shift_date,
            ).select_related("user")
        )
        return [
            {
                "user": str(leave.user_id),
                "user_email": leave.user.email,
                "leave_type": leave.leave_type,
                "start_date": str(leave.start_date),
                "end_date": str(leave.end_date),
            }
            for leave in leaves
        ]

    class Meta:
        model = Shift
        fields = [
            "id",
            "branch",
            "branch_name",
            "created_by",
            "created_by_email",
            "start_time",
            "end_time",
            "status",
            "note",
            "created_at",
            "assignments",
            "conflicts",
        ]
        read_only_fields = ["id", "created_at", "created_by"]
