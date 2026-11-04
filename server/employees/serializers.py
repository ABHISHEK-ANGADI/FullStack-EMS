from django.db import transaction
from rest_framework import serializers

from accounts.models import User
from departments.models import Department
from .models import Employee


class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "role")


class EmployeeSerializer(serializers.ModelSerializer):
    """Read serializer — camelCase for React."""
    user = UserMiniSerializer(read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    firstName = serializers.CharField(source="first_name")
    lastName = serializers.CharField(source="last_name")
    basicSalary = serializers.DecimalField(source="basic_salary", max_digits=12, decimal_places=2)
    joinDate = serializers.DateField(source="join_date")
    employmentStatus = serializers.CharField(source="employment_status")
    isDeleted = serializers.BooleanField(source="is_deleted", read_only=True)
    employeeId = serializers.CharField(source="employee_id", read_only=True)
    department = serializers.CharField(source="department.name", read_only=True)
    department_id = serializers.IntegerField(source="department.id", read_only=True)

    class Meta:
        model = Employee
        fields = (
            "id", "employeeId", "user", "email",
            "firstName", "lastName", "phone",
            "department", "department_id",
            "position", "basicSalary", "allowances", "deductions",
            "employmentStatus", "joinDate", "bio", "isDeleted",
            "created_at",
        )


class EmployeeCreateSerializer(serializers.Serializer):
    """Create serializer — creates User + Employee atomically."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    firstName = serializers.CharField(max_length=100)
    lastName = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")
    department_id = serializers.IntegerField()
    position = serializers.CharField(max_length=100)
    basicSalary = serializers.DecimalField(max_digits=12, decimal_places=2)
    allowances = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    deductions = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    employmentStatus = serializers.ChoiceField(choices=["ACTIVE", "INACTIVE"], default="ACTIVE")
    joinDate = serializers.DateField()
    bio = serializers.CharField(required=False, allow_blank=True, default="")
    role = serializers.ChoiceField(choices=["ADMIN", "HR", "EMPLOYEE"], default="EMPLOYEE")

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value

    def validate_department_id(self, value):
        if not Department.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Department not found.")
        return value

    def create(self, validated_data):
        with transaction.atomic():
            user = User.objects.create_user(
                email=validated_data["email"],
                password=validated_data["password"],
                role=validated_data.get("role", "EMPLOYEE"),
            )
            return Employee.objects.create(
                user=user,
                first_name=validated_data["firstName"],
                last_name=validated_data["lastName"],
                phone=validated_data.get("phone", ""),
                department_id=validated_data["department_id"],
                position=validated_data["position"],
                basic_salary=validated_data["basicSalary"],
                allowances=validated_data.get("allowances", 0),
                deductions=validated_data.get("deductions", 0),
                employment_status=validated_data.get("employmentStatus", "ACTIVE"),
                join_date=validated_data["joinDate"],
                bio=validated_data.get("bio", ""),
            )


class EmployeeUpdateSerializer(serializers.ModelSerializer):
    """Update serializer — accepts camelCase, optionally resets password."""
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    firstName = serializers.CharField(source="first_name", required=False)
    lastName = serializers.CharField(source="last_name", required=False)
    basicSalary = serializers.DecimalField(
        source="basic_salary", max_digits=12, decimal_places=2, required=False
    )
    employmentStatus = serializers.CharField(source="employment_status", required=False)
    joinDate = serializers.DateField(source="join_date", required=False)
    department_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Employee
        fields = (
            "firstName", "lastName", "phone", "department_id", "position",
            "basicSalary", "allowances", "deductions", "employmentStatus",
            "joinDate", "bio", "password",
        )

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        department_id = validated_data.pop("department_id", None)

        if department_id is not None:
            if not Department.objects.filter(id=department_id, is_active=True).exists():
                raise serializers.ValidationError({"department_id": "Department not found."})
            instance.department_id = department_id

        if password:
            instance.user.set_password(password)
            instance.user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance