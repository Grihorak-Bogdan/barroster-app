from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_first_name = serializers.CharField(source="user.first_name", read_only=True)
    user_last_name = serializers.CharField(source="user.last_name", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "user",
            "user_email",
            "user_first_name",
            "user_last_name",
            "action",
            "resource_type",
            "resource_id",
            "resource_name",
            "metadata",
            "ip_address",
            "created_at",
        ]
        read_only_fields = fields
