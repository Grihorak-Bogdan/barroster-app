from rest_framework import viewsets

from .models import Shift, ShiftAssignment
from .serializers import ShiftAssignmentSerializer, ShiftSerializer


class ShiftViewSet(viewsets.ModelViewSet):
    queryset = Shift.objects.select_related("branch", "created_by").prefetch_related("assignments__user")
    serializer_class = ShiftSerializer


class ShiftAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ShiftAssignment.objects.select_related("shift", "user", "shift__branch")
    serializer_class = ShiftAssignmentSerializer