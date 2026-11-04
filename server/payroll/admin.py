from django.contrib import admin
from .models import Payslip


@admin.register(Payslip)
class PayslipAdmin(admin.ModelAdmin):
    list_display = (
        "id", "employee_name", "month", "year",
        "basic_salary", "allowances", "deductions", "net_salary",
        "status", "created_at",
    )
    list_filter = ("status", "year", "month")
    search_fields = (
        "employee__first_name", "employee__last_name",
        "employee__employee_id", "employee__user__email",
    )
    readonly_fields = ("net_salary", "created_at", "updated_at")

    def employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"
    employee_name.short_description = "Employee"