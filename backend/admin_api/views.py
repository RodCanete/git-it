from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from progress.models import CommandLog, Session, UserProgress


class IsAdminUser(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.is_admin_user()


class StatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_students = User.objects.filter(role='student').count()
        avg_accuracy = UserProgress.objects.aggregate(avg=Avg('command_accuracy'))['avg'] or 0.0
        total_sessions = Session.objects.count()
        pass_count = Session.objects.filter(result='pass').count()
        pass_rate = pass_count / total_sessions if total_sessions else 0.0

        return Response({
            'total_students': total_students,
            'avg_command_accuracy': round(avg_accuracy, 4),
            'total_sessions': total_sessions,
            'pass_rate': round(pass_rate, 4),
        })


class StudentListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        students = User.objects.filter(role='student').select_related('progress')
        return Response([
            {
                'id': s.id,
                'email': s.email,
                'username': s.username,
                'command_accuracy': getattr(getattr(s, 'progress', None), 'command_accuracy', 0.0),
                'total_sessions': getattr(getattr(s, 'progress', None), 'total_sessions', 0),
            }
            for s in students
        ])


class StudentDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        student = get_object_or_404(User, pk=pk, role='student')
        sessions = (
            Session.objects
            .filter(user=student)
            .select_related('scenario', 'template')
            .order_by('-started_at')[:20]
        )
        return Response({
            'id': student.id,
            'email': student.email,
            'username': student.username,
            'sessions': [
                {
                    'id': s.id,
                    'scenario': s.scenario.title,
                    'result': s.result,
                    'commands_used': s.commands_used,
                    'min_commands': s.template.min_commands,
                    'started_at': s.started_at,
                }
                for s in sessions
            ],
        })


class IncorrectCommandsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        data = (
            CommandLog.objects
            .filter(was_valid=False)
            .values('command')
            .annotate(count=Count('id'))
            .order_by('-count')[:20]
        )
        return Response(list(data))
