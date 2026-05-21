from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ("branch_created", "Branch Created"),
        ("branch_updated", "Branch Updated"),
        ("branch_deleted", "Branch Deleted"),
        ("employment_created", "Employment Created"),
        ("employment_updated", "Employment Updated"),
        ("employment_deleted", "Employment Deleted"),
        ("shift_created", "Shift Created"),
        ("shift_updated", "Shift Updated"),
        ("shift_cancelled", "Shift Cancelled"),
        ("assignment_created", "Assignment Created"),
        ("assignment_removed", "Assignment Removed"),
        ("assignment_checked_in", "Assignment Checked In"),
        ("assignment_checked_out", "Assignment Checked Out"),
        ("leave_created", "Leave Created"),
        ("leave_approved", "Leave Approved"),
        ("leave_rejected", "Leave Rejected"),
        ("leave_cancelled", "Leave Cancelled"),
        ("payroll_created", "Payroll Created"),
        ("payroll_generated", "Payroll Generated"),
        ("payroll_approved", "Payroll Approved"),
        ("payroll_paid", "Payroll Paid"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=64, choices=ACTION_CHOICES, db_index=True)
    resource_type = models.CharField(max_length=64, db_index=True)
    resource_id = models.CharField(max_length=64, blank=True)
    resource_name = models.CharField(max_length=256, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"

    def __str__(self):
        actor = self.user.email if self.user else "system"
        return f"{actor} | {self.action} | {self.resource_name}"
