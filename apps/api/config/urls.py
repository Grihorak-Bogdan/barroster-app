from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from audit_log.views import AuditLogViewSet
from notifications.views import NotificationViewSet
from payroll.views import PayrollPeriodViewSet, PayrollRecordViewSet
from branches.views import BranchViewSet
from employment.views import CompensationViewSet, EmploymentViewSet
from leave_requests.views import LeaveRequestViewSet
from shifts.views import ShiftAssignmentViewSet, ShiftViewSet, hours_summary
from users.views import register, me, change_password, users_list


def health_check(request):
    return JsonResponse({"status": "ok", "message": "BarRoster API is running"})


router = DefaultRouter()
router.register("audit-logs", AuditLogViewSet, basename="audit-logs")
router.register("notifications", NotificationViewSet, basename="notifications")
router.register("payroll-periods", PayrollPeriodViewSet, basename="payroll-periods")
router.register("payroll-records", PayrollRecordViewSet, basename="payroll-records")
router.register("branches", BranchViewSet, basename="branches")
router.register("employments", EmploymentViewSet, basename="employments")
router.register("compensations", CompensationViewSet, basename="compensations")
router.register("shifts", ShiftViewSet, basename="shifts")
router.register("shift-assignments", ShiftAssignmentViewSet, basename="shift-assignments")
router.register("leave-requests", LeaveRequestViewSet, basename="leave-requests")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    # Auth endpoints
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/register/", register, name="register"),
    path("api/auth/me/", me, name="me"),
    path("api/auth/change-password/", change_password, name="change_password"),
    path("api/users/", users_list, name="users_list"),
    path("api/reports/hours/", hours_summary, name="hours_summary"),
    path("", health_check),
]

if settings.DEBUG:
    urlpatterns += staticfiles_urlpatterns()
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
