from django.conf import settings
from django.db import models


class Notification(models.Model):
    TYPE_LEAVE_APPROVED = "LEAVE_APPROVED"
    TYPE_LEAVE_REJECTED = "LEAVE_REJECTED"
    TYPE_LEAVE_APPLIED = "LEAVE_APPLIED"
    TYPE_PAYSLIP_GENERATED = "PAYSLIP_GENERATED"
    TYPE_SYSTEM = "SYSTEM"

    TYPE_CHOICES = [
        (TYPE_LEAVE_APPROVED, "Leave Approved"),
        (TYPE_LEAVE_REJECTED, "Leave Rejected"),
        (TYPE_LEAVE_APPLIED, "Leave Applied"),
        (TYPE_PAYSLIP_GENERATED, "Payslip Generated"),
        (TYPE_SYSTEM, "System"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    link = models.CharField(max_length=200, blank=True, default="")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.title} ({'read' if self.is_read else 'unread'})"