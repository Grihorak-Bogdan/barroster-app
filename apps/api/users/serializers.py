from rest_framework import serializers
from .models import User

ROLE_HIERARCHY = {'owner': 4, 'manager': 3, 'supervisor': 2, 'staff': 1}


class UserSerializer(serializers.ModelSerializer):
    employment_role = serializers.SerializerMethodField()

    def get_employment_role(self, obj):
        if obj.is_staff:
            return 'owner'
        from employment.models import Employment  # noqa: PLC0415
        roles = list(
            Employment.objects.filter(user=obj, status='active').values_list('role', flat=True)
        )
        if not roles:
            return None
        return max(roles, key=lambda r: ROLE_HIERARCHY.get(r, 0))

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone', 'created_at', 'employment_role']
        read_only_fields = ['id', 'email', 'created_at', 'employment_role']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name']
        extra_kwargs = {
            'first_name': {'required': False, 'default': ''},
            'last_name': {'required': False, 'default': ''},
        }

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
