# from django.shortcuts import render
from django.forms import ValidationError
from django.http import JsonResponse, HttpRequest
from django.db.models import Q

from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db import transaction

from .models import Item, Chest

def ChestApi(request):
    try:
        if request.method == 'GET':
            chests = Chest.objects.all().values()
            return JsonResponse({'chests': list(chests)}, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
def GetChestBySerialAndSetNum(request: HttpRequest):
    try:
        if request.method == 'GET':
            id = request.GET.get('id')
            if id:
                chest = Chest.objects.filter(id=id).values().first()
                if not chest:
                    return JsonResponse({'error': 'Chest not found'}, status=404)
                return JsonResponse(chest, safe=False)

            serial = request.GET.get('serial')
            case_number = request.GET.get('case_number')
            if not serial or not case_number:
                return JsonResponse({'error': 'Missing "serial" or "case_number" parameter'}, status=400)

            chest = Chest.objects.filter(serial=serial, case_number=case_number).values().first()
            if not chest:
                return JsonResponse({'error': 'Chest not found'}, status=404)

            return JsonResponse(chest, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def ItemApi(request):
    try:
        if request.method == 'GET':
            chest_serial = request.GET.get('serial')
            if not chest_serial:
                return JsonResponse({'error': 'Missing "serial" parameter'}, status=400)
            chest_case_number = request.GET.get('case_number')
            if not chest_case_number:
                return JsonResponse({'error': 'Missing "case_number" parameter'}, status=400)
            
            chest = Chest.objects.filter(serial=chest_serial, case_number=chest_case_number).first()
            if not chest:
                return JsonResponse({'error': 'Chest not found'}, status=404)

            items = Item.objects.filter(chest_id=chest.id).order_by('name').values()
            return JsonResponse(list(items), safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def GetItemById(request: HttpRequest):
    try:
        if request.method == 'GET':
            id = request.GET.get('id')
            if id:
                item = Item.objects.filter(id=id).values().first()
                if not item:
                    return JsonResponse({'error': 'Item not found'}, status=404)
                return JsonResponse(item, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def SearchAny(request: HttpRequest):
    try:
        if request.method == 'GET':
            search_term = request.GET.get('term')
            if not search_term:
                return JsonResponse({'error': 'Missing "term" parameter'}, status=400)

            chests = Chest.objects.filter(
                Q(serial__icontains=search_term) |
                Q(nsn__icontains=search_term) |
                Q(description__icontains=search_term)
            ).values()
            items = Item.objects.filter(
                Q(name__icontains=search_term) |
                Q(name_ext__icontains=search_term) |
                Q(nsn__icontains=search_term)
            ).values()

            return JsonResponse({
                'chests': list(chests),
                'items': list(items)
            }, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@transaction.atomic
def UpdateLocation(request):
    user = request.user

    if not user.is_staff:
        raise ValidationError("User role not permitted.")

    data = request.data
    location = data.get("location")
    chest_list = data.get("chest_list")

    if not location or not chest_list:
        raise ValidationError("Both 'location' and 'chest_list' are required.")

    chest_obj = []
    for chest in chest_list:
        serial = chest.get("serial")
        case_number = chest.get("case_number")

        if not serial or case_number is None:
            continue  # Skip invalid entries

        obj = Chest.objects.filter(serial=serial, case_number=case_number).first()
        if obj:
            obj.location = location
            chest_obj.append(obj)

    if chest_obj:
        Chest.objects.bulk_update(chest_obj, ['location'])

    return JsonResponse({"message": "location updated"}, status=200)