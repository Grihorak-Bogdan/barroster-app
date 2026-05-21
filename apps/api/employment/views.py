from rest_framework import viewsets

from audit_log.utils import log_action
from config.permissions import IsManagerOrAbove
from .models import Compensation, Employment
from .serializers import CompensationSerializer, EmploymentSerializer


class EmploymentViewSet(viewsets.ModelViewSet):
    serializer_class = EmploymentSerializer
    permission_classes = [IsManagerOrAbove]

    def get_queryset(self):
        qs = Employment.objects.select_related("user", "branch").prefetch_related("compensations")
        branch = self.request.query_params.get("branch")
        if branch:
            qs = qs.filter(branch_id=branch)
        return qs

    def perform_create(self, serializer):
        emp = serializer.save()
        log_action(
            self.request,
            "employment_created",
            "employment",
            emp.id,
            f"{emp.user.email} @ {emp.branch.name}",
            {"role": emp.role, "branch": emp.branch.name},
        )

    def perform_update(self, serializer):
        emp = serializer.save()
        log_action(
            self.request,
            "employment_updated",
            "employment",
            emp.id,
            f"{emp.user.email} @ {emp.branch.name}",
            {"role": emp.role, "status": emp.status},
        )

    def perform_destroy(self, instance):
        log_action(
            self.request,
            "employment_deleted",
            "employment",
            instance.id,
            f"{instance.user.email} @ {instance.branch.name}",
        )
        instance.delete()


class CompensationViewSet(viewsets.ModelViewSet):
    queryset = Compensation.objects.select_related("employment", "employment__user", "employment__branch")
    serializer_class = CompensationSerializer
    permission_classes = [IsManagerOrAbove]
