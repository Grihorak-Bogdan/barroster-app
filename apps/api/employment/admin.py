from django.contrib import admin

from .models import Compensation, Employment


@admin.register(Employment)
class EmploymentAdmin(admin.ModelAdmin):
    list_display = ("user", "branch", "position", "role", "status", "hire_date", "end_date")
    list_filter = ("role", "status", "branch")
    search_fields = ("user__email", "user__first_name", "user__last_name", "position", "branch__name")


@admin.register(Compensation)
class CompensationAdmin(admin.ModelAdmin):
    list_display = ("employment", "payment_type", "hourly_rate", "base_salary", "bonus_type", "bonus_value", "effective_from", "effective_to")
    list_filter = ("payment_type", "bonus_type")
    search_fields = ("employment__user__email", "employment__branch__name")