from django.conf import settings
from django.db import models
from django.db.models import F, Q


class LeaveBalance(models.Model):
    TYPE_CHOICES = [
        ("SICK", "Sick Leave"),
        ("CASUAL", "Casual Leave"),
        ("ANNUAL", "Annual Leave"),
    ]

    employee = models.ForeignKey(
        "employees.Employee",
        on_delete=models.CASCADE,
        related_name="leave_balances",
    )
    year = models.PositiveIntegerField()
    leave_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    allocated = models.PositiveIntegerField(default=0)
    used = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("employee", "year", "leave_type")
        ordering = ["-year", "leave_type"]

    def __str__(self):
        return f"{self.employee.employee_id} - {self.year} {self.leave_type} ({self.used}/{self.allocated})"

    @property
    def remaining(self):
        return max(0, self.allocated - self.used)


class LeaveRequest(models.Model):
    TYPE_CHOICES = LeaveBalance.TYPE_CHOICES + [("UNPAID", "Unpaid Leave")]
    MANAGED_TYPES = {"SICK", "CASUAL", "ANNUAL"}  # balance-checked types

    STATUS_PENDING = "PENDING"
    STATUS_APPROVED = "APPROVED"
    STATUS_REJECTED = "REJECTED"
    STATUS_CANCELLED = "CANCELLED"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    employee = models.ForeignKey(
        "employees.Employee",
        on_delete=models.CASCADE,
        related_name="leave_requests",
    )
    leave_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    days = models.PositiveIntegerField(default=1)
    reason = models.TextField()
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_leaves",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=Q(end_date__gte=F("start_date")),
                name="leave_end_after_start",
            ),
        ]
        indexes = [
            models.Index(fields=["employee", "status"]),
            models.Index(fields=["status", "start_date"]),
        ]

    def __str__(self):
        return f"{self.employee.employee_id} - {self.leave_type} ({self.status})"

    def save(self, *args, **kwargs):
        if self.start_date and self.end_date:
            self.days = (self.end_date - self.start_date).days + 1
        super().save(*args, **kwargs)