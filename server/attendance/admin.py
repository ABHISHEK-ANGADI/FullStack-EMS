from django.contrib import admin
from .models import Attendance


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = (
        "id", "employee_name", "date", "check_in", "check_out",
        "working_hours", "day_type", "status",
    )
    list_filter = ("status", "day_type", "date")
    search_fields = (
        "employee__first_name", "employee__last_name",
        "employee__employee_id", "employee__user__email",
    )
    readonly_fields = ("created_at", "updated_at")

    def employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"
    employee_name.short_description = "Employee"