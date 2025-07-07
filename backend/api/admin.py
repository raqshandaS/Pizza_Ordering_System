from django.contrib import admin
from .models import MenuItem, Topping, Order, OrderItem, UserProfile, Transaction
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'profile'

# Define a new User admin
class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'price_small', 'price_large', 'category', 'image_tag', 'description']
    list_filter = ['category']
    search_fields = ['name', 'description']
    readonly_fields = ['image_tag']

    def image_tag(self, obj):
        from django.utils.html import format_html
        if obj.image:
            return format_html('<img src="{}" style="width: 45px; height:45px;" />', obj.image.url)
        return "No Image"
    image_tag.short_description = 'Image Preview'

@admin.register(Topping)
class ToppingAdmin(admin.ModelAdmin):
    list_display = ['name', 'price']
    search_fields = ['name']

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1  # Control how many extra forms are displayed.
    fields = ['item', 'size', 'quantity', 'toppings']
    autocomplete_fields = ['item', 'toppings']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['user', 'status', 'total_price', 'created_at']
    list_filter = ['status', 'created_at']
    inlines = [OrderItemInline]
    autocomplete_fields = ['user']
    actions = ['make_completed']

    def make_completed(self, request, queryset):
        queryset.update(status='Completed')
    make_completed.short_description = "Mark selected orders as completed"

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'paid', 'timestamp', 'stripe_charge_id']
    list_filter = ['paid', 'timestamp']
    search_fields = ['user__username', 'stripe_charge_id']
    readonly_fields = ['stripe_charge_id', 'amount', 'user', 'timestamp']
