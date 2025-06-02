from django.http import JsonResponse, HttpRequest
from chest.models import Chest, Item
from .models import AccountRecord
from django.utils.timezone import now

def GetLogByChest(request: HttpRequest):
    if request.method != 'GET':
        return JsonResponse({'error': 'Only GET method is allowed'}, status=405)

    serial = request.GET.get('serial')
    set_number = request.GET.get('set_number')

    if not serial:
        return JsonResponse({'error': 'Missing "serial" parameter'}, status=400)
    if not set_number:
        return JsonResponse({'error': 'Missing "set_number" parameter'}, status=400)

    try:
        chest = Chest.objects.filter(serial=serial, set_number=set_number).values().first()
        if not chest:
            return JsonResponse({'error': 'Chest not found'}, status=404)
        
        log = AccountRecord.objects.filter(chest_id=chest['id']).order_by('-created_at').values()[:100]
        return JsonResponse(list(log), safe=False)
    except Exception as e:
        return JsonResponse({'error': 'Internal server error', 'details': str(e)}, status=500)

def GetLogByItem(request: HttpRequest):
    if request.method != 'GET':
        return JsonResponse({'error': 'Only GET method is allowed'}, status=405)

    item_id = request.GET.get('item_id')

    if not item_id:
        return JsonResponse({'error': 'Missing "item_id" parameter'}, status=400)

    try:
        item = Item.objects.filter(id=item_id).values().first()
        if not item:
            return JsonResponse({'error': 'Item not found'}, status=404)
        
        log = AccountRecord.objects.filter(item_id=item['id']).order_by('-created_at').values()[:100]
        return JsonResponse(list(log), safe=False)
    except Exception as e:
        return JsonResponse({'error': 'Internal server error', 'details': str(e)}, status=500)

def GetLogByLastName(request: HttpRequest):
    if request.method != 'GET':
        return JsonResponse({'error': 'Only GET method is allowed'}, status=405)

    last_name = request.GET.get('last_name')

    if not last_name:
        return JsonResponse({'error': 'Missing "last_name" parameter'}, status=400)

    try:
        log_by_first_name = AccountRecord.objects\
            .filter(last_name__icontains=last_name)\
            .order_by('first_name', '-created_at')\
            .values()\
            [:100]
        
        records = []
        
        for record in log_by_first_name:
            first_name = record.get('first_name')
            group = next((obj for obj in records if obj['first_name'] == first_name), None)
    
            if group is None:
                # If not found, create a new group
                records.append({
                    'first_name': first_name,
                    'records': [record]
                })
            else:
                # Append the record to the existing group
                group['records'].append(record)
                
        
        return JsonResponse(records, safe=False)
    except Exception as e:
        return JsonResponse({'error': 'Internal server error', 'details': str(e)}, status=500)
    
def Checkout(request: HttpRequest):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)

    try:
        data = request.POST
        chest_id = data.get('chest_id')
        item_id = data.get('item_id')
        validate = (chest_id is not None) ^ (item_id is not None)
        rank = data.get('rank', 'NONE')
        first_name = data.get('first_name', '').strip().upper()
        last_name = data.get('last_name').strip().upper()
        action = True

        if not last_name or not rank:
            return JsonResponse({'error': 'Missing required parameters'}, status=400)
        
        if not validate:
            return JsonResponse({'error': 'Must specify either chest_id or item_id, but not both'}, status=400)

        qty = 1
        chest: Chest = None
        item: Item = None
        
        if chest_id:
            chest = Chest.objects.filter(id=chest_id).first()
            if not chest:
                return JsonResponse({'error': 'Chest not found'}, status=404)
        elif item_id:
            qty = int(data.get('qty')) or qty
            if qty < 1:
                return JsonResponse({'error': 'Quantity must be at least 1'}, status=400)
            item = Item.objects.filter(id=item_id).first()
            if not item:
                return JsonResponse({'error': 'Item not found in the specified chest'}, status=404)

        record = AccountRecord(
            chest=chest,
            item=item,
            rank=rank,
            first_name=first_name,
            last_name=last_name,
            qty=qty,
            action=action)
        record.save()
        
        if item_id:
            item.qty_real -= qty
            if item.qty_real < 0:
                return JsonResponse({'error': 'Insufficient quantity in item'}, status=400)
            item.save()

        return JsonResponse({'message': 'Log recorded successfully'}, status=201)
    except Exception as e:
        return JsonResponse({'error': 'Internal server error', 'details': str(e)}, status=500)

def Checkin(request: HttpRequest):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)

    try:
        data = request.POST
        id = data.get('id')

        if not id:
            return JsonResponse({'error': 'Missing required id parameters'}, status=400)

        record: AccountRecord = AccountRecord.objects.get(id=id)
        
        if not record:
            return JsonResponse({'message': 'Nothing to do'}, status=204)
        
        if record.item is not None:
            item = Item.objects.filter(id=record.item_id).first()
            if not item:
                return JsonResponse({'error': 'Item not found'}, status=404)
            item.qty_real += record.qty
            item.save()
        
        record.pk = None
        record.action = False
        record.created_at = now()
        record.save()

        return JsonResponse({'message': 'Log recorded successfully'}, status=201)
    except Exception as e:
        return JsonResponse({'error': 'Internal server error', 'details': str(e)}, status=500)