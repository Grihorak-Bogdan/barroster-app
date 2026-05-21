def _get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def log_action(request, action, resource_type, resource_id="", resource_name="", metadata=None):
    from .models import AuditLog  # local import to avoid circular deps

    user = request.user if hasattr(request, "user") and request.user.is_authenticated else None
    AuditLog.objects.create(
        user=user,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        resource_name=resource_name,
        metadata=metadata or {},
        ip_address=_get_client_ip(request),
    )
