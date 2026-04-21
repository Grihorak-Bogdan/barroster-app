from rest_framework import viewsets

from .models import Compensation, Employment
from .serializers import CompensationSerializer, EmploymentSerializer


class EmploymentViewSet(viewsets.ModelViewSet):
    queryset = Employment.objects.select_related("user", "branch").prefetch_related("compensations")
    serializer_class = EmploymentSerializer


class CompensationViewSet(viewsets.ModelViewSet):
    queryset = Compensation.objects.select_related("employment", "employment__user", "employment__branch")
    serializer_class = CompensationSerializer