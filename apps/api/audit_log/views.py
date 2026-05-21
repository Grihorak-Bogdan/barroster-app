from rest_framework import viewsets

from config.permissions import IsManagerOrAbove
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [IsManagerOrAbove]

    def get_queryset(self):
        qs = AuditLog.objects.select_related("user").all()
        params = self.request.query_params
        if action := params.get("action"):
            qs = qs.filter(action=action)
        if resource_type := params.get("resource_type"):
            qs = qs.filter(resource_type=resource_type)
        if limit := params.get("limit"):
            try:
                qs = qs[: int(limit)]
            except (ValueError, TypeError):
                pass
        return qs
