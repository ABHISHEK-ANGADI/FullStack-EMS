from rest_framework import viewsets, status
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response

from .models import Payslip
from .serializers import PayslipSerializer, PayslipCreateSerializer
from notifications.utils import notify
from notifications.models import Notification

def _get_employee_or_none(user):
    try:
        return user.employee
    except Exception:
        return None

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "ADMIN"

class PayslipViewSet(viewsets.ModelViewSet):
    serializer_class = PayslipSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        qs = Payslip.objects.select_related(
            "employee", "employee__user", "employee__department", "generated_by"
        )
        if user.role != "ADMIN":
            emp = _get_employee_or_none(user)
            if not emp:
                return Payslip.objects.none()
            qs = qs.filter(employee=emp)

        employee_param = self.request.query_params.get("employee")
        month_param = self.request.query_params.get("month")
        year_param = self.request.query_params.get("year")
        if employee_param and user.role == "ADMIN":
            qs = qs.filter(employee_id=employee_param)
        if month_param:
            qs = qs.filter(month=int(month_param))
        if year_param:
            qs = qs.filter(year=int(year_param))
        return qs

    def create(self, request, *args, **kwargs):
        if request.user.role != "ADMIN":
            return Response(
                {"detail": "Only admins can generate payslips."},
                status=status.HTTP_403_FORBIDDEN,
            )
            
        serializer = PayslipCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        emp = data["employee"]

        # 1. Create the Payslip FIRST
        payslip = Payslip.objects.create(
            employee=emp,
            month=data["month"],
            year=data["year"],
            basic_salary=data.get("basicSalary", emp.basic_salary),
            allowances=data.get("allowances", emp.allowances),
            deductions=data.get("deductions", emp.deductions),
            status=data.get("status", Payslip.STATUS_DRAFT),
            generated_by=request.user,
            notes=data.get("notes", ""),
        )

        # 2. Send the Notification SECOND (wrapped in try/except so it doesn't crash the API)
        try:
            notify(
                user=emp.user,
                type=Notification.TYPE_PAYSLIP_GENERATED,
                title="New Payslip Available",
                message=(
                    f"Your payslip for {payslip.month}/{payslip.year} is ready. "
                    f"Net salary: ${payslip.net_salary}."
                ),
                link="/payslips",
            )
        except Exception as e:
            print(f"Notification failed: {e}")

        # 3. Return the Response
        return Response(
            PayslipSerializer(payslip).data,
            status=status.HTTP_201_CREATED,
        )

    def destroy(self, request, *args, **kwargs):
        return Response(
            {"detail": "Payslips cannot be deleted. Contact admin."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )