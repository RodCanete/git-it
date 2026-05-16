from rest_framework import serializers
from .models import UserProgress, ScenarioProgress, Session, CommandLog


class CommandLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommandLog
        fields = ['id', 'command', 'was_valid', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class ScenarioProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScenarioProgress
        fields = ['scenario', 'completed', 'attempts', 'last_template_used']


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = [
            'id', 'scenario', 'template', 'commands_used', 'target_achieved',
            'within_minimum', 'result', 'terminated_by_cap', 'started_at', 'ended_at',
        ]
        read_only_fields = ['id', 'started_at', 'within_minimum', 'result']


class UserProgressSerializer(serializers.ModelSerializer):
    scenario_progress = serializers.SerializerMethodField()

    class Meta:
        model = UserProgress
        fields = ['command_accuracy', 'pass_sessions', 'total_sessions', 'scenario_progress']

    def get_scenario_progress(self, obj):
        qs = ScenarioProgress.objects.filter(user=obj.user)
        return ScenarioProgressSerializer(qs, many=True).data
