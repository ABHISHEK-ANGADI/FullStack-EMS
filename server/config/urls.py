from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import LoginView, MeView, ProfileView, ChangePasswordView
from departments.views import DepartmentViewSet
from employees.views import EmployeeViewSet
from attendance.views import (
    CheckInView, CheckOutView, TodayAttendanceView, MyAttendanceView,
    AttendanceViewSet,
)
from leaves.views import LeaveViewSet, LeaveBalanceView
from payroll.views import PayslipViewSet
from dashboard.views import AdminDashboardView, EmployeeDashboardView
from notifications.views import NotificationViewSet
from ai_agent.views import AIChatView 

router = DefaultRouter()
router.register("departments", DepartmentViewSet, basename="department")
router.register("employees", EmployeeViewSet, basename="employee")
router.register("attendance", AttendanceViewSet, basename="attendance-admin")
router.register("leaves", LeaveViewSet, basename="leave")
router.register("payslips", PayslipViewSet, basename="payslip")
router.register("notifications", NotificationViewSet, basename="notification")

urlpatterns = [
    path("admin/", admin.site.urls),

    # Auth
    path("api/auth/login/", LoginView.as_view(), name="login"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("api/auth/me/", MeView.as_view(), name="me"),

    # Profile
    path("api/profile/", ProfileView.as_view(), name="profile"),
    path("api/profile/change-password/", ChangePasswordView.as_view(), name="change-password"),

    # Attendance
    path("api/attendance/check-in/", CheckInView.as_view(), name="attendance-check-in"),
    path("api/attendance/check-out/", CheckOutView.as_view(), name="attendance-check-out"),
    path("api/attendance/today/", TodayAttendanceView.as_view(), name="attendance-today"),
    path("api/attendance/my/", MyAttendanceView.as_view(), name="attendance-my"),

    # Leaves
    path("api/leaves/balance/", LeaveBalanceView.as_view(), name="leave-balance"),

    # Dashboard
    path("api/dashboard/admin/", AdminDashboardView.as_view(), name="dashboard-admin"),
    path("api/dashboard/employee/", EmployeeDashboardView.as_view(), name="dashboard-employee"),

    # App API
    path("api/", include(router.urls)),

    # AI Agent
    path("api/ai-agent/chat/", AIChatView.as_view(), name="ai-chat"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)