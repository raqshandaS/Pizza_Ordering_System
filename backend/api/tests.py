from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth.models import User
from .models import MenuItem, Order, OrderItem, Topping
from decimal import Decimal
from unittest.mock import patch
import stripe

##### TESTS FOR MENU ITEMS #####

class MenuItemTests(APITestCase):
    def setUp(self):
        # Create and authenticate as an admin user
        self.admin_user = User.objects.create_superuser(username="adminuser", password="adminpassword")
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)

        # Create a menu item
        self.pizza = MenuItem.objects.create(
            name='Test Pizza', 
            price_small=Decimal('10.00'), 
            price_large=Decimal('15.00'), 
            category='Pizza'
        )

    def test_create_menu_item(self):
        """
        Ensure we can create a new menu item with admin privileges.
        """
        url = reverse('menuitem-list')
        data = {
            'name': 'New Pizza', 
            'price_small': Decimal('12.00'), 
            'price_large': Decimal('18.00'), 
            'category': 'Pizza'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MenuItem.objects.count(), 2)
        self.assertEqual(MenuItem.objects.get(id=2).name, 'New Pizza')

    def test_retrieve_menu_items(self):
        """
        Ensure we can retrieve menu items.
        """
        url = reverse('menuitem-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Only one menu item exists initially
        self.assertEqual(response.data[0]['name'], 'Test Pizza')

    def test_menu_item_update(self):
        """
        Ensure we can update an existing menu item with admin privileges.
        """
        url = reverse('menuitem-detail', args=[self.pizza.id])
        data = {
            'name': 'Updated Pizza', 
            'price_small': Decimal('11.00'), 
            'price_large': Decimal('16.00'), 
            'category': 'Pizza'
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        updated_pizza = MenuItem.objects.get(id=self.pizza.id)
        self.assertEqual(updated_pizza.name, 'Updated Pizza')
        self.assertEqual(updated_pizza.price_small, Decimal('11.00'))

    def test_menu_item_delete(self):
        """
        Ensure we can delete a menu item with admin privileges.
        """
        url = reverse('menuitem-detail', args=[self.pizza.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(MenuItem.objects.count(), 0)

########## TESTS FOR ORDERS ##########

class OrderTests(APITestCase):
    def setUp(self):
        # Create and authenticate as a regular user
        self.user = User.objects.create_user(username='testuser', email='testuser@example.com', password='testpassword')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Create a menu item
        self.pizza = MenuItem.objects.create(
            name='Margarita', 
            price_small=Decimal('5.50'), 
            price_large=Decimal('7.50'), 
            category='Pizza'
        )

        # Create an initial order
        self.order = Order.objects.create(
            user=self.user, 
            status='Pending', 
            total_price=Decimal('0.00')
        )

    def test_create_order(self):
        """
        Ensure we can create a new order.
        """
        url = reverse('order-list')
        # Note: Removed 'user' from data since it should be set by the view from the authenticated user
        data = {
            'status': 'Pending', 
            'total_price': Decimal('15.00')
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.count(), 2)  # Including the one created in setUp
        new_order = Order.objects.latest('id')
        self.assertEqual(new_order.total_price, Decimal('15.00'))
        self.assertEqual(new_order.user, self.user)  # Check if the order is associated with the correct user

    def test_retrieve_orders(self):
        """
        Ensure we can retrieve a list of orders.
        """
        url = reverse('order-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Only one order exists initially
        self.assertEqual(response.data[0]['status'], 'Pending')
        self.assertEqual(Decimal(response.data[0]['total_price']), Decimal('0.00'))

    def test_update_order(self):
        """
        Ensure we can update an order's status and total price.
        """
        url = reverse('order-detail', args=[self.order.id])
        data = {
            'status': 'Completed', 
            'total_price': Decimal('20.00')
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        updated_order = Order.objects.get(id=self.order.id)
        self.assertEqual(updated_order.status, 'Completed')
        self.assertEqual(updated_order.total_price, Decimal('20.00'))

    def test_delete_order(self):
        """
        Ensure we can delete an order.
        """
        url = reverse('order-detail', args=[self.order.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Order.objects.count(), 0)

    def test_unauthorized_access(self):
        """
        Ensure unauthorized access is denied when trying to access orders without authentication.
        """
        self.client.logout()  # Log out the current user
        url = reverse('order-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class OrderItemTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.pizza = MenuItem.objects.create(name='Margarita', price_small=5.50, price_large=7.50, category='Pizza')
        self.order = Order.objects.create(user=self.user, status='Pending', total_price=0.00)
        self.order_item = OrderItem.objects.create(order=self.order, item=self.pizza, size='L', quantity=1)

    def test_add_order_item(self):
        """
        Ensure we can add an item to an order.
        """
        url = reverse('orderitem-list')
        data = {'order': self.order.id, 'item': self.pizza.id, 'size': 'S', 'quantity': 2}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(OrderItem.objects.count(), 2)

    def test_update_order_item(self):
        """
        Ensure we can update quantity for an order item.
        """
        url = reverse('orderitem-detail', args=[self.order_item.id])
        data = {'quantity': 3}  # Increase the quantity
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(OrderItem.objects.get(id=self.order_item.id).quantity, 3)

    def test_delete_order_item(self):
        """
        Ensure we can delete an order item.
        """
        url = reverse('orderitem-detail', args=[self.order_item.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(OrderItem.objects.count(), 0)

    def test_unauthorized_access(self):
        """
        Ensure unauthorized access is denied.
        """
        self.client.logout()  # Log out the current user
        url = reverse('orderitem-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

##############################################################################################

class AdminAccessTests(APITestCase):
    def setUp(self):
        # Create a regular user and an admin user
        self.user = User.objects.create_user(username="user", password="password")
        self.admin_user = User.objects.create_superuser(username="admin", password="adminpassword")
        self.client = APIClient()

    def test_admin_access_to_menuitem_create(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('menuitem-list')
        data = {'name': 'Admin Pizza', 'price_small': 10.50, 'price_large': 15.50, 'category': 'Pizza'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_user_access_to_menuitem_create(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('menuitem-list')
        data = {'name': 'User Pizza', 'price_small': 10.50, 'price_large': 15.50, 'category': 'Pizza'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class OrderLogicTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser2', password='testpassword2')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.pizza_small = MenuItem.objects.create(name='Small Margarita', price_small=5.50, category='Pizza')
        self.order = Order.objects.create(user=self.user, status='Pending', total_price=0.00)

    def test_order_total_price_calculation(self):
        # Assuming you have a method to recalculate prices when items are added
        OrderItem.objects.create(order=self.order, item=self.pizza_small, size='S', quantity=2)
        self.order.refresh_from_db()
        expected_price = Decimal('11.00')  # Define expected price as Decimal
        self.assertAlmostEqual(self.order.total_price, expected_price, places=2)

    def test_order_status_change_on_completion(self):
        self.order.status = 'Completed'
        self.order.save()
        self.assertEqual(self.order.status, 'Completed')


class ToppingAdditionTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='toppinguser', password='toppingpassword')
        self.pizza = MenuItem.objects.create(name='Customizable Pizza', price_large=20.00, category='Pizza')
        self.topping = Topping.objects.create(name='Extra Cheese', price=2.00)
        self.order = Order.objects.create(user=self.user, status='Pending', total_price=0.00)
        self.order_item = OrderItem.objects.create(order=self.order, item=self.pizza, size='L', quantity=1)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_add_topping_to_order_item(self):
        self.order_item.toppings.add(self.topping)
        self.order_item.save()
        self.assertIn(self.topping, self.order_item.toppings.all())
        self.order.refresh_from_db()
        # Assume order total should now include the price of the topping
        expected_total = Decimal('22.00')  # Pizza plus topping
        self.assertAlmostEqual(self.order.total_price, expected_total, places=2)


###############################################################################################


class MockCharge:
    def __init__(self, id, paid, amount, currency, description, status):
        self.id = id
        self.paid = paid
        self.amount = amount
        self.currency = currency
        self.description = description
        self.status = status


class StripeChargeTests(APITestCase):
    def setUp(self):
        # Create a user and authenticate
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.client.force_authenticate(user=self.user)

        # URL for creating a charge
        self.charge_url = reverse('stripe-charge')

    @patch('stripe.Charge.create')
    def test_successful_charge(self, mock_charge):
        mock_charge.return_value = MockCharge(
            id='ch_1Iq2Yk2eZvKYlo2C0gj0Qz04',
            paid=True,
            amount=2000,  # $20 in cents
            currency='usd',
            description='Test charge',
            status='succeeded'
        )

        charge_data = {
            'token': 'tok_visa',
            'amount': 20.00,  # amount in dollars as expected to be sent by client
            'description': 'Test charge'
        }

        response = self.client.post(self.charge_url, charge_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data.get('paid', False))
        # Expect amount as a string in dollars
        self.assertEqual(response.data['amount'], '20.00')

    @patch('stripe.Charge.create')
    def test_failed_charge(self, mock_charge):
        # Simulate a Stripe API error
        mock_charge.side_effect = stripe.error.CardError(
            "Your card was declined.", "charge_declined", "card_declined"
        )

        charge_data = {
            'token': 'tok_chargeDeclined',
            'amount': 20.00,
            'description': 'Test charge failure'
        }

        response = self.client.post(self.charge_url, charge_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('declined', response.data['error'])
