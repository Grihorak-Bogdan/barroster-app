from rest_framework import serializers

from .models import Notification, NotificationRead


class NotificationSerializer(serializers.ModelSerializer):
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "scope",
            "type",
            "title",
            "body",
            "resource_type",
            "resource_id",
            "is_read",
            "read_at",
            "created_at",
        ]
        read_only_fields = fields

    def get_is_read(self, obj: Notification) -> bool:
        if obj.scope == Notification.SCOPE_PRIVATE:
            return obj.read_at is not None
        # Global: check per-user read record
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        # Use prefetched reads if available to avoid N+1
        if hasattr(obj, "_prefetched_reads"):
            return obj._prefetched_reads
        return NotificationRead.objects.filter(notification=obj, user=request.user).exists()
