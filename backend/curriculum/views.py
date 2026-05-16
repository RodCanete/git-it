from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from progress.models import ScenarioProgress
from .models import Module, Scenario, ScenarioTemplate
from .serializers import ModuleSerializer, ScenarioSerializer, ScenarioTemplateSerializer


class ModuleListView(generics.ListAPIView):
    queryset = Module.objects.prefetch_related('scenarios__templates').all()
    serializer_class = ModuleSerializer


class ScenarioDetailView(generics.RetrieveAPIView):
    queryset = Scenario.objects.prefetch_related('templates').all()
    serializer_class = ScenarioSerializer


class NextTemplateView(APIView):
    def get(self, request, pk):
        scenario = get_object_or_404(Scenario, pk=pk)
        available_indexes = list(
            ScenarioTemplate.objects
            .filter(scenario=scenario)
            .order_by('template_index')
            .values_list('template_index', flat=True)
        )
        if not available_indexes:
            return Response(
                {'detail': 'No templates defined for this scenario.'},
                status=404,
            )

        sp, _ = ScenarioProgress.objects.get_or_create(user=request.user, scenario=scenario)
        last = sp.last_template_used

        if last in available_indexes:
            pos = available_indexes.index(last)
            next_index = available_indexes[(pos + 1) % len(available_indexes)]
        else:
            next_index = available_indexes[0]

        template = ScenarioTemplate.objects.get(scenario=scenario, template_index=next_index)
        return Response(ScenarioTemplateSerializer(template).data)
