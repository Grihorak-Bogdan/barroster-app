from uuid import uuid4

from django.conf import settings
from django.db import models


class EmploymentStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    TERMINATED = "terminated", "Terminated"
    SUSPENDED = "suspended", "Suspended"


class EmploymentRole(models.TextChoices):
    OWNER = "owner", "Owner"
    MANAGER = "manager", "Manager"
    SUPERVISOR = "supervisor", "Supervisor"
    STAFF = "staff", "Staff"


class PaymentType(models.TextChoices):
    HOURLY = "hourly", "Hourly"
    MONTHLY = "monthly", "Monthly"
    SHIFT_BASED = "shift_based", "Shift based"


class BonusType(models.TextChoices):
    NONE = "none", "None"
    FIXED = "fixed", "Fixed"
    PERCENT = "percent", "Percent"


class Employment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="employments",
    )
    branch = models.ForeignKey(
        "branches.Branch",
        on_delete=models.CASCADE,
        related_name="employments",
    )
    position = models.CharField(max_length=100)
    role = models.CharField(max_length=30, choices=EmploymentRole.choices)
    hire_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    status = models.CharField(
        max_length=30,
        choices=EmploymentStatus.choices,
        default=EmploymentStatus.ACTIVE,
    )
    termination_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "employment"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "branch", "hire_date"],
                name="unique_employment_per_user_branch_hire_date",
            )
        ]

    def __str__(self):
        return f"{self.user.email} - {self.position} ({self.branch.name})"


class Compensation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    employment = models.ForeignKey(
        Employment,
        on_delete=models.CASCADE,
        related_name="compensations",
    )
    payment_type = models.CharField(max_length=30, choices=PaymentType.choices)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    base_salary = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    bonus_type = models.CharField(
        max_length=20,
        choices=BonusType.choices,
        default=BonusType.NONE,
    )
    bonus_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    effective_from = models.DateField()
    effective_to = models.DateField(blank=True, null=True)

    class Meta:
        db_table = "compensation"
        ordering = ["-effective_from"]

    def __str__(self):
        return f"{self.employment.user.email} - {self.payment_type}"