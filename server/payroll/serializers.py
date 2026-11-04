from rest_framework import serializers
from .models import Payslip


class PayslipSerializer(serializers.ModelSerializer):
    """Read serializer — camelCase for React."""
    employeeId = serializers.IntegerField(source="employee.id", read_only=True)
    employeeName = serializers.SerializerMethodField()
    employeeCode = serializers.CharField(source="employee.employee_id", read_only=True)
    department = serializers.CharField(source="employee.department.name", read_only=True)
    position = serializers.CharField(source="employee.position", read_only=True)
    email = serializers.CharField(source="employee.user.email", read_only=True)
    basicSalary = serializers.DecimalField(source="basic_salary", max_digits=12, decimal_places=2)
    netSalary = serializers.DecimalField(source="net_salary", max_digits=12, decimal_places=2)
    generatedBy = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Payslip
        fields = (
            "id", "employeeId", "employeeName", "employeeCode",
            "department", "position", "email",
            "month", "year", "basicSalary", "allowances", "deductions",
            "netSalary", "status", "notes", "generatedBy", "createdAt",
        )

    def get_employeeName(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"

    def get_generatedBy(self, obj):
        if not obj.generated_by:
            return None
        return {
            "id": obj.generated_by.id,
            "email": obj.generated_by.email,
            "role": obj.generated_by.role,
        }


class PayslipCreateSerializer(serializers.Serializer):
    """Admin creates a payslip. Salary fields pre-fill from Employee, can override."""
    employeeId = serializers.IntegerField()
    month = serializers.IntegerField(min_value=1, max_value=12)
    year = serializers.IntegerField(min_value=2000, max_value=2100)
    basicSalary = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    allowances = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    deductions = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    status = serializers.ChoiceField(choices=["DRAFT", "PAID"], default="DRAFT")
    notes = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        from employees.models import Employee
        try:
            emp = Employee.objects.get(id=attrs["employeeId"], is_deleted=False)
        except Employee.DoesNotExist:
            raise serializers.ValidationError({"employeeId": "Employee not found."})

        exists = Payslip.objects.filter(
            employee=emp, month=attrs["month"], year=attrs["year"]
        ).exists()
        if exists:
            raise serializers.ValidationError(
                {"detail": "A payslip already exists for this employee, month and year."}
            )

        attrs["employee"] = emp
        return attrs