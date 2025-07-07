from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone

### User profile
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)

    def __str__(self) -> str:
        return self.user.username

### Menu and Orders
class MenuItem(models.Model):
    CATEGORY_CHOICES = [
        ('Pizza', 'Pizza'),
        ('Breads', 'Breads'),
        ('Deserts', 'Deserts')
    ]
    name = models.CharField(max_length=100)
    price_small = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    price_large = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='menu_items/', blank=True, null=True)  # Path relative to MEDIA_ROOT

    def __str__(self):
        return f"{self.name} ({self.category})"

class Topping(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=5, decimal_places=2)

    def __str__(self):
        return self.name

class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=[('Pending', 'Pending'), ('Completed', 'Completed')], default='Pending')
    total_price = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def update_total_price(self):
        total = 0
        items = self.items.all()
        for item in items:
            total += item.get_total_price()
        self.total_price = total
        self.save()

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    size = models.CharField(max_length=10, choices=[('S', 'Small'), ('L', 'Large')])
    quantity = models.IntegerField(default=1)
    toppings = models.ManyToManyField(Topping, blank=True)

    def get_total_price(self):
        base_price = self.item.price_large if self.size == 'L' else self.item.price_small
        topping_price = sum(topping.price for topping in self.toppings.all())
        return (base_price + topping_price) * self.quantity

# Signals to update order total whenever order items are modified or deleted
@receiver(post_save, sender=OrderItem)
def update_order_total_on_change(sender, instance, **kwargs):
    instance.order.update_total_price()

@receiver(post_delete, sender=OrderItem)
def update_order_total_on_delete(sender, instance, **kwargs):
    instance.order.update_total_price()

### Payments
class Transaction(models.Model):
    user = models.ForeignKey(User, related_name='transactions', on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)
    stripe_charge_id = models.CharField(max_length=50)
    description = models.CharField(max_length=255, blank=True)
    paid = models.BooleanField(default=False)  # Default to False, set to True when payment is confirmed

    def __str__(self):
        paid_status = "Paid" if self.paid else "Not Paid"
        return f"{self.user.username} - ${self.amount} {paid_status} on {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
