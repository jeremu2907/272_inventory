from django.urls import path

from . import views

urlpatterns = [
    path("chest/", views.ChestApi, name="index"),
    path("chest/search/", views.SearchChestApi, name="search_chest"),
    path("item/", views.ItemApi, name="item_api"),
    # path("item/search/", views.SearchItemApi, name="search_item"),
]