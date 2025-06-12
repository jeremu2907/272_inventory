from django.db import models
from django.forms import ValidationError

# Create your models here.
class Chest(models.Model):
    plt = models.CharField(max_length=50)
    serial = models.CharField(max_length=50, blank=False, null=False)
    nsn = models.CharField(max_length=50, blank=False, null=False)
    description = models.CharField(max_length=255)
    case_number = models.IntegerField(default=1)
    case_total = models.IntegerField(default=1)
    drive_url = models.CharField(max_length=200, default="")
    location = models.CharField(max_length=50, default="")
    
    class Meta:
        unique_together = ('serial', 'case_number')
        
    def clean(self):
        if self.case_number > self.case_total:
            raise ValidationError({
                'case_number': 'Set number cannot be greater than set total.'
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