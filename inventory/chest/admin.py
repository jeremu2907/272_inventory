from django.contrib import admin

from .models import Item, Chest

from inventory.utils import get_all_model_fields

@admin.register(Chest)
class ChestAdmin(admin.ModelAdmin):
    list_display = get_all_model_fields(Chest)

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = get_all_model_fields(Item)

# Register your models here.
