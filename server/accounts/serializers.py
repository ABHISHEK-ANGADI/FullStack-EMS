from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "role")
        read_only_fields = fields


class ProfileSerializer(serializers.ModelSerializer):
    """Merged User + Employee profile for /api/profile/."""
    firstName = serializers.SerializerMethodField()
    lastName = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    position = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    department_id = serializers.SerializerMethodField()
    joinDate = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    employeeId = serializers.SerializerMethodField()
    isDeleted = serializers.SerializerMethodField()
    hasEmployee = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "email", "role", "first_name", "last_name",
            "firstName", "lastName", "employeeId", "phone", "position",
            "department", "department_id", "joinDate", "bio", "image",
            "isDeleted", "hasEmployee",
        )

    def _emp(self, obj):
        return getattr(obj, "employee", None)

    def get_firstName(self, obj):
        emp = self._emp(obj)
        return emp.first_name if emp else obj.first_name

    def get_lastName(self, obj):
        emp = self._emp(obj)
        return emp.last_name if emp else obj.last_name

    def get_phone(self, obj):
        emp = self._emp(obj)
        return emp.phone if emp else ""

    def get_position(self, obj):
        emp = self._emp(obj)
        return emp.position if emp else ""

    def get_department(self, obj):
        emp = self._emp(obj)
        return emp.department.name if emp and emp.department else ""

    def get_department_id(self, obj):
        emp = self._emp(obj)
        return emp.department.id if emp and emp.department else None

    def get_joinDate(self, obj):
        emp = self._emp(obj)
        return emp.join_date if emp else None

    def get_bio(self, obj):
        emp = self._emp(obj)
        return emp.bio if emp else ""

    def get_image(self, obj):
        emp = self._emp(obj)
        if emp and emp.image:
            request = self.context.get("request")
            return request.build_absolute_uri(emp.image.url) if request else emp.image.url
        return None

    def get_employeeId(self, obj):
        emp = self._emp(obj)
        return emp.employee_id if emp else None

    def get_isDeleted(self, obj):
        emp = self._emp(obj)
        return emp.is_deleted if emp else False

    def get_hasEmployee(self, obj):
        return self._emp(obj) is not None


class ProfileUpdateSerializer(serializers.Serializer):
    """PATCH updates User name (always) + Employee phone/bio (if exists)."""
    firstName = serializers.CharField(required=False, allow_blank=True)
    lastName = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)

    def update(self, instance, validated_data):
        # Sync User name
        if "firstName" in validated_data:
            instance.first_name = validated_data["firstName"]
        if "lastName" in validated_data:
            instance.last_name = validated_data["lastName"]
        instance.save()

        # Update Employee if exists
        emp = getattr(instance, "employee", None)
        if emp:
            if "firstName" in validated_data:
                emp.first_name = validated_data["firstName"]
            if "lastName" in validated_data:
                emp.last_name = validated_data["lastName"]
            if "phone" in validated_data:
                emp.phone = validated_data["phone"]
            if "bio" in validated_data:
                emp.bio = validated_data["bio"]
            emp.save()

        return instance