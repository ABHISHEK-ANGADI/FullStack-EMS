from django.contrib import admin
from .models import Employee


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = (
        "employee_id", "first_name", "last_name", "user_email",
        "department", "position", "employment_status", "is_deleted",
    )
    list_filter = ("department", "employment_status", "is_deleted")
    search_fields = ("first_name", "last_name", "user__email", "position")
    readonly_fields = ("employee_id", "created_at", "updated_at")

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "Email"