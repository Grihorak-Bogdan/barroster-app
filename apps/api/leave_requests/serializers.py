from rest_framework import serializers

from .models import LeaveRequest


class LeaveRequestSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_first_name = serializers.CharField(source="user.first_name", read_only=True)
    user_last_name = serializers.CharField(source="user.last_name", read_only=True)
    reviewed_by_email = serializers.EmailField(source="reviewed_by.email", read_only=True, allow_null=True)
    employment_branch_name = serializers.CharField(
        source="employment.branch.name", read_only=True, allow_null=True
    )
    employment_position = serializers.CharField(
        source="employment.position", read_only=True, allow_null=True
    )

    class Meta:
        model = LeaveRequest
        fields = [
            "id",
            "user",
            "user_email",
            "user_first_name",
            "user_last_name",
            "employment",
            "employment_branch_name",
            "employment_position",
            "leave_type",
            "start_date",
            "end_date",
            "reason",
            "status",
            "reviewed_by",
            "reviewed_by_email",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "reviewed_by", "reviewed_at", "created_at", "updated_at"]
