"""Fading-scaffold flow: tier attempts, variant rotation, and hint cycles."""

from curriculum.models import ScenarioTemplate

TIER_ORDER = ('easy', 'medium', 'hard')
ATTEMPTS_PER_VARIANT = 2


def available_template_indexes(scenario):
    return list(
        ScenarioTemplate.objects.filter(scenario=scenario)
        .order_by('template_index')
        .values_list('template_index', flat=True)
    )


def tier_progress_payload(sp):
    return {
        'easy_completed': sp.easy_completed,
        'medium_completed': sp.medium_completed,
        'hard_completed': sp.hard_completed,
        'scenario_completed': sp.completed,
    }


def active_tier(sp):
    if not sp.easy_completed:
        return 'easy'
    if not sp.medium_completed:
        return 'medium'
    if not sp.hard_completed:
        return 'hard'
    return 'hard'


def tier_is_unlocked(sp, tier):
    if tier == 'easy':
        return True
    if tier == 'medium':
        return sp.easy_completed
    if tier == 'hard':
        return sp.medium_completed
    return False


def current_template_index(sp, available_indexes):
    if not available_indexes:
        return None
    if sp.last_template_used in available_indexes:
        return sp.last_template_used
    return available_indexes[0]


def resolve_template(scenario, template_index):
    return ScenarioTemplate.objects.get(scenario=scenario, template_index=template_index)


def workspace_state(sp, scenario, difficulty=None):
    """Current template and tier metadata without advancing rotation."""
    available_indexes = available_template_indexes(scenario)
    if not available_indexes:
        return None

    tier = difficulty if difficulty and tier_is_unlocked(sp, difficulty) else active_tier(sp)
    template_index = current_template_index(sp, available_indexes)
    template = resolve_template(scenario, template_index)

    return {
        'template': template,
        'tier': tier,
        'template_index': template_index,
        'variant_attempt': sp.tier_variant_attempts + 1,
        'hint_mode': sp.hint_cycle_active,
        'tier_progress': tier_progress_payload(sp),
    }


def advance_variant(sp, available_indexes):
    """Move to the next variant, or restart variant 1 with hints when exhausted."""
    last = sp.last_template_used
    if last not in available_indexes:
        next_index = available_indexes[0]
        action = 'rotate_variant'
    else:
        pos = available_indexes.index(last)
        if pos + 1 < len(available_indexes):
            next_index = available_indexes[pos + 1]
            action = 'rotate_variant'
        else:
            sp.hint_cycle_active = True
            next_index = available_indexes[0]
            action = 'hint_restart'

    sp.last_template_used = next_index
    sp.tier_variant_attempts = 0
    return next_index, action


def after_session(sp, scenario, difficulty_tier, passed):
    """
    Update progress after a session ends. Returns scaffold instructions for the client.
    """
    available_indexes = available_template_indexes(scenario)
    if not available_indexes:
        return {'action': 'error', 'message': 'No templates defined for this scenario.'}

    sp.attempts += 1
    tier = difficulty_tier if difficulty_tier in TIER_ORDER else active_tier(sp)

    if passed:
        sp.tier_variant_attempts = 0
        sp.hint_cycle_active = False

        if tier == 'easy':
            sp.easy_completed = True
        elif tier == 'medium':
            sp.medium_completed = True
        elif tier == 'hard':
            sp.hard_completed = True

        if sp.easy_completed and sp.medium_completed and sp.hard_completed:
            sp.completed = True
            sp.save()
            return {
                'action': 'scenario_complete',
                'tier': tier,
                'tier_progress': tier_progress_payload(sp),
                'message': 'All difficulty tiers complete!',
            }

        next_tier = active_tier(sp)
        sp.last_template_used = available_indexes[0]
        sp.save()
        return {
            'action': 'tier_unlocked',
            'tier': tier,
            'unlocked_tier': next_tier,
            'tier_progress': tier_progress_payload(sp),
            'message': f'{tier.capitalize()} complete — {next_tier.capitalize()} unlocked.',
            'template_index': current_template_index(sp, available_indexes),
        }

    # MISS — count toward per-variant attempts
    sp.tier_variant_attempts += 1

    if sp.tier_variant_attempts < ATTEMPTS_PER_VARIANT:
        sp.save()
        return {
            'action': 'reset_same',
            'tier': tier,
            'variant_attempt': sp.tier_variant_attempts + 1,
            'template_index': current_template_index(sp, available_indexes),
            'hint_mode': sp.hint_cycle_active,
            'tier_progress': tier_progress_payload(sp),
            'message': 'Review the feedback and try again on this scenario.',
        }

    # Second fail on this variant — rotate or hint-restart
    sp.tier_variant_attempts = 0
    next_index, action = advance_variant(sp, available_indexes)
    sp.save()

    messages = {
        'rotate_variant': "Let's try a fresh scenario.",
        'hint_restart': 'Review the Lesson Overview, or use the hints below.',
    }

    return {
        'action': action,
        'tier': tier,
        'variant_attempt': 1,
        'template_index': next_index,
        'hint_mode': sp.hint_cycle_active,
        'tier_progress': tier_progress_payload(sp),
        'message': messages.get(action, "Let's try a fresh scenario."),
    }
