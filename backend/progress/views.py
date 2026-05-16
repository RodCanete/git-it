from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, serializers as drf_serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserProgress, ScenarioProgress, Session, CommandLog
from .serializers import UserProgressSerializer, SessionSerializer, CommandLogSerializer


class ProgressView(APIView):
    def get(self, request):
        progress, _ = UserProgress.objects.get_or_create(user=request.user)
        return Response(UserProgressSerializer(progress).data)


class SessionCreateView(generics.CreateAPIView):
    serializer_class = SessionSerializer

    def perform_create(self, serializer):
        scenario = serializer.validated_data.get('scenario')
        template = serializer.validated_data.get('template')
        if template and scenario and template.scenario_id != scenario.id:
            raise drf_serializers.ValidationError(
                {'template': 'Template does not belong to the given scenario.'}
            )
        serializer.save(user=self.request.user)


class SessionUpdateView(generics.UpdateAPIView):
    serializer_class = SessionSerializer
    http_method_names = ['patch']

    def get_queryset(self):
        return Session.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        session = serializer.save(ended_at=timezone.now())

        within_minimum = session.commands_used <= session.template.min_commands
        result = Session.RESULT_PASS if (session.target_achieved and within_minimum) else Session.RESULT_MISS
        session.within_minimum = within_minimum
        session.result = result
        session.save(update_fields=['within_minimum', 'result'])

        sp, _ = ScenarioProgress.objects.get_or_create(
            user=self.request.user, scenario=session.scenario
        )
        sp.attempts += 1
        if result == Session.RESULT_PASS:
            sp.completed = True
        sp.last_template_used = session.template.template_index
        sp.save()

        progress, _ = UserProgress.objects.get_or_create(user=self.request.user)
        progress.recompute()


class CommandLogView(generics.CreateAPIView):
    serializer_class = CommandLogSerializer

    def perform_create(self, serializer):
        session = get_object_or_404(Session, pk=self.kwargs['pk'], user=self.request.user)
        serializer.save(session=session)
