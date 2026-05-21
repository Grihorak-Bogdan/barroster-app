from uuid import uuid4

from django.conf import settings
from django.db import models


class PayrollPeriod(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        APPROVED = "approved", "Approved"
        PAID = "paid", "Paid"

    class Frequency(models.TextChoices):
        WEEKLY = "weekly", "Weekly"
        BIWEEKLY = "biweekly", "Bi-Weekly"
        MONTHLY = "monthly", "Monthly"

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    branch = models.ForeignKey(
        "branches.Branch",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="payroll_periods",
    )
    frequency = models.CharField(max_length=20, choices=Frequency.choices, default=Frequency.MONTHLY)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_payrolls",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_payrolls",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-start_date"]
        verbose_name = "Payroll Period"
        verbose_name_plural = "Payroll Periods"

    def __str__(self):
        branch_str = self.branch.name if self.branch else "All Branches"
        return f"{branch_str} · {self.start_date} – {self.end_date}"


class PayrollRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    period = models.ForeignKey(PayrollPeriod, on_delete=models.CASCADE, related_name="records")
    employment = models.ForeignKey(
        "employment.Employment", on_delete=models.PROTECT, related_name="payroll_records"
    )
    compensation = models.ForeignKey(
        "employment.Compensation", on_delete=models.SET_NULL, null=True, blank=True
    )
    hours_worked = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    shifts_count = models.PositiveIntegerField(default=0)
    base_amount = models.DecimalField(max_digits=12, decimal_places=2)
    bonus_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ["period", "employment"]
        ordering = ["employment__user__last_name", "employment__user__email"]

    def __str__(self):
        return f"{self.employment.user.email} · {self.period}"
