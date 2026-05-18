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
        fields = [
            'scenario', 'completed', 'attempts', 'last_template_used',
            'easy_completed', 'medium_completed', 'hard_completed',
            'tier_variant_attempts', 'hint_cycle_active',
        ]


class SessionSerializer(serializers.ModelSerializer):
    difficulty_tier = serializers.ChoiceField(
        choices=['easy', 'medium', 'hard'],
        write_only=True,
        required=False,
    )
    scaffold = serializers.JSONField(read_only=True)

    class Meta:
        model = Session
        fields = [
            'id', 'scenario', 'template', 'commands_used', 'target_achieved',
            'within_minimum', 'result', 'terminated_by_cap', 'started_at', 'ended_at',
            'difficulty_tier', 'scaffold',
        ]
        read_only_fields = ['id', 'started_at', 'within_minimum', 'result', 'scaffold']


class UserProgressSerializer(serializers.ModelSerializer):
    scenario_progress = serializers.SerializerMethodField()

    class Meta:
        model = UserProgress
        fields = ['command_accuracy', 'pass_sessions', 'total_sessions', 'scenario_progress']

    def get_scenario_progress(self, obj):
        qs = ScenarioProgress.objects.filter(user=obj.user)
        return ScenarioProgressSerializer(qs, many=True).data
