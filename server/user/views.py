from django.http import JsonResponse
from .models import CustomUser

from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def GetUserProfile(request):
    user = request.user
    user = CustomUser.objects.filter(id=user.id).values().first()
    user_obj = {
        'id': user['id'],
        'username': user['username'],
        'first_name': user['first_name'],
        'last_name': user['last_name'],
        'rank': user['rank'],
        'is_staff': user['is_staff']
    }
    if not user:
        return JsonResponse({'error': 'User not found'}, status=404)
    return JsonResponse(user_obj, safe=False)