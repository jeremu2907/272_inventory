# Generated by Django 5.2.1 on 2025-06-06 13:10

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accountability', '0007_remove_accountrecord_current_qty_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='accountrecord',
            name='user_item_custody',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='accountability.useritemcustody'),
        ),
    ]
