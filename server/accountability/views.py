from django.forms import ValidationError
from django.http import HttpResponse, JsonResponse, HttpRequest
from chest.models import Chest, Item
from .models import AccountRecord, UserChestCustody, UserItemCustody
from django.utils.timezone import now
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db import transaction
from django.core.serializers import serialize
import json

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

def GetCheckedOutItemsInChest(chest_serial: str, case_number: int, user):
    user_item_custody_id_list = UserChestCustody.objects\
        .filter(
            user=user,
            chest__serial=chest_serial,
            chest__case_number=case_number)\
        .values('useritemcustody_ptr_id')
    return list(user_item_custody_id_list)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def GetCheckedOutChestByUser(request: HttpRequest):
    distinct_chests = UserChestCustody.objects\
        .filter(user=request.user)\
        .select_related('chest')\
        .order_by('chest')\
        .distinct('chest')

    # Pull just the related Chest objects
    chests = [custody.chest for custody in distinct_chests]

    serialized = json.loads(serialize('json', chests))

    return JsonResponse([value["fields"] for value in serialized], safe=False)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def GetIndividualCheckedOutItemsByUser(request):
    try:
        user = request.user

        item_checkedout_as_chest_list = list(UserChestCustody\
            .objects\
            .filter(user=user)\
            .values_list('useritemcustody_ptr_id', flat=True))

        records = list(UserItemCustody\
            .objects\
            .filter(user=user)\
            .exclude(id__in=item_checkedout_as_chest_list)
            .order_by('item')\
            .values()\
            [:100]
        )

        if not records:
            return HttpResponse(status=204)  # No content, no body

        item_ids = [record["item_id"] for record in records if "item_id" in record]

        items = Item.objects.filter(id__in=item_ids).values()
        item_map = {item["id"]: item for item in items}

        compiled_log = [
            {
                "item": item_map.get(record["item_id"]),
                "record": record,
            }
            for record in records
        ]

        return JsonResponse({
            "compiled_log": compiled_log,
        }, safe=False)

    except Exception as e:
        return JsonResponse({'error': 'Internal server error', 'details': str(e)}, status=500)
 
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def GetChestCheckedOutItemsByUser(request):
    try:
        user = request.user
        
        serial = request.GET.get('serial')
        case_number = request.GET.get('case_number')
        
        chest = Chest.objects.filter(serial=serial, case_number=case_number).first()

        item_checkedout_as_chest_list = list(UserChestCustody\
            .objects\
            .filter(user=user, chest=chest)\
            .values_list('useritemcustody_ptr_id', flat=True))

        records = list(UserItemCustody\
            .objects\
            .filter(user=user, id__in=item_checkedout_as_chest_list)\
            .order_by('item')\
            .values()\
            [:300]
        )

        if not records:
            return HttpResponse(status=204)

        item_ids = [record["item_id"] for record in records if "item_id" in record]

        items = Item.objects.filter(id__in=item_ids).values()
        item_map = {item["id"]: item for item in items}

        compiled_log = [
            {
                "item": item_map.get(record["item_id"]),
                "record": record,
            }
            for record in records
        ]
        
        compiled_log.sort(key=lambda log: 
            log["item"]["layer"]
        )

        return JsonResponse({
            "compiled_log": compiled_log,
        }, safe=False)

    except Exception as e:
        return JsonResponse({'error': 'Internal server error', 'details': str(e)}, status=500)
 
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@transaction.atomic
def Checkout(request: HttpRequest):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)

    data = request.data
    chest_id = data.get('chest_id')
    item_list = data.get('item_list')

    validate = (chest_id is not None) ^ (item_list is not None)
    user = request.user
    action = True
    
    if not validate:
        raise ValidationError('Must specify either chest_id or item_list, but not both')
    
    if chest_id:
        chest = Chest.objects.filter(id=chest_id).first()
        if not chest:
            raise ValidationError('Chest not found')
        chest_item_list: list[Item] = list(Item.objects.filter(chest=chest))
        
        user_chest_custody_created: list[UserChestCustody] = []
        account_record_to_create: list[AccountRecord] = []
        
        for item in chest_item_list:
            if item.qty_real == 0:
                continue
            user_chest_custody_created.append(UserChestCustody.objects.create(
                user=user,
                item=item,
                chest=chest,
                current_qty=item.qty_real
            ))
            
            item.qty_real = 0

        for created_object in user_chest_custody_created:
            account_record_to_create.append(AccountRecord(
                user=user,
                chest=chest,
                item=created_object.item,
                user_item_custody=created_object,
                original_qty=created_object.current_qty,
                transaction_qty=created_object.current_qty,
                action=action
            ))
        
        AccountRecord.objects.bulk_create(account_record_to_create)
        Item.objects.bulk_update(chest_item_list, ["qty_real"])

    elif item_list:
        for entry in item_list:
            item_id = entry.get('item_id')
            qty = entry.get('qty', 1)

            if not item_id:
                raise ValidationError('Each item must include item_id')

            if qty < 1:
                raise ValidationError(f'Invalid quantity ({qty}) for item {item_id}')

            item = Item.objects.filter(id=item_id).first()
            if not item:
                raise ValidationError(f'Item with ID {item_id} not found')

            if item.qty_real < qty:
                raise ValidationError(f'Insufficient quantity for item {item.name}')

            item.qty_real -= qty
            
            user_item_custody = UserItemCustody.objects.create(
                user=user,
                item=item,
                current_qty=qty
            )

            AccountRecord.objects.create(
                user=user,
                chest=None,
                item=item,
                user_item_custody=user_item_custody,
                original_qty=qty,
                transaction_qty=qty,
                action=action
            )
            
            item.save()

    else:
        return JsonResponse({'error': 'Must specify either chest_id or item_list, but not both'}, status=400)

    return JsonResponse({'message': 'Log recorded successfully'}, status=201)

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@transaction.atomic
def Checkin(request: HttpRequest):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)

    try:
        data = request.data
        user = request.user
        custody_list = data.get('record_list')
        qty_map = {item["id"]: item["qty"] for item in custody_list}

        if not custody_list:
            return JsonResponse({'error': 'Missing required id parameters'}, status=400)
        
        item_checkedout_as_chest_list = list(UserChestCustody\
            .objects\
            .filter(user=user)\
            .values_list('useritemcustody_ptr_id', flat=True))

        user_item_custody_list = UserItemCustody\
            .objects\
            .filter(id__in=qty_map.keys(), user=user)\
            .exclude(id__in=item_checkedout_as_chest_list)
        
        if not user_item_custody_list.exists():
            return HttpResponse(status=204)
        
        for custody in user_item_custody_list:
            if custody.item is not None:
                record: AccountRecord = AccountRecord.objects.filter(user_item_custody=custody, user=user).first()
                qty = qty_map[custody.pk]

                if not custody.item:
                    return JsonResponse({'error': 'Item not found'}, status=404)
                
                qty_real_after_returned = qty + custody.item.qty_real
                custody.item.qty_real = qty_real_after_returned
                if qty_real_after_returned > custody.item.qty_total:
                    custody.item.qty_real = custody.item.qty_total

                record.pk = None
                record.action = False
                record.created_at = now()
                record.transaction_qty = qty

                record.save()
                custody.item.save()
                
                custody.current_qty = custody.current_qty - qty
                if custody.current_qty > 0:
                    custody.save()
                else:
                    custody.delete()

        return JsonResponse({'message': 'Log recorded successfully'}, status=201)
    except Exception as e:
        return JsonResponse({'error': 'Internal server error', 'details': str(e)}, status=500)
