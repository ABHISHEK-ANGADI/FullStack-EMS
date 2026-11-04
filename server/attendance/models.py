from django.conf import settings
from django.db import models


class Attendance(models.Model):
    STATUS_PRESENT = "PRESENT"
    STATUS_LATE = "LATE"
    STATUS_ABSENT = "ABSENT"
    STATUS_HALF_DAY = "HALF_DAY"

    STATUS_CHOICES = [
        (STATUS_PRESENT, "Present"),
        (STATUS_LATE, "Late"),
        (STATUS_ABSENT, "Absent"),
        (STATUS_HALF_DAY, "Half Day"),
    ]

    DAY_TYPE_CHOICES = [
        ("Full Day", "Full Day"),
        ("Three Quarter Day", "Three Quarter Day"),
        ("Half Day", "Half Day"),
        ("Short Day", "Short Day"),
    ]

    # Check-ins after this time are marked LATE
    LATE_CUTOFF_HOUR = 9
    LATE_CUTOFF_MINUTE = 15

    employee = models.ForeignKey(
        "employees.Employee",
        on_delete=models.CASCADE,
        related_name="attendance",
    )
    date = models.DateField()
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_PRESENT)
    working_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    day_type = models.CharField(max_length=20, choices=DAY_TYPE_CHOICES, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-check_in"]
        constraints = [
            models.UniqueConstraint(
                fields=["employee", "date"],
                name="unique_attendance_per_day",
            ),
        ]
        indexes = [
            models.Index(fields=["employee", "date"]),
        ]

    def __str__(self):
        return f"{self.employee.employee_id or self.employee.id} - {self.date} - {self.status}"

    def calculate_working_hours(self):
        if not (self.check_in and self.check_out):
            return None
        delta = self.check_out - self.check_in
        hours = delta.total_seconds() / 3600
        return round(hours, 2)

    def calculate_day_type(self):
        hours = self.calculate_working_hours()
        if hours is None:
            return ""
        if hours >= 8:
            return "Full Day"
        if hours >= 6:
            return "Three Quarter Day"
        if hours >= 4:
            return "Half Day"
        return "Short Day"

    def is_late(self):
        if not self.check_in:
            return False
        cutoff_minutes = self.LATE_CUTOFF_HOUR * 60 + self.LATE_CUTOFF_MINUTE
        checkin_minutes = self.check_in.hour * 60 + self.check_in.minute
        return checkin_minutes > cutoff_minutes