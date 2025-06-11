import csv
from io import StringIO
from django.forms import ValidationError
from django.http import HttpResponse, JsonResponse, HttpRequest
from chest.models import Chest, Item
from .util import generate_pdf_blob
from .models import AccountRecord, ChestInventoryPdf, UserChestCustody, UserItemCustody
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

def GetChestInventoryPdfList(request: HttpRequest):
    serial = request.GET.get('serial')
    case_number = request.GET.get('case_number')
    inventoryPdfList = list(ChestInventoryPdf.objects.filter(
        chest__serial=serial,
        chest__case_number=case_number)\
        .order_by('-created_at')\
        .values('created_at', 'id'))
    return JsonResponse({"pdf_list": inventoryPdfList}, safe=False)

def GetChestInventoryPdf(request: HttpRequest):
    serial = request.GET.get('serial')
    case_number = request.GET.get('case_number')
    id = request.GET.get('id')
    inventoryPdfData = ChestInventoryPdf.objects.filter(
        chest__serial=serial,
        chest__case_number=case_number,
        id=id).first().pdf_data

    # Return the PDF in the response
    response = HttpResponse(inventoryPdfData, content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="chest_inventory.pdf"'
    return response

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
    data = request.data
    chest_id = data.get('chest_id')
    item_list = data.get('item_list')
    user = request.user
    action = True

    # XOR validation: one and only one of chest_id or item_list must be given
    if (chest_id is None) == (item_list is None):
        raise ValidationError('Must specify either chest_id or item_list, but not both.')

    if chest_id:
        chest = Chest.objects.filter(id=chest_id).first()
        if not chest:
            raise ValidationError('Chest not found')

        chest_items = list(Item.objects.filter(chest=chest))
        if not chest_items:
            return JsonResponse({'message': 'No items available to checkout in this chest.'}, status=200)

        account_records = []

        for item in chest_items:
            custody = UserChestCustody(
                user=user,
                item=item,
                chest=chest,
                current_qty=item.qty_real
            )
            custody.save()  # Required due to multi-table inheritance

            account_records.append(AccountRecord(
                user=user,
                chest=chest,
                item=item,
                user_item_custody=custody,
                original_qty=item.qty_real,
                transaction_qty=item.qty_real,
                action=action,
                created_at=now()
            ))

            item.qty_real = 0  # Set after saving custody

        AccountRecord.objects.bulk_create(account_records)
        Item.objects.bulk_update(chest_items, ['qty_real'])

    else:  # Individual item checkouts
        item_ids = [entry['item_id'] for entry in item_list if 'item_id' in entry]
        items_map = Item.objects.in_bulk(item_ids)  # returns dict {id: Item}

        account_records = []
        custody_instances = []
        updated_items = []

        for entry in item_list:
            item_id = entry.get('item_id')
            qty = entry.get('qty', 1)

            if item_id is None or item_id not in items_map:
                raise ValidationError(f"Item with ID {item_id} not found.")

            if qty < 1:
                raise ValidationError(f"Invalid quantity ({qty}) for item {item_id}")

            item = items_map[item_id]

            if item.qty_real < qty:
                raise ValidationError(f"Insufficient quantity for item {item.name} (Available: {item.qty_real})")

            item.qty_real -= qty
            updated_items.append(item)

            custody = UserItemCustody(
                user=user,
                item=item,
                current_qty=qty
            )
            custody.save()  # Required to get PK for FK in AccountRecord

            account_records.append(AccountRecord(
                user=user,
                chest=None,
                item=item,
                user_item_custody=custody,
                original_qty=qty,
                transaction_qty=qty,
                action=action,
                created_at=now()
            ))

        AccountRecord.objects.bulk_create(account_records)
        Item.objects.bulk_update(updated_items, ['qty_real'])

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

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@transaction.atomic
def InventoryChest(request: HttpRequest):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)

    data = request.data
    user = request.user
    item_custody_id_qty_list = data.get('item_custody_id_qty_list')

    if not item_custody_id_qty_list:
        raise ValidationError("Missing item_custody_id_qty_list data field")

    # Build lookup maps
    qty_map = {item["id"]: item["qty"] for item in item_custody_id_qty_list}
    note_map = {item["id"]: item["note"] for item in item_custody_id_qty_list}

    # Fetch custody records with related item and chest
    user_item_custody_list = list(UserChestCustody.objects
        .filter(id__in=qty_map.keys(), user=user)
        .select_related("item", "chest")
        .order_by("item__layer"))

    if not user_item_custody_list:
        raise ValidationError("No matching custody records found")

    # Pre-fetch existing account records for cloning
    records_map = {
        r.user_item_custody_id: r for r in AccountRecord.objects.filter(
            user_item_custody__in=user_item_custody_list,
            user=user
        )
    }

    # CSV header
    table_headers = [
        "Item name", "Item detail", "NSN",
        "Issued QTY", "Checkout QTY", "Checkin QTY", "Note"
    ]

    # Use csv.writer for safe formatting
    csv_buffer = StringIO()
    writer = csv.writer(csv_buffer, quoting=csv.QUOTE_MINIMAL)
    writer.writerow(table_headers)

    updated_items = []
    new_records = []
    chest = None

    for custody in user_item_custody_list:
        item = custody.item
        if not item:
            continue

        if chest is None:
            chest = custody.chest

        transaction_qty = qty_map.get(custody.pk, 0)
        note = note_map.get(custody.pk, '')

        # Update item quantity (bounded by total)
        item.qty_real = min(item.qty_real + transaction_qty, item.qty_total)
        updated_items.append(item)

        # Clone and prepare return record
        original_record = records_map.get(custody.pk)
        if original_record:
            original_record.pk = None
            original_record.action = False  # Returning
            original_record.created_at = now()
            original_record.transaction_qty = transaction_qty
            new_records.append(original_record)

        # Write CSV row safely
        writer.writerow([
            item.name,
            item.name_ext or '',
            item.nsn or '',
            item.qty_total,
            custody.current_qty,
            transaction_qty,
            note
        ])

    # Apply DB updates in bulk
    Item.objects.bulk_update(updated_items, ['qty_real'])
    AccountRecord.objects.bulk_create(new_records)

    # Remove custody records
    UserChestCustody.objects.filter(id__in=[c.pk for c in user_item_custody_list]).delete()

    # Generate and save PDF
    csv_string = csv_buffer.getvalue()
    pdf_blob = generate_pdf_blob(csv_string, chest, user)

    ChestInventoryPdf.objects.create(
        chest=chest,
        pdf_data=pdf_blob
    )

    # Return the PDF in the response
    response = HttpResponse(pdf_blob, content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="chest_inventory.pdf"'
    return response
