from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('progress', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='scenarioprogress',
            name='easy_completed',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='scenarioprogress',
            name='medium_completed',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='scenarioprogress',
            name='hard_completed',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='scenarioprogress',
            name='tier_variant_attempts',
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='scenarioprogress',
            name='hint_cycle_active',
            field=models.BooleanField(default=False),
        ),
    ]
