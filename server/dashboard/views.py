from django.db.models import Sum
from django.utils import timezone
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from employees.models import Employee
from departments.models import Department
from attendance.models import Attendance
from leaves.models import LeaveRequest, LeaveBalance
from payroll.models import Payslip


def _get_employee_or_none(user):
    try:
        return user.employee
    except Exception:
        return None


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "ADMIN"


class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        today = timezone.localdate()
        month, year = today.month, today.year

        total_employees = Employee.objects.filter(is_deleted=False).count()
        total_departments = Department.objects.filter(is_active=True).count()
        today_attendance = Attendance.objects.filter(date=today).count()
        pending_leaves = LeaveRequest.objects.filter(
            status=LeaveRequest.STATUS_PENDING
        ).count()

        # Payroll total for current month (both DRAFT and PAID)
        payroll_agg = Payslip.objects.filter(month=month, year=year).aggregate(
            total=Sum("net_salary")
        )
        monthly_payroll = payroll_agg["total"] or 0

        # How many distinct employees are on approved leave today
        on_leave_today = (
            LeaveRequest.objects.filter(
                status=LeaveRequest.STATUS_APPROVED,
                start_date__lte=today,
                end_date__gte=today,
            )
            .values("employee")
            .distinct()
            .count()
        )

        # Today's attendance breakdown by status
        present = Attendance.objects.filter(date=today, status="PRESENT").count()
        late = Attendance.objects.filter(date=today, status="LATE").count()

        return Response({
            "role": "ADMIN",
            "totalEmployees": total_employees,
            "totalDepartments": total_departments,
            "todayAttendance": today_attendance,
            "pendingLeaves": pending_leaves,
            "monthlyPayroll": str(monthly_payroll),
            "onLeaveToday": on_leave_today,
            "presentToday": present,
            "lateToday": late,
            "currentMonth": month,
            "currentYear": year,
        })


class EmployeeDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        employee = _get_employee_or_none(request.user)

        if not employee:
            return Response({
                "role": "EMPLOYEE",
                "hasEmployee": False,
            })

        today = timezone.localdate()
        month_start = today.replace(day=1)

        # Attendance this month (PRESENT or LATE = "days present")
        current_month_attendance = Attendance.objects.filter(
            employee=employee,
            date__gte=month_start,
            date__lte=today,
            status__in=["PRESENT", "LATE"],
        ).count()

        pending_leaves = LeaveRequest.objects.filter(
            employee=employee,
            status=LeaveRequest.STATUS_PENDING,
        ).count()

        # Leave balance — sum of remaining across all types for current year
        balances = LeaveBalance.objects.filter(
            employee=employee, year=today.year
        )
        leave_remaining = sum(b.remaining for b in balances)
        leave_allocated = sum(b.allocated for b in balances)

        latest_payslip = (
            Payslip.objects.filter(employee=employee)
            .order_by("-year", "-month")
            .first()
        )

        return Response({
            "role": "EMPLOYEE",
            "hasEmployee": True,
            "employee": {
                "id": employee.id,
                "employeeId": employee.employee_id,
                "firstName": employee.first_name,
                "lastName": employee.last_name,
                "position": employee.position,
                "department": employee.department.name if employee.department else "",
            },
            "currentMonthAttendance": current_month_attendance,
            "pendingLeaves": pending_leaves,
            "leaveRemaining": leave_remaining,
            "leaveAllocated": leave_allocated,
            "latestPayslip": (
                {
                    "id": latest_payslip.id,
                    "month": latest_payslip.month,
                    "year": latest_payslip.year,
                    "netSalary": str(latest_payslip.net_salary),
                    "status": latest_payslip.status,
                }
                if latest_payslip
                else None
            ),
        })