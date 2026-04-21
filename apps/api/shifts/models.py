from uuid import uuid4

from django.conf import settings
from django.db import models


class ShiftStatus(models.TextChoices):
    PLANNED = "planned", "Planned"
    CONFIRMED = "confirmed", "Confirmed"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


class AssignmentStatus(models.TextChoices):
    ASSIGNED = "assigned", "Assigned"
    ACCEPTED = "accepted", "Accepted"
    REJECTED = "rejected", "Rejected"


class Shift(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    branch = models.ForeignKey(
        "branches.Branch",
        on_delete=models.CASCADE,
        related_name="shifts",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_shifts",
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(
        max_length=30,
        choices=ShiftStatus.choices,
        default=ShiftStatus.PLANNED,
    )
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "shifts"
        ordering = ["-start_time"]

    def __str__(self):
        return f"{self.branch.name} | {self.start_time} - {self.end_time}"


class ShiftAssignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    shift = models.ForeignKey(
        Shift,
        on_delete=models.CASCADE,
        related_name="assignments",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="shift_assignments",
    )
    status = models.CharField(
        max_length=30,
        choices=AssignmentStatus.choices,
        default=AssignmentStatus.ASSIGNED,
    )
    check_in_time = models.DateTimeField(blank=True, null=True)
    check_out_time = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "shift_assignments"
        ordering = ["-shift__start_time"]
        constraints = [
            models.UniqueConstraint(
                fields=["shift", "user"],
                name="unique_user_shift_assignment",
            )
        ]

    def __str__(self):
        return f"{self.user.email} -> {self.shift}"