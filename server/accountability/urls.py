from django.urls import path

from . import views

urlpatterns = [
    path("chest/log", views.GetLogByChest, name="chest_log"),
    path("item/log", views.GetLogByItem, name="item_log"),
    path("user/item/log", views.GetIndividualCheckedOutItemsByUser, name="last_name_log"),
    path("user/chest/log", views.GetCheckedOutChestByUser, name="user_chest_list"),
    path("user/chest/item/log", views.GetChestCheckedOutItemsByUser, name="user_chest_item_list"),
    path("checkout", views.Checkout, name="checkout"),
    path("checkin", views.Checkin, name="checkin"),
    path("inventory/chest", views.InventoryChest, name="inventory_chest")
]