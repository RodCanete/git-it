from django.urls import path
from . import views

urlpatterns = [
    path('progress/', views.ProgressView.as_view(), name='progress'),
    path('sessions/', views.SessionCreateView.as_view(), name='session-create'),
    path('sessions/<int:pk>/', views.SessionUpdateView.as_view(), name='session-update'),
    path('sessions/<int:pk>/commands/', views.CommandLogView.as_view(), name='command-log'),
]
