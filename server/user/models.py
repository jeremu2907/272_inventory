from django.contrib.auth.models import AbstractUser
from django.db import models

RANK_CHOICES = [
    ('PVT', 'PVT'), ('PV2', 'PV2'), ('PFC', 'PFC'), ('SPC', 'SPC'),
    ('SGT', 'SGT'), ('SSG', 'SSG'), ('SFC', 'SFC'), ('MSG', 'MSG'),
    ('1SG', '1SG'), ('SMG', 'SMG'), ('CSM', 'CSM'), ('2LT', '2LT'),
    ('1LT', '1LT'), ('CPT', 'CPT'), ('MAJ', 'MAJ'), ('LTC', 'LTC'),
    ('COL', 'COL'), ('NONE', 'NONE'),
]

class CustomUser(AbstractUser):
    rank = models.CharField(max_length=4, choices=RANK_CHOICES, default='NONE')
