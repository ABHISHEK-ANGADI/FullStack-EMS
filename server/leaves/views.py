from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from notifications.utils import notify, notify_admins
from notifications.models import Notification

from .models import LeaveRequest, LeaveBalance
from .serializers import (
    LeaveRequestSerializer,
    LeaveCreateSerializer,
    LeaveBalanceSerializer,
)


def _get_employee_or_none(user):
    try:
        return user.employee
    except Exception:
        return None


def _ensure_balances(employee, year):
    """Ensure balance rows exist for a given year. Returns dict {leave_type: LeaveBalance}."""
    DEFAULT_ALLOCATIONS = {"SICK": 10, "CASUAL": 12, "ANNUAL": 20}
    result = {}
    for lt, alloc in DEFAULT_ALLOCATIONS.items():
        obj, _ = LeaveBalance.objects.get_or_create(
            employee=employee,
            year=year,
            leave_type=lt,
            defaults={"allocated": alloc},
        )
        result[lt] = obj
    return result


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "ADMIN"


class LeaveViewSet(viewsets.ModelViewSet):
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]  # no PUT/PATCH/DELETE

    def get_queryset(self):
        user = self.request.user
        qs = LeaveRequest.objects.select_related(
            "employee", "employee__user", "employee__department", "reviewed_by"
        )
        if user.role != "ADMIN":
            emp = _get_employee_or_none(user)
            if not emp:
                return LeaveRequest.objects.none()
            qs = qs.filter(employee=emp)

        # filters for admin
        status_param = self.request.query_params.get("status")
        employee_param = self.request.query_params.get("employee")
        if status_param:
            qs = qs.filter(status=status_param)
        if employee_param and user.role == "ADMIN":
            qs = qs.filter(employee_id=employee_param)
        return qs

    def create(self, request, *args, **kwargs):
        employee = _get_employee_or_none(request.user)
        if employee is None:
            return Response(
                {"detail": "Only users with an employee profile can apply for leave."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if employee.is_deleted:
            return Response(
                {"detail": "Your employee record has been deactivated."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = LeaveCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        start, end = data["startDate"], data["endDate"]
        leave_type = data["leaveType"]
        days = (end - start).days + 1

        # Overlap check
        overlap = LeaveRequest.objects.filter(
            employee=employee,
            status__in=[LeaveRequest.STATUS_PENDING, LeaveRequest.STATUS_APPROVED],
            start_date__lte=end,
            end_date__gte=start,
        ).exists()
        if overlap:
            return Response(
                {"detail": "You already have a pending or approved leave overlapping these dates."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Balance check for managed types
        if leave_type in LeaveRequest.MANAGED_TYPES:
            balances = _ensure_balances(employee, start.year)
            bal = balances.get(leave_type)
            if not bal or bal.remaining < days:
                available = bal.remaining if bal else 0
                return Response(
                    {"detail": f"Insufficient {leave_type.lower()} leave balance. "
                               f"Requested {days} day(s), available {available}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        leave = LeaveRequest.objects.create(
            employee=employee,
            leave_type=leave_type,
            start_date=start,
            end_date=end,
            reason=data["reason"],
            status=LeaveRequest.STATUS_PENDING,
        )
        notify_admins(
            type=Notification.TYPE_LEAVE_APPLIED,
            title="New Leave Application",
            message=(
                f"{employee.first_name} {employee.last_name} applied for "
                f"{leave_type.lower()} leave ({start} to {end}, {days} day(s))."
            ),
            link="/leave",
        )
        return Response(
            LeaveRequestSerializer(leave).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdmin])
    def approve(self, request, pk=None):
        leave = self.get_object()
        if leave.status != LeaveRequest.STATUS_PENDING:
            return Response(
                {"detail": "Only pending leaves can be approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            if leave.leave_type in LeaveRequest.MANAGED_TYPES:
                balances = _ensure_balances(leave.employee, leave.start_date.year)
                bal = balances.get(leave.leave_type)
                if not bal or bal.remaining < leave.days:
                    return Response(
                        {"detail": "Insufficient balance to approve this request."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                bal.used += leave.days
                bal.save(update_fields=["used"])

            leave.status = LeaveRequest.STATUS_APPROVED
            leave.reviewed_by = request.user
            leave.reviewed_at = timezone.now()
            leave.review_comment = request.data.get("review_comment", "")
            leave.save()
            notify(
                user=leave.employee.user,
                type=Notification.TYPE_LEAVE_APPROVED,
                title="Leave Approved",
                message=(
                    f"Your {leave.leave_type.lower()} leave "
                    f"({leave.start_date} to {leave.end_date}) has been approved."
                ),
                link="/leave",
            )


        return Response(LeaveRequestSerializer(leave).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdmin])
    def reject(self, request, pk=None):
        leave = self.get_object()
        if leave.status != LeaveRequest.STATUS_PENDING:
            return Response(
                {"detail": "Only pending leaves can be rejected."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        leave.status = LeaveRequest.STATUS_REJECTED
        leave.reviewed_by = request.user
        leave.reviewed_at = timezone.now()
        leave.review_comment = request.data.get("review_comment", "")
        leave.save()
        notify(
            user=leave.employee.user,
            type=Notification.TYPE_LEAVE_REJECTED,
            title="Leave Rejected",
            message=(
                f"Your {leave.leave_type.lower()} leave "
                f"({leave.start_date} to {leave.end_date}) has been rejected."
            ),
            link="/leave",
        )
        return Response(LeaveRequestSerializer(leave).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        leave = self.get_object()
        # Only owner can cancel
        emp = _get_employee_or_none(request.user)
        if not emp or leave.employee_id != emp.id:
            return Response(
                {"detail": "You can only cancel your own leave requests."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if leave.status != LeaveRequest.STATUS_PENDING:
            return Response(
                {"detail": "Only pending leaves can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        leave.status = LeaveRequest.STATUS_CANCELLED
        leave.save()
        return Response(LeaveRequestSerializer(leave).data)


class LeaveBalanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        employee = _get_employee_or_none(request.user)
        if not employee:
            return Response({"results": [], "hasEmployee": False})
        year = int(request.query_params.get("year", timezone.localdate().year))
        _ensure_balances(employee, year)
        qs = LeaveBalance.objects.filter(employee=employee, year=year)
        return Response({
            "results": LeaveBalanceSerializer(qs, many=True).data,
            "hasEmployee": True,
            "year": year,
        })