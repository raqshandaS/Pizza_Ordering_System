from rest_framework import serializers
from .models import MenuItem, Order, OrderItem, Topping, Transaction
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password", "email"]
        extra_kwargs = {"password": {"write_only": True}}

    # Create new user after serializer gives the validated_data
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data) # ** is used to make dict key: value as , seperated value
        return user

# Serializer for a topping
class ToppingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topping
        fields = ['id', 'name', 'price']

# Serializer for an item on the menu
class MenuItemSerializer(serializers.ModelSerializer):
    price_small = serializers.SerializerMethodField()
    price_large = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()  # Add this field to return the image URL

    class Meta:
        model = MenuItem
        fields = ['id', 'name', 'price_small', 'price_large', 'category', 'image_url', 'description']  # Replace 'image' with 'image_url'

    def get_price_small(self, obj):
        if obj.price_small is not None:  # Ensure price is not None
            return f"${obj.price_small:.2f}"  # Formatting as $9.99
        return "N/A"  # Or handle the default value differently, if needed

    def get_price_large(self, obj):
        if obj.price_large is not None:  # Ensure price is not None
            return f"${obj.price_large:.2f}"  # Formatting as $17.99
        return "N/A"  # Or handle the default value differently, if needed

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url  # This should be relative, like /media/menu_items/filename.jpg
        return None



# Serializer for item of an order
class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['order', 'item', 'size', 'quantity', 'toppings']

    def create(self, validated_data):
        order_item = OrderItem.objects.create(**validated_data)
        return order_item

    def update(self, instance, validated_data):
        instance.quantity = validated_data.get('quantity', instance.quantity)
        instance.size = validated_data.get('size', instance.size)
        instance.save()
        instance.toppings.set(validated_data.get('toppings', instance.toppings.all()))
        return instance

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['user', 'status', 'total_price', 'items']
        extra_kwargs = {
            'user': {'read_only': True},
            'items': {'read_only': True}
        }

    def create(self, validated_data):
        # Assign the currently authenticated user automatically
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        instance.status = validated_data.get('status', instance.status)
        instance.total_price = validated_data.get('total_price', instance.total_price)
        instance.save()
        return instance

# Serializer for payments
class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'user', 'amount', 'timestamp', 'stripe_charge_id', 'description', 'paid']
        read_only_fields = ['user', 'timestamp', 'stripe_charge_id', 'paid']
