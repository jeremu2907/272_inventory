# from django.shortcuts import render
from django.http import JsonResponse, HttpRequest
from django.db.models import Q

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
            set_number = request.GET.get('set_number')
            if not serial or not set_number:
                return JsonResponse({'error': 'Missing "serial" or "set_number" parameter'}, status=400)

            chest = Chest.objects.filter(serial=serial, set_number=set_number).values().first()
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
            chest_set_number = request.GET.get('set_number')
            if not chest_set_number:
                return JsonResponse({'error': 'Missing "set_number" parameter'}, status=400)
            
            chest = Chest.objects.filter(serial=chest_serial, set_number=chest_set_number).first()
            if not chest:
                return JsonResponse({'error': 'Chest not found'}, status=404)

            items = Item.objects.filter(chest_id=chest.id).values()
            return JsonResponse(list(items), safe=False)
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