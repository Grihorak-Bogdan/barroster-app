from decimal import Decimal

from django.db.models import Sum
from rest_framework import serializers

from .models import PayrollPeriod, PayrollRecord


class PayrollRecordSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="employment.user.email", read_only=True)
    user_first_name = serializers.CharField(source="employment.user.first_name", read_only=True)
    user_last_name = serializers.CharField(source="employment.user.last_name", read_only=True)
    branch_name = serializers.CharField(source="employment.branch.name", read_only=True)
    position = serializers.CharField(source="employment.position", read_only=True)
    role = serializers.CharField(source="employment.role", read_only=True)
    payment_type = serializers.CharField(source="compensation.payment_type", default=None, read_only=True)

    class Meta:
        model = PayrollRecord
        fields = [
            "id",
            "period",
            "employment",
            "user_email",
            "user_first_name",
            "user_last_name",
            "branch_name",
            "position",
            "role",
            "compensation",
            "payment_type",
            "hours_worked",
            "shifts_count",
            "base_amount",
            "bonus_amount",
            "total_amount",
            "notes",
        ]
        read_only_fields = [
            "id", "period", "employment", "compensation",
            "user_email", "user_first_name", "user_last_name",
            "branch_name", "position", "role", "payment_type",
            "hours_worked", "shifts_count",
            "base_amount", "bonus_amount", "total_amount",
        ]


class PayrollPeriodSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", default=None, read_only=True)
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)
    approved_by_email = serializers.EmailField(source="approved_by.email", default=None, read_only=True)
    record_count = serializers.IntegerField(source="records.count", read_only=True)
    total_amount = serializers.SerializerMethodField()

    def get_total_amount(self, obj):
        result = obj.records.aggregate(total=Sum("total_amount"))["total"]
        return str(result or Decimal("0.00"))

    class Meta:
        model = PayrollPeriod
        fields = [
            "id",
            "branch",
            "branch_name",
            "frequency",
            "start_date",
            "end_date",
            "status",
            "notes",
            "created_by",
            "created_by_email",
            "approved_by",
            "approved_by_email",
            "approved_at",
            "paid_at",
            "created_at",
            "record_count",
            "total_amount",
        ]
        read_only_fields = [
            "id", "status",
            "created_by", "created_by_email",
            "approved_by", "approved_by_email", "approved_at", "paid_at",
            "created_at",
            "record_count", "total_amount",
        ]


class PayrollPeriodDetailSerializer(PayrollPeriodSerializer):
    records = PayrollRecordSerializer(many=True, read_only=True)

    class Meta(PayrollPeriodSerializer.Meta):
        fields = PayrollPeriodSerializer.Meta.fields + ["records"]
