from rest_framework import serializers

from .models import Compensation, Employment


class CompensationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Compensation
        fields = [
            "id",
            "employment",
            "payment_type",
            "hourly_rate",
            "base_salary",
            "bonus_type",
            "bonus_value",
            "effective_from",
            "effective_to",
        ]
        read_only_fields = ["id"]


class EmploymentSerializer(serializers.ModelSerializer):
    compensations = CompensationSerializer(many=True, read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = Employment
        fields = [
            "id",
            "user",
            "user_email",
            "branch",
            "branch_name",
            "position",
            "role",
            "hire_date",
            "end_date",
            "status",
            "termination_reason",
            "created_at",
            "compensations",
        ]
        read_only_fields = ["id", "created_at"]