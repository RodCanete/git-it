from django.conf import settings
from django.db import models

from curriculum.models import Scenario, ScenarioTemplate


class UserProgress(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='progress')
    command_accuracy = models.FloatField(default=0.0)
    pass_sessions = models.PositiveIntegerField(default=0)
    total_sessions = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f'{self.user.email} — accuracy {self.command_accuracy:.0%}'

    def recompute(self):
        sessions = Session.objects.filter(user=self.user, result__in=['pass', 'miss'])
        self.total_sessions = sessions.count()
        self.pass_sessions = sessions.filter(result='pass').count()
        self.command_accuracy = self.pass_sessions / self.total_sessions if self.total_sessions else 0.0
        self.save()


class ScenarioProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='scenario_progress')
    scenario = models.ForeignKey(Scenario, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)
    last_template_used = models.PositiveSmallIntegerField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'scenario')

    def __str__(self):
        return f'{self.user.email} / {self.scenario}'


class Session(models.Model):
    RESULT_PASS = 'pass'
    RESULT_MISS = 'miss'
    RESULT_ABANDONED = 'abandoned'
    RESULT_CHOICES = [
        (RESULT_PASS, 'PASS'),
        (RESULT_MISS, 'MISS'),
        (RESULT_ABANDONED, 'ABANDONED'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sessions')
    scenario = models.ForeignKey(Scenario, on_delete=models.CASCADE)
    template = models.ForeignKey(ScenarioTemplate, on_delete=models.CASCADE)
    commands_used = models.PositiveIntegerField(default=0)
    target_achieved = models.BooleanField(default=False)
    within_minimum = models.BooleanField(default=False)
    result = models.CharField(max_length=10, choices=RESULT_CHOICES, null=True, blank=True)
    terminated_by_cap = models.BooleanField(default=False)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'{self.user.email} / {self.scenario} / {self.result}'


class CommandLog(models.Model):
    session = models.ForeignKey(Session, related_name='commands', on_delete=models.CASCADE)
    command = models.TextField()
    was_valid = models.BooleanField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'[{self.session_id}] {self.command}'
