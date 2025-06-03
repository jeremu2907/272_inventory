from django.db import models
from django.forms import ValidationError

# Create your models here.
class Chest(models.Model):
    plt = models.CharField(max_length=50)
    serial = models.CharField(max_length=50, blank=False, null=False)
    nsn = models.CharField(max_length=50, blank=False, null=False)
    description = models.CharField(max_length=255)
    set_number = models.IntegerField(default=1)
    set_total = models.IntegerField(default=1)
    
    class Meta:
        unique_together = ('serial', 'set_number')
        
    def clean(self):
        if self.set_number > self.set_total:
            raise ValidationError({
                'set_number': 'Set number cannot be greater than set total.'
            })
    
class Item(models.Model):
    chest = models.ForeignKey(Chest, on_delete=models.CASCADE, related_name='items')
    layer = models.CharField(max_length=10)
    name = models.CharField(max_length=100, blank=False, null=False)
    name_ext = models.CharField(max_length=100, blank=True, null=True)
    nsn = models.CharField(max_length=50, blank=True, null=True)
    qty_total = models.IntegerField(default=1) # Cannot be more than qty_total
    qty_real = models.IntegerField(default=1)
    
    def clean(self):
        if self.qty_real > self.qty_total:
            raise ValidationError({
                'qty_real': 'Quantity real cannot be greater than quantity total.'
            })