from django.http import JsonResponse, HttpRequest
from chest.models import Chest, Item
from .models import AccountRecord
from django.utils.timezone import now
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

def GetLogByChest(request: HttpRequest):
    if request.method != 'GET':
        return JsonResponse({'error': 'Only GET method is allowed'}, status=405)

    serial = request.GET.get('serial')
    case_number = request.GET.get('case_number')

    if not serial:
        return JsonResponse({'error': 'Missing "serial" parameter'}, status=400)
    if not case_number:
        return JsonResponse({'error': 'Missing "case_number" parameter'}, status=400)

    try:
        chest = Chest.objects.filter(serial=serial, case_number=case_number).values().first()
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
            .filter(user__last_name__icontains=last_name)\
            .order_by('user__first_name', '-created_at')\
            .values()\
            [:100]
        
        records = []
        
        for record in log_by_first_name:
            first_name = record.get('user__first_name')
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
    
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def Checkout(request: HttpRequest):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)

    try:
        data = request.data
        chest_id = data.get('chest_id')
        item_list = data.get('item_list')

        validate = (chest_id is not None) ^ (item_list is not None)
        user = request.user
        action = True
        
        if not validate:
            return JsonResponse({'error': 'Must specify either chest_id or item_list, but not both'}, status=400)
        
        if chest_id:
            chest = Chest.objects.filter(id=chest_id).first()
            if not chest:
                return JsonResponse({'error': 'Chest not found'}, status=404)
        elif item_list:
            for entry in item_list:
                item_id = entry.get('item_id')
                qty = entry.get('qty', 1)

                if not item_id:
                    return JsonResponse({'error': 'Each item must include item_id'}, status=400)

                if qty < 1:
                    return JsonResponse({'error': f'Invalid quantity ({qty}) for item {item_id}'}, status=400)

                item = Item.objects.filter(id=item_id).first()
                if not item:
                    return JsonResponse({'error': f'Item with ID {item_id} not found'}, status=404)

                if item.qty_real < qty:
                    return JsonResponse({'error': f'Insufficient quantity for item {item.name}'}, status=400)

                item.qty_real -= qty
                item.save()

                AccountRecord.objects.create(
                    user=user,
                    chest=None,
                    item=item,
                    qty=qty,
                    action=action
                )

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