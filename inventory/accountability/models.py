from django.db import models
from django.forms import ValidationError

from chest.models import Item, Chest

class AccountRecord(models.Model):
    RANK_CHOICES = [
        ('PVT', 'PVT'),
        ('PV2', 'PV2'),
        ('PFC', 'PFC'),
        ('SPC', 'SPC'),
        ('SGT', 'SGT'),
        ('SSG', 'SSG'),
        ('SFC', 'SFC'),
        ('MSG', 'MSG'),
        ('1SG', '1SG'),
        ('SMG', 'SMG'),
        ('CSM', 'CSM'),
        ('2LT', '2LT'),
        ('1LT', '1LT'),
        ('CPT', 'CPT'),
        ('MAJ', 'MAJ'),
        ('LTC', 'LTC'),
        ('COL', 'COL'),
        ('NONE', 'NONE'),
    ]
    
    BORROW_CHOICES = [
        (True, 'BORROW'),
        (False, 'RETURN'),
    ]

    chest = models.ForeignKey(Chest, on_delete=models.CASCADE, related_name='checkouts', null=True, blank=True)
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='checkouts', null=True, blank=True)
    rank = models.CharField(max_length=4, choices=RANK_CHOICES)
    first_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50)
    qty = models.IntegerField(default=1)
    action = models.BooleanField(choices=BORROW_CHOICES, default=True) # True for checkout, False for checkin
    created_at = models.DateTimeField(auto_now_add=True)
    
    def clean(self):
        # Ensure at least one foreign key is set
        if not self.chest and not self.item:
            raise ValidationError("At least one of 'chest' or 'item' must be set.")

    def save(self, *args, **kwargs):
        self.full_clean()  # Triggers clean() method
        super().save(*args, **kwargs)