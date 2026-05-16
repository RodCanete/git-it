from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('curriculum.urls')),
    path('api/', include('progress.urls')),
    path('api/admin/', include('admin_api.urls')),
]
