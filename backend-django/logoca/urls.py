from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health(request):
    return JsonResponse({"status": "ok", "service": "backend-django", "version": "1.0.0", "contact": "logocalogisticas@contato.com"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health, name='health'),
    path('api/', include('analytics.urls')),
    path('', health),
]
