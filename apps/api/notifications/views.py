from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from config.permissions import IsManagerOrAbove
from .models import Notification, NotificationRead
from .serializers import NotificationSerializer
from .utils import broadcast_notification


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return private notifications for current user + all global notifications."""
        return Notification.objects.filter(
            Q(user=self.request.user, scope=Notification.SCOPE_PRIVATE)
            | Q(scope=Notification.SCOPE_GLOBAL)
        ).order_by("-created_at")

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()[:50]

        # Annotate globals with read state in one query to avoid N+1
        global_ids = [n.id for n in qs if n.scope == Notification.SCOPE_GLOBAL]
        read_global_ids = set(
            NotificationRead.objects.filter(
                notification_id__in=global_ids, user=request.user
            ).values_list("notification_id", flat=True)
        )
        for n in qs:
            if n.scope == Notification.SCOPE_GLOBAL:
                n._prefetched_reads = n.id in read_global_ids

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        private_unread = Notification.objects.filter(
            user=request.user, scope=Notification.SCOPE_PRIVATE, read_at__isnull=True
        ).count()
        global_unread = Notification.objects.filter(
            scope=Notification.SCOPE_GLOBAL
        ).exclude(reads__user=request.user).count()
        return Response({"count": private_unread + global_unread})

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        if notif.scope == Notification.SCOPE_PRIVATE:
            if not notif.read_at:
                notif.read_at = timezone.now()
                notif.save(update_fields=["read_at"])
        else:
            NotificationRead.objects.get_or_create(notification=notif, user=request.user)
            notif._prefetched_reads = True
        return Response(NotificationSerializer(notif, context={"request": request}).data)

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        now = timezone.now()
        private_count = Notification.objects.filter(
            user=request.user, scope=Notification.SCOPE_PRIVATE, read_at__isnull=True
        ).update(read_at=now)

        unread_globals = Notification.objects.filter(
            scope=Notification.SCOPE_GLOBAL
        ).exclude(reads__user=request.user)
        global_reads = [
            NotificationRead(notification=n, user=request.user)
            for n in unread_globals
        ]
        NotificationRead.objects.bulk_create(global_reads, ignore_conflicts=True)

        return Response({"marked": private_count + len(global_reads)})

    @action(detail=False, methods=["post"], permission_classes=[IsManagerOrAbove])
    def broadcast(self, request):
        title = request.data.get("title", "").strip()
        body = request.data.get("body", "").strip()
        if not title:
            return Response({"error": "title is required."}, status=400)
        notif = broadcast_notification(
            notif_type="announcement",
            title=title,
            body=body,
        )
        notif._prefetched_reads = False
        return Response(NotificationSerializer(notif, context={"request": request}).data, status=201)
