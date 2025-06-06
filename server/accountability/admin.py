from time import localtime
from django.contrib import admin

from inventory.utils import get_all_model_fields
from .models import AccountRecord, UserItemCustody

@admin.register(AccountRecord)
class ChestAdmin(admin.ModelAdmin):
    list_display = [
        'user',
        'item_name',
        'item_name_ext',
        'action',
        'original_qty',
        'transaction_qty',
        'created_at'
    ]
    ordering = ['-created_at']

    def item_name(self, obj):
        return obj.item.name if obj.item else '-'
    item_name.short_description = 'Item Name'

    def item_name_ext(self, obj):
        return obj.item.name_ext if obj.item else '-'
    item_name_ext.short_description = 'Item Name Ext'
    
    def created_at_local(self, obj):
        return localtime(obj.created_at).strftime('%Y-%m-%d %H:%M:%S')
    created_at_local.short_description = 'Created At (Local Time)'
    created_at_local.admin_order_field = 'created_at'
    
@admin.register(UserItemCustody)
class ChestAdmin(admin.ModelAdmin):
    list_display = [
        'user',
        'item_name',
        'item_name_ext',
        'current_qty',
        'created_at'
    ]
    ordering = ['-created_at']

    def item_name(self, obj):
        return obj.item.name if obj.item else '-'
    item_name.short_description = 'Item Name'

    def item_name_ext(self, obj):
        return obj.item.name_ext if obj.item else '-'
    item_name_ext.short_description = 'Item Name Ext'
    
    def created_at_local(self, obj):
        return localtime(obj.created_at).strftime('%Y-%m-%d %H:%M:%S')
    created_at_local.short_description = 'Created At (Local Time)'
    created_at_local.admin_order_field = 'created_at'
