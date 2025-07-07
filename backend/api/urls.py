from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import MenuItemViewSet, ToppingViewSet, \
                OrderViewSet, OrderItemViewSet, \
                StripeChargeView, MenuItemDetailView

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'menuitems', MenuItemViewSet)
router.register(r'toppings', ToppingViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'orderitems', OrderItemViewSet)

# The URLs for the viewsets will be automatically created
urlpatterns = router.urls  # This includes all the routes registered in the router

# Add custom views to the urlpatterns
urlpatterns += [
    path("charge/", StripeChargeView.as_view(), name='stripe-charge'),
    path('menuitems/<int:pk>/', MenuItemDetailView.as_view(), name='menuitem-detail'),
]
