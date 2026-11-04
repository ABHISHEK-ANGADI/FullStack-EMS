from datetime import date as date_cls
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import Attendance
from .serializers import AttendanceSerializer


def _get_employee_or_none(user):
    """Return the Employee for a user, or None if no employee record."""
    try:
        return user.employee
    except Exception:
        return None


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "ADMIN"


class CheckInView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        employee = _get_employee_or_none(request.user)
        if employee is None:
            return Response(
                {"detail": "No employee record found for this user."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if employee.is_deleted:
            return Response(
                {"detail": "Your employee record has been deactivated."},
                status=status.HTTP_403_FORBIDDEN,
            )

        today = timezone.localdate()
        existing = Attendance.objects.filter(employee=employee, date=today).first()

        if existing and existing.check_in:
            return Response(
                {"detail": "You have already checked in today."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        record = existing or Attendance(employee=employee, date=today)
        record.check_in = now
        record.status = (
            Attendance.STATUS_LATE if record.is_late() else Attendance.STATUS_PRESENT
        )
        record.save()

        return Response(
            AttendanceSerializer(record).data,
            status=status.HTTP_201_CREATED,
        )


class CheckOutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        employee = _get_employee_or_none(request.user)
        if employee is None:
            return Response(
                {"detail": "No employee record found for this user."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        today = timezone.localdate()
        record = Attendance.objects.filter(employee=employee, date=today).first()

        if not record or not record.check_in:
            return Response(
                {"detail": "You haven't checked in today."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if record.check_out:
            return Response(
                {"detail": "You have already checked out today."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        record.check_out = timezone.now()
        record.working_hours = record.calculate_working_hours()
        record.day_type = record.calculate_day_type()
        record.save()

        return Response(AttendanceSerializer(record).data)


class TodayAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        employee = _get_employee_or_none(request.user)
        if employee is None:
            return Response({"record": None, "hasEmployee": False})

        today = timezone.localdate()
        record = Attendance.objects.filter(employee=employee, date=today).first()

        return Response({
            "record": AttendanceSerializer(record).data if record else None,
            "hasEmployee": True,
        })


class MyAttendanceView(APIView):
    """History — optional ?month=&year= filters."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        employee = _get_employee_or_none(request.user)
        if employee is None:
            return Response({"results": [], "hasEmployee": False})

        qs = Attendance.objects.filter(employee=employee)

        month = request.query_params.get("month")
        year = request.query_params.get("year")
        if month:
            qs = qs.filter(date__month=int(month))
        if year:
            qs = qs.filter(date__year=int(year))

        data = AttendanceSerializer(qs, many=True).data
        return Response({"results": data, "hasEmployee": True})


class AttendanceViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin-only view of all attendance records."""
    queryset = Attendance.objects.select_related("employee", "employee__user").all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


class AttendanceViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin-only: view all employees' attendance with filters."""
    queryset = Attendance.objects.select_related(
        "employee", "employee__user", "employee__department"
    ).all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["employee", "status"]
    search_fields = [
        "employee__first_name",
        "employee__last_name",
        "employee__employee_id",
        "employee__user__email",
    ]
    ordering_fields = ["date", "check_in", "working_hours"]
    ordering = ["-date"]

    def get_queryset(self):
        qs = super().get_queryset()
        month = self.request.query_params.get("month")
        year = self.request.query_params.get("year")
        if month:
            try:
                qs = qs.filter(date__month=int(month))
            except (ValueError, TypeError):
                pass
        if year:
            try:
                qs = qs.filter(date__year=int(year))
            except (ValueError, TypeError):
                pass
        return qs