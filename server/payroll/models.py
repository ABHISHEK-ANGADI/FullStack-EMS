from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Payslip(models.Model):
    STATUS_DRAFT = "DRAFT"
    STATUS_PAID = "PAID"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_PAID, "Paid"),
    ]

    employee = models.ForeignKey(
        "employees.Employee",
        on_delete=models.CASCADE,
        related_name="payslips",
    )
    month = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(12)]
    )
    year = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(2000), MaxValueValidator(2100)]
    )
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    allowances = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="generated_payslips",
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-year", "-month", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["employee", "month", "year"],
                name="unique_payslip_per_employee_month",
            ),
        ]
        indexes = [
            models.Index(fields=["employee", "year", "month"]),
        ]

    def __str__(self):
        return f"{self.employee.employee_id} - {self.year}-{self.month:02d} (net {self.net_salary})"

    def save(self, *args, **kwargs):
        basic = self.basic_salary or Decimal("0")
        allow = self.allowances or Decimal("0")
        deduct = self.deductions or Decimal("0")
        self.net_salary = basic + allow - deduct
        super().save(*args, **kwargs)