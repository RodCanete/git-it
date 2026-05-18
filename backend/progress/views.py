from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, serializers as drf_serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from curriculum.serializers import ScenarioTemplateSerializer

from .models import UserProgress, ScenarioProgress, Session, CommandLog
from .serializers import UserProgressSerializer, SessionSerializer, CommandLogSerializer
from . import scaffold


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
        difficulty_tier = serializer.validated_data.pop('difficulty_tier', None)
        session = serializer.save(ended_at=timezone.now())

        within_minimum = session.commands_used <= session.template.min_commands
        passed = session.target_achieved and within_minimum
        result = Session.RESULT_PASS if passed else Session.RESULT_MISS
        session.within_minimum = within_minimum
        session.result = result
        session.save(update_fields=['within_minimum', 'result'])

        sp, _ = ScenarioProgress.objects.get_or_create(
            user=self.request.user, scenario=session.scenario
        )
        if sp.last_template_used is None:
            sp.last_template_used = session.template.template_index

        scaffold_result = scaffold.after_session(sp, session.scenario, difficulty_tier, passed)
        serializer._scaffold = scaffold_result

        progress, _ = UserProgress.objects.get_or_create(user=self.request.user)
        progress.recompute()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        data = serializer.data
        if hasattr(serializer, '_scaffold'):
            data['scaffold'] = serializer._scaffold
        return Response(data)


class CommandLogView(generics.CreateAPIView):
    serializer_class = CommandLogSerializer

    def perform_create(self, serializer):
        session = get_object_or_404(Session, pk=self.kwargs['pk'], user=self.request.user)
        serializer.save(session=session)
