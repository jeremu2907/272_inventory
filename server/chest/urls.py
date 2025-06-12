from django.urls import path

from . import views

urlpatterns = [
    path("chest", views.ChestApi, name="index"),
    path("chest/single", views.GetChestBySerialAndSetNum, name="single_chest"),
    path("chest/location/update", views.UpdateLocation, name="update_location"),
    path("item", views.ItemApi, name="item_api"),
    path("item/single", views.GetItemById, name="single_item"),
    path("search", views.SearchAny, name="search_any"),
]