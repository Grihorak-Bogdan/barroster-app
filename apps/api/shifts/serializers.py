from rest_framework import serializers

from .models import Shift, ShiftAssignment


class ShiftAssignmentSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = ShiftAssignment
        fields = [
            "id",
            "shift",
            "user",
            "user_email",
            "status",
            "check_in_time",
            "check_out_time",
        ]
        read_only_fields = ["id"]


class ShiftSerializer(serializers.ModelSerializer):
    assignments = ShiftAssignmentSerializer(many=True, read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)

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
        ]
        read_only_fields = ["id", "created_at"]