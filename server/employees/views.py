from rest_framework import viewsets, status, filters
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Employee
from .serializers import (
    EmployeeSerializer,
    EmployeeCreateSerializer,
    EmployeeUpdateSerializer,
)


class IsAdminOrSelfReadOnly(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role == "ADMIN":
            return True
        return view.action in ["list", "retrieve"]

    def has_object_permission(self, request, view, obj):
        if request.user.role == "ADMIN":
            return True
        return obj.user_id == request.user.id


class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    permission_classes = [IsAdminOrSelfReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["department", "employment_status"]
    search_fields = ["first_name", "last_name", "position", "user__email"]

    def get_queryset(self):
        user = self.request.user
        qs = Employee.objects.select_related("user", "department").filter(is_deleted=False)
        if user.role != "ADMIN":
            qs = qs.filter(user=user)
        return qs

    def get_serializer_class(self):
        if self.action == "create":
            return EmployeeCreateSerializer
        if self.action in ["update", "partial_update"]:
            return EmployeeUpdateSerializer
        return EmployeeSerializer

    def create(self, request, *args, **kwargs):
        if request.user.role != "ADMIN":
            return Response(
                {"detail": "Only admins can create employees."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        employee = serializer.save()
        return Response(
            EmployeeSerializer(employee).data,
            status=status.HTTP_201_CREATED,
        )

    def destroy(self, request, *args, **kwargs):
        if request.user.role != "ADMIN":
            return Response(
                {"detail": "Only admins can delete employees."},
                status=status.HTTP_403_FORBIDDEN,
            )
        instance = self.get_object()
        instance.is_deleted = True
        instance.save(update_fields=["is_deleted"])
        return Response(status=status.HTTP_204_NO_CONTENT)