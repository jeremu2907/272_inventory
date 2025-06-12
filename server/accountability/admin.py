import datetime
from django.utils.timezone import localtime
from django.contrib import admin
from django.http import HttpResponse

from .models import AccountRecord, ChestInventoryPdf, UserChestCustody, UserItemCustody

@admin.register(AccountRecord)
class ChestAdmin(admin.ModelAdmin):
    list_display = [
        'user',
        'item_name',
        'item_name_ext',
        'chest_desc',
        'action',
        'original_qty',
        'transaction_qty',
        'created_at'
    ]
    ordering = ['-created_at']
    search_fields = ['user', 'item_name', 'item_name_ext', 'created_at']

    def item_name(self, obj):
        return obj.item.name if obj.item else '-'
    item_name.short_description = 'Item Name'

    def item_name_ext(self, obj):
        return obj.item.name_ext if obj.item else '-'
    item_name_ext.short_description = 'Item Name Ext'
    
    def chest_desc(self, obj):
        return f'serial-{obj.chest.description}' if obj.chest else '-'
    chest_desc.short_description = 'Chest Info'
    
    def created_at_local(self, obj):
        return localtime(obj.created_at).strftime('%Y-%m-%d %H:%M:%S')
    created_at_local.short_description = 'Created At (Local Time)'
    created_at_local.admin_order_field = 'created_at'
    
@admin.register(UserItemCustody)
class ItemCusodyAdmin(admin.ModelAdmin):
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
    
@admin.register(UserChestCustody)
class ChestCusodyAdmin(admin.ModelAdmin):
    list_display = [
        'user',
        'chest_serial',
        'chest_case_number',
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
    
    def chest_serial(self, obj):
        return obj.chest.serial if obj.chest else '-'
    item_name.short_description = 'Chest serial'

    def chest_case_number(self, obj):
        return obj.chest.case_number if obj.chest else '-'
    chest_case_number.short_description = 'Chest case number'
    
    def created_at_local(self, obj):
        return localtime(obj.created_at).strftime('%Y-%m-%d %H:%M:%S')
    created_at_local.short_description = 'Created At (Local Time)'
    created_at_local.admin_order_field = 'created_at'

@admin.action(description='Download selected PDFs')
def download_selected_pdfs(modeladmin, request, queryset):
    if queryset.count() == 1:
        pdf_obj = queryset.first()
        response = HttpResponse(pdf_obj.pdf_data, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="chest_inventory_{pdf_obj.id}.pdf"'
        return response
    else:
        # Optionally handle multiple files
        from zipfile import ZipFile
        from io import BytesIO

        zip_buffer = BytesIO()
        with ZipFile(zip_buffer, 'w') as zip_file:
            for obj in queryset:
                zip_file.writestr(f'chest_inventory_{obj.id}.pdf', obj.pdf_data)
        
        zip_buffer.seek(0)
        response = HttpResponse(zip_buffer, content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename="chest_inventories.zip"'
        return response


@admin.register(ChestInventoryPdf)
class ChestInventoryPdf(admin.ModelAdmin):
    list_display = [
        'chest_serial',
        'chest_case_number',
        'chest_description',
        'chest_nsn',
        'created_at_local',
    ]

    actions = [download_selected_pdfs]
    search_fields = ['chest__nsn', 'chest__description', 'chest__serial', 'chest__case_number']

    def chest_serial(self, obj):
        return obj.chest.serial if obj.chest else '-'
    chest_serial.short_description = 'Chest Serial'

    def chest_description(self, obj):
        return obj.chest.description if obj.chest else '-'
    chest_description.short_description = 'Chest Description'

    def chest_nsn(self, obj):
        return obj.chest.nsn if obj.chest else '-'
    chest_nsn.short_description = 'Chest NSN'

    def chest_case_number(self, obj):
        return obj.chest.case_number if obj.chest else '-'
    chest_case_number.short_description = 'Chest Case Number'

    def created_at_local(self, obj):
        if isinstance(obj.created_at, datetime.datetime):
            return localtime(obj.created_at).strftime('%Y-%m-%d %H:%M:%S')
        return "-"
    created_at_local.short_description = 'Created At (Local Time)'
    created_at_local.admin_order_field = 'created_at'