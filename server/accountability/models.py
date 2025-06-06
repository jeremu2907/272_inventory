from django.db import models
from django.forms import ValidationError
from django.conf import settings

from chest.models import Item, Chest

class UserItemCustody(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='account_custody')
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='item_custody', null=True, blank=True)
    current_qty = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

class AccountRecord(models.Model):
    BORROW_CHOICES = [
        (True, 'BORROW'),
        (False, 'RETURN'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='account_records')
    chest = models.ForeignKey(Chest, on_delete=models.CASCADE, related_name='checkouts', null=True, blank=True)
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='checkouts', null=True, blank=True)
    user_item_custody = models.ForeignKey(UserItemCustody, on_delete=models.SET_NULL, null=True, blank=True)
    original_qty = models.IntegerField(default=1)
    transaction_qty = models.IntegerField(default=1)
    action = models.BooleanField(choices=BORROW_CHOICES, default=True) # True for checkout, False for checkin
    created_at = models.DateTimeField(auto_now_add=True)
    
    def clean(self):
        # Ensure at least one foreign key is set
        if not self.chest and not self.item:
            raise ValidationError("At least one of 'chest' or 'item' must be set.")

    def save(self, *args, **kwargs):
        self.full_clean()  # Triggers clean() method
        super().save(*args, **kwargs)
