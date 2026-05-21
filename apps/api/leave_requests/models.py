from uuid import uuid4

from django.conf import settings
from django.db import models


class LeaveType(models.TextChoices):
    DAY_OFF = "day_off", "Day Off"
    VACATION = "vacation", "Vacation"
    SICK_LEAVE = "sick_leave", "Sick Leave"


class LeaveStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"
    CANCELLED = "cancelled", "Cancelled"


class LeaveRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="leave_requests",
    )
    employment = models.ForeignKey(
        "employment.Employment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="leave_requests",
    )
    leave_type = models.CharField(max_length=20, choices=LeaveType.choices)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=LeaveStatus.choices,
        default=LeaveStatus.PENDING,
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_leave_requests",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "leave_requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} | {self.leave_type} | {self.start_date} – {self.end_date}"
