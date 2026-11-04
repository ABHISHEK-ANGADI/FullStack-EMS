from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    isRead = serializers.BooleanField(source="is_read")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Notification
        fields = ("id", "type", "title", "message", "link", "isRead", "createdAt")