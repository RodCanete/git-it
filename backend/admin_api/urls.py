from django.urls import path
from . import views

urlpatterns = [
    path('stats/', views.StatsView.as_view(), name='admin-stats'),
    path('students/', views.StudentListView.as_view(), name='admin-students'),
    path('students/<int:pk>/', views.StudentDetailView.as_view(), name='admin-student-detail'),
    path('commands/incorrect/', views.IncorrectCommandsView.as_view(), name='admin-incorrect-commands'),
]
