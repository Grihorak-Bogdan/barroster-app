from django.contrib import admin

from .models import Shift, ShiftAssignment


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ("branch", "created_by", "start_time", "end_time", "status", "created_at")
    list_filter = ("status", "branch")
    search_fields = ("branch__name", "created_by__email")
    ordering = ("-start_time",)


@admin.register(ShiftAssignment)
class ShiftAssignmentAdmin(admin.ModelAdmin):
    list_display = ("shift", "user", "status", "check_in_time", "check_out_time")
    list_filter = ("status",)
    search_fields = ("user__email", "shift__branch__name")