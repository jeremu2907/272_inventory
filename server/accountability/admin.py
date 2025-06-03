from django.contrib import admin

from inventory.utils import get_all_model_fields
from .models import AccountRecord

@admin.register(AccountRecord)
class ChestAdmin(admin.ModelAdmin):
    list_display = get_all_model_fields(AccountRecord)
