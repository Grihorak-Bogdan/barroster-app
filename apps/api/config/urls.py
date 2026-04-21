from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from branches.views import BranchViewSet
from employment.views import CompensationViewSet, EmploymentViewSet
from shifts.views import ShiftAssignmentViewSet, ShiftViewSet


def health_check(request):
    return JsonResponse({"status": "ok", "message": "BarRoster API is running"})


router = DefaultRouter()
router.register("branches", BranchViewSet, basename="branches")
router.register("employments", EmploymentViewSet, basename="employments")
router.register("compensations", CompensationViewSet, basename="compensations")
router.register("shifts", ShiftViewSet, basename="shifts")
router.register("shift-assignments", ShiftAssignmentViewSet, basename="shift-assignments")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("", health_check),
]

if settings.DEBUG:
    urlpatterns += staticfiles_urlpatterns()
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)