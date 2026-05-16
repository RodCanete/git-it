from django.urls import path
from . import views

urlpatterns = [
    path('modules/', views.ModuleListView.as_view(), name='module-list'),
    path('scenarios/<int:pk>/', views.ScenarioDetailView.as_view(), name='scenario-detail'),
    path('scenarios/<int:pk>/next-template/', views.NextTemplateView.as_view(), name='next-template'),
]
