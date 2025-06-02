# from django.shortcuts import render
from django.http import JsonResponse, HttpRequest

from .models import Item, Chest

def ChestApi(request):
    try:
        if request.method == 'GET':
            chests = Chest.objects.all().values()
            return JsonResponse({'chests': list(chests)}, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def SearchChestApi(request: HttpRequest):
    try:
        if request.method == 'GET':
            serial = request.GET.get('serial')
            if not serial:
                return JsonResponse({'error': 'Missing "serial" parameter'}, status=400)

            chests = Chest.objects.filter(serial=serial).values()
            return JsonResponse({'chests': list(chests)}, safe=False)
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
            return JsonResponse({'items': list(items)}, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)