from django.contrib import admin
from .models import LeaveRequest, LeaveBalance


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = (
        "id", "employee_name", "leave_type", "start_date", "end_date",
        "days", "status", "reviewed_by", "created_at",
    )
    list_filter = ("status", "leave_type", "start_date")
    search_fields = (
        "employee__first_name", "employee__last_name",
        "employee__employee_id", "reason",
    )
    readonly_fields = ("days", "created_at", "updated_at", "reviewed_at")

    def employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"
    employee_name.short_description = "Employee"


@admin.register(LeaveBalance)
class LeaveBalanceAdmin(admin.ModelAdmin):
    list_display = ("employee", "year", "leave_type", "allocated", "used", "remaining")
    list_filter = ("year", "leave_type")
    search_fields = ("employee__first_name", "employee__last_name", "employee__employee_id")