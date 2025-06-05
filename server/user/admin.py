from copy import deepcopy
from django.contrib import admin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from user.models import CustomUser
from django.contrib.auth.admin import UserAdmin as DefaultUserAdmin

# Register your models here.
# Custom form for user creation
class CustomUserCreationForm(UserCreationForm):
    def clean_first_name(self):
        name = self.cleaned_data.get("first_name", "")
        return name.strip().upper()

    def clean_last_name(self):
        name = self.cleaned_data.get("last_name", "")
        return name.strip().upper()

    def clean_username(self):
        name = self.cleaned_data.get("username", "")
        return name.strip().upper()

    class Meta:
        model = CustomUser
        fields = ("username", "first_name", "last_name", "rank")


# Custom form for user change
class CustomUserChangeForm(UserChangeForm):
    def clean_first_name(self):
        name = self.cleaned_data.get("first_name", "")
        return name.strip().upper()

    def clean_last_name(self):
        name = self.cleaned_data.get("last_name", "")
        return name.strip().upper()

    def clean_username(self):
        name = self.cleaned_data.get("username", "")
        return name.strip().upper()

    class Meta:
        model = CustomUser
        fields = "__all__"


# Custom admin that uses both forms
class CustomUserAdmin(DefaultUserAdmin):
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'first_name', 'last_name', 'rank'),
        }),
    )
    
    fieldsets = deepcopy(DefaultUserAdmin.fieldsets)

    for i, (title, options) in enumerate(fieldsets):
        if title == "Personal info":
            options['fields'] = options['fields'] + ('rank',)
            break
    
    list_display = tuple(
        field for field in DefaultUserAdmin.list_display if field not in ('email', 'username')
    ) + ('rank',)

# Re-register User model with custom admin
# admin.site.unregister(User)
admin.site.register(CustomUser, CustomUserAdmin)