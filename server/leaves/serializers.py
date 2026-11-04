from rest_framework import serializers
from .models import LeaveRequest, LeaveBalance


class LeaveRequestSerializer(serializers.ModelSerializer):
    """Read serializer — camelCase."""
    employeeId = serializers.IntegerField(source="employee.id", read_only=True)
    employeeName = serializers.SerializerMethodField()
    employeeCode = serializers.CharField(source="employee.employee_id", read_only=True)
    department = serializers.CharField(source="employee.department.name", read_only=True)
    leaveType = serializers.CharField(source="leave_type", read_only=True)
    startDate = serializers.DateField(source="start_date", read_only=True)
    endDate = serializers.DateField(source="end_date", read_only=True)
    reviewedBy = serializers.SerializerMethodField()
    reviewedAt = serializers.DateTimeField(source="reviewed_at", read_only=True, allow_null=True)
    reviewComment = serializers.CharField(source="review_comment", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = LeaveRequest
        fields = (
            "id", "employeeId", "employeeName", "employeeCode", "department",
            "leaveType", "startDate", "endDate", "days", "reason",
            "status", "reviewedBy", "reviewedAt", "reviewComment", "createdAt",
        )

    def get_employeeName(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"

    def get_reviewedBy(self, obj):
        if not obj.reviewed_by:
            return None
        return {
            "id": obj.reviewed_by.id,
            "email": obj.reviewed_by.email,
            "role": obj.reviewed_by.role,
        }


class LeaveCreateSerializer(serializers.Serializer):
    leaveType = serializers.ChoiceField(
        choices=["SICK", "CASUAL", "ANNUAL", "UNPAID"]
    )
    startDate = serializers.DateField()
    endDate = serializers.DateField()
    reason = serializers.CharField()

    def validate(self, attrs):
        if attrs["endDate"] < attrs["startDate"]:
            raise serializers.ValidationError(
                {"endDate": "End date must be on or after start date."}
            )
        if not attrs["reason"].strip():
            raise serializers.ValidationError({"reason": "Reason is required."})
        return attrs


class LeaveBalanceSerializer(serializers.ModelSerializer):
    leaveType = serializers.CharField(source="leave_type", read_only=True)
    remaining = serializers.IntegerField(read_only=True)

    class Meta:
        model = LeaveBalance
        fields = ("id", "year", "leaveType", "allocated", "used", "remaining")