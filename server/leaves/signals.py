from django.db.models.signals import post_save
from django.dispatch import receiver

from employees.models import Employee
from .models import LeaveBalance


DEFAULT_ALLOCATIONS = {"SICK": 10, "CASUAL": 12, "ANNUAL": 20}


@receiver(post_save, sender=Employee)
def create_leave_balances(sender, instance, created, **kwargs):
    """Auto-create balance rows for a new employee."""
    if not created:
        return
    current_year = instance.join_date.year if instance.join_date else 2026
    # Use current year to be safe
    from django.utils import timezone
    year = timezone.localdate().year
    for leave_type, alloc in DEFAULT_ALLOCATIONS.items():
        LeaveBalance.objects.get_or_create(
            employee=instance,
            year=year,
            leave_type=leave_type,
            defaults={"allocated": alloc},
        )