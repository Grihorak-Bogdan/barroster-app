from .models import Notification


def notify_user(user, notif_type: str, title: str, body: str = "", resource_type: str = "", resource_id: str = ""):
    """Create a private notification for a single user."""
    Notification.objects.create(
        user=user,
        scope=Notification.SCOPE_PRIVATE,
        type=notif_type,
        title=title,
        body=body,
        resource_type=resource_type,
        resource_id=str(resource_id),
    )


def notify_users(users, notif_type: str, title: str, body: str = "", resource_type: str = "", resource_id: str = ""):
    """Bulk-create private notifications for multiple users in one query."""
    Notification.objects.bulk_create([
        Notification(
            user=u,
            scope=Notification.SCOPE_PRIVATE,
            type=notif_type,
            title=title,
            body=body,
            resource_type=resource_type,
            resource_id=str(resource_id),
        )
        for u in users
    ])


def broadcast_notification(notif_type: str, title: str, body: str = "", resource_type: str = "", resource_id: str = ""):
    """Create a single global notification visible to all authenticated users."""
    return Notification.objects.create(
        user=None,
        scope=Notification.SCOPE_GLOBAL,
        type=notif_type,
        title=title,
        body=body,
        resource_type=resource_type,
        resource_id=str(resource_id),
    )
