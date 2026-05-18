from rest_framework import serializers
from .models import Module, Scenario, ScenarioTemplate


class ScenarioTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScenarioTemplate
        fields = ['id', 'template_index', 'narrative', 'initial_state', 'target_state', 'min_commands', 'hard_cap']


class ModuleSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ['id', 'title', 'order']


class ScenarioSerializer(serializers.ModelSerializer):
    templates = ScenarioTemplateSerializer(many=True, read_only=True)
    module = ModuleSummarySerializer(read_only=True)

    class Meta:
        model = Scenario
        fields = ['id', 'title', 'specific_objective', 'difficulty', 'order', 'module', 'templates']


class ModuleSerializer(serializers.ModelSerializer):
    scenarios = ScenarioSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ['id', 'title', 'color', 'icon', 'order', 'scenarios']
