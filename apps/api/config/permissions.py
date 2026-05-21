from rest_framework.permissions import BasePermission, SAFE_METHODS

ROLE_HIERARCHY = {'owner': 4, 'manager': 3, 'supervisor': 2, 'staff': 1}


def get_effective_role(user) -> str | None:
    """
    Returns the highest role the user holds across all active employments.
    is_staff users (Django admins) are treated as owner unconditionally.
    """
    if user.is_staff:
        return 'owner'
    from employment.models import Employment  # noqa: PLC0415
    roles = list(
        Employment.objects.filter(user=user, status='active').values_list('role', flat=True)
    )
    if not roles:
        return None
    return max(roles, key=lambda r: ROLE_HIERARCHY.get(r, 0))


class IsManagerOrAbove(BasePermission):
    """
    Read: any authenticated user.
    Write: manager, owner, or Django staff.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return get_effective_role(request.user) in ('manager', 'owner')


class IsOwnerRole(BasePermission):
    """
    Read: any authenticated user.
    Write: owner or Django staff only.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return get_effective_role(request.user) == 'owner'
