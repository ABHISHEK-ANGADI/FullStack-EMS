from .models import Notification


def notify(user, type, title, message, link=""):
    """Create a notification for a user. Silently no-ops if user is None."""
    if user is None:
        return None
    return Notification.objects.create(
        user=user,
        type=type,
        title=title,
        message=message,
        link=link,
    )


def notify_admins(type, title, message, link=""):
    """Send a notification to every admin user."""
    from accounts.models import User
    admins = User.objects.filter(role="ADMIN", is_active=True)
    return [
        Notification.objects.create(
            user=admin, type=type, title=title, message=message, link=link
        )
        for admin in admins
    ]