from django.db import models


class Module(models.Model):
    title = models.CharField(max_length=100)
    color = models.CharField(max_length=20)
    icon = models.CharField(max_length=50)
    order = models.PositiveIntegerField()

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title


class Scenario(models.Model):
    DIFFICULTY_CHOICES = [('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')]

    module = models.ForeignKey(Module, related_name='scenarios', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    specific_objective = models.CharField(max_length=10)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='easy')
    order = models.PositiveIntegerField()

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f'{self.specific_objective}: {self.title}'


class ScenarioTemplate(models.Model):
    scenario = models.ForeignKey(Scenario, related_name='templates', on_delete=models.CASCADE)
    template_index = models.PositiveSmallIntegerField()  # 1–5
    narrative = models.TextField()
    initial_state = models.JSONField()
    target_state = models.JSONField()
    min_commands = models.PositiveIntegerField()
    hard_cap = models.PositiveIntegerField()

    class Meta:
        unique_together = ('scenario', 'template_index')
        ordering = ['template_index']

    def __str__(self):
        return f'{self.scenario} — template {self.template_index}'
