from rest_framework import viewsets, generics, status
from .models import MenuItem, Order, OrderItem, Topping, Transaction
from .serializers import MenuItemSerializer, OrderSerializer, OrderItemSerializer, ToppingSerializer, UserSerializer, TransactionSerializer
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.exceptions import PermissionDenied
from django.conf import settings
import stripe

stripe.api_key = settings.STRIPE_SECRET_KEY

class UserCreate(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            if user:
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy']:
            return [IsAdminUser()]
        # Ensure authentication for non-admin users for 'list' and 'retrieve' actions
        return [IsAuthenticated()]

class MenuItemDetailView(generics.RetrieveAPIView):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [IsAuthenticated]  # Add this line to ensure authentication

class ToppingViewSet(viewsets.ModelViewSet):
    queryset = Topping.objects.all()
    serializer_class = ToppingSerializer

    def get_permissions(self):
        # Make sure only authenticated users can view (GET)
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]  # Ensure authenticated users can view the toppings
        if self.action in ['create', 'update', 'destroy']:
            return [IsAdminUser()]  # Admin-only actions for creating, updating, and destroying
        return []

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Ensure that the order item is linked to an order that belongs to the current user
        order = serializer.validated_data.get('order')
        if order.user != self.request.user:
            raise PermissionDenied("You cannot add items to someone else's order.")
        serializer.save()

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return OrderItem.objects.all()
        else:
            # Return only order items that are part of the orders belonging to the logged-in user
            return OrderItem.objects.filter(order__user=user)

# Payment view
class StripeChargeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = TransactionSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            amount = int(serializer.validated_data['amount'] * 100)  # Convert dollars to cents
            description = serializer.validated_data.get('description', 'No description provided')

            try:
                payment_intent = stripe.PaymentIntent.create(
                    amount=amount,
                    currency='usd',
                    description=description,
                    payment_method=request.data['token'],  # obtained with Stripe.js
                    confirm=True,
                    return_url=request.data['return_url']
                )
                
                # Check if payment_intent status is 'succeeded' or 'requires_capture'
                if payment_intent.status in ['succeeded', 'requires_capture']:
                    transaction = serializer.save(user=request.user, stripe_charge_id=payment_intent.id, paid=True)
                    return Response(TransactionSerializer(transaction).data, status=201)
                else:
                    return Response({'error': 'Payment failed'}, status=400)
            except stripe.error.StripeError as e:
                return Response({'error': str(e)}, status=400)
        return Response(serializer.errors, status=400)
