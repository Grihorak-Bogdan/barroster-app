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
    user_first_name = serializers.CharField(source="user.first_name", read_only=True)
    user_last_name = serializers.CharField(source="user.last_name", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = Employment
        fields = [
            "id",
            "user",
            "user_email",
            "user_first_name",
            "user_last_name",
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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if request:
            from config.permissions import get_effective_role  # noqa: PLC0415
            if get_effective_role(request.user) not in ("manager", "owner"):
                data.pop("compensations", None)
        return data