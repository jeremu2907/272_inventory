from django.urls import path

from . import views

urlpatterns = [
    path("chest/log", views.GetLogByChest, name="chest_log"),
    path("item/log", views.GetLogByItem, name="item_log"),
    path("user/log", views.GetLogByLastName, name="last_name_log"),
    path("checkout", views.Checkout, name="checkout"),
    path("checkin", views.Checkin, name="checkin"),
]