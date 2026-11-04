from rest_framework import serializers
from .models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    employeeId = serializers.IntegerField(source="employee.id", read_only=True)
    employeeName = serializers.SerializerMethodField()
    employeeCode = serializers.CharField(source="employee.employee_id", read_only=True)
    department = serializers.CharField(source="employee.department.name", read_only=True)
    checkIn = serializers.DateTimeField(
        source="check_in", format="%Y-%m-%dT%H:%M:%S%z", allow_null=True
    )
    checkOut = serializers.DateTimeField(
        source="check_out", format="%Y-%m-%dT%H:%M:%S%z", allow_null=True
    )
    workingHours = serializers.DecimalField(
        source="working_hours", max_digits=5, decimal_places=2, allow_null=True
    )
    dayType = serializers.CharField(source="day_type", allow_blank=True)
    isCheckedIn = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = (
            "id", "employeeId", "employeeName", "employeeCode", "department",
            "date", "checkIn", "checkOut", "workingHours", "dayType",
            "status", "isCheckedIn",
        )

    def get_employeeName(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"

    def get_isCheckedIn(self, obj):
        return bool(obj.check_in and not obj.check_out)