from django.contrib import admin

from .models import Item, Chest

from inventory.utils import get_all_model_fields

@admin.register(Chest)
class ChestAdmin(admin.ModelAdmin):
    list_display = get_all_model_fields(Chest)
    search_fields = ['nsn', 'description', 'serial', 'case_number']

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = [
        'chest_info',
        'name',
        'name_ext',
        'nsn',
        'issued_qty', 
        'on_hand_qty',
    ]
    search_fields = ['name', 'name_ext', 'nsn']

    def chest_info(self, obj):
        if obj.chest:
            return f'{obj.chest.serial} - Case {obj.chest.case_number} of {obj.chest.case_total}'
        return '-'
    chest_info.short_description = 'Chest Info'

    def issued_qty(self, obj):
        return obj.qty_total
    issued_qty.short_description = 'Issued Qty'

    def on_hand_qty(self, obj):
        return obj.qty_real
    on_hand_qty.short_description = 'On-hand Qty'


# Register your models here.
