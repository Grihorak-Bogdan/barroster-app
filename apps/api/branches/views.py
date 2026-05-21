from rest_framework import viewsets

from audit_log.utils import log_action
from config.permissions import IsOwnerRole
from .models import Branch
from .serializers import BranchSerializer


class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsOwnerRole]

    def perform_create(self, serializer):
        branch = serializer.save()
        log_action(self.request, "branch_created", "branch", branch.id, branch.name)

    def perform_update(self, serializer):
        branch = serializer.save()
        log_action(self.request, "branch_updated", "branch", branch.id, branch.name)

    def perform_destroy(self, instance):
        log_action(self.request, "branch_deleted", "branch", instance.id, instance.name)
        instance.delete()
