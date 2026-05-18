from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from progress.models import ScenarioProgress
from progress.scaffold import workspace_state
from .models import Module, Scenario, ScenarioTemplate
from .serializers import ModuleSerializer, ScenarioSerializer, ScenarioTemplateSerializer


class ModuleListView(generics.ListAPIView):
    queryset = Module.objects.prefetch_related('scenarios__templates').all()
    serializer_class = ModuleSerializer


class ScenarioDetailView(generics.RetrieveAPIView):
    queryset = Scenario.objects.select_related('module').prefetch_related('templates').all()
    serializer_class = ScenarioSerializer


class NextTemplateView(APIView):
    """Returns the current workspace template without advancing rotation."""

    def get(self, request, pk):
        scenario = get_object_or_404(Scenario, pk=pk)
        sp, _ = ScenarioProgress.objects.get_or_create(user=request.user, scenario=scenario)
        difficulty = request.query_params.get('difficulty')

        state = workspace_state(sp, scenario, difficulty)
        if not state:
            return Response(
                {'detail': 'No templates defined for this scenario.'},
                status=404,
            )

        return Response({
            **ScenarioTemplateSerializer(state['template']).data,
            'scaffold': {
                'tier': state['tier'],
                'template_index': state['template_index'],
                'variant_attempt': state['variant_attempt'],
                'hint_mode': state['hint_mode'],
                'tier_progress': state['tier_progress'],
            },
        })


class AdvanceVariantView(APIView):
    """Manual Retry: advance to the next variant (same rules as second-attempt fail)."""

    def post(self, request, pk):
        scenario = get_object_or_404(Scenario, pk=pk)
        sp, _ = ScenarioProgress.objects.get_or_create(user=request.user, scenario=scenario)
        available_indexes = list(
            ScenarioTemplate.objects
            .filter(scenario=scenario)
            .order_by('template_index')
            .values_list('template_index', flat=True)
        )
        if not available_indexes:
            return Response({'detail': 'No templates defined.'}, status=404)

        from progress.scaffold import advance_variant

        sp.tier_variant_attempts = 0
        next_index, action = advance_variant(sp, available_indexes)
        sp.save()

        template = ScenarioTemplate.objects.get(scenario=scenario, template_index=next_index)
        messages = {
            'rotate_variant': "Let's try a fresh scenario.",
            'hint_restart': 'Review the Lesson Overview, or use the hints below.',
        }

        return Response({
            **ScenarioTemplateSerializer(template).data,
            'scaffold': {
                'action': action,
                'template_index': next_index,
                'variant_attempt': 1,
                'hint_mode': sp.hint_cycle_active,
                'message': messages.get(action, "Let's try a fresh scenario."),
            },
        })
