from django.contrib import admin

from .models import Branch


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ("name", "address", "created_at")
    search_fields = ("name", "address")
    ordering = ("name",)