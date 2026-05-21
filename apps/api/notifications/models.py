from django.conf import settings
from django.db import models


class Notification(models.Model):
    SCOPE_PRIVATE = "private"
    SCOPE_GLOBAL = "global"
    SCOPE_CHOICES = [
        (SCOPE_PRIVATE, "Private"),
        (SCOPE_GLOBAL, "Global"),
    ]

    TYPE_CHOICES = [
        ("leave_approved",     "Leave Approved"),
        ("leave_rejected",     "Leave Rejected"),
        ("shift_cancelled",    "Shift Cancelled"),
        ("assignment_created", "Assigned to Shift"),
        ("payroll_approved",   "Payroll Approved"),
        ("payroll_paid",       "Payroll Paid"),
        ("announcement",       "Announcement"),
    ]

    # null = global broadcast (no single recipient)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        null=True,
        blank=True,
    )
    scope = models.CharField(
        max_length=16,
        choices=SCOPE_CHOICES,
        default=SCOPE_PRIVATE,
        db_index=True,
    )
    type = models.CharField(max_length=64, choices=TYPE_CHOICES, db_index=True)
    title = models.CharField(max_length=256)
    body = models.TextField(blank=True)
    resource_type = models.CharField(max_length=64, blank=True)
    resource_id = models.CharField(max_length=64, blank=True)

    # Only used for private notifications
    read_at = models.DateTimeField(null=True, blank=True, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

    def __str__(self):
        target = self.user.email if self.user else "everyone"
        return f"{target} · {self.type} · {self.scope}"

    @property
    def is_read(self):
        return self.read_at is not None


class NotificationRead(models.Model):
    """Tracks per-user read state for global notifications."""

    notification = models.ForeignKey(
        Notification,
        on_delete=models.CASCADE,
        related_name="reads",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_reads",
    )
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["notification", "user"]
        verbose_name = "Notification Read"
