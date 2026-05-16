"""
Management command: python manage.py seed_curriculum

Creates all Modules, Scenarios, and one ScenarioTemplate per scenario.
Templates for scenarios without full definitions use placeholder state data
that can be replaced by an admin via the Django admin or future tooling.
"""
from django.core.management.base import BaseCommand
from curriculum.models import Module, Scenario, ScenarioTemplate


MODULES = [
    {'id_ref': 0, 'title': 'Orientation', 'color': '#8B6FFF', 'icon': 'compass', 'order': 0},
    {'id_ref': 1, 'title': 'Local Foundations', 'color': '#4A9EFF', 'icon': 'git-branch', 'order': 1},
    {'id_ref': 2, 'title': 'Local Recovery', 'color': '#F5A623', 'icon': 'refresh-cw', 'order': 2},
    {'id_ref': 3, 'title': 'Merging & Remotes', 'color': '#01C38D', 'icon': 'git-merge', 'order': 3},
    {'id_ref': 4, 'title': 'Undoing Pushed Work', 'color': '#FF5A6A', 'icon': 'shield', 'order': 4},
]

SCENARIOS = [
    # Module 1 – Local Foundations
    {'slug': 'init-commit', 'module_order': 1, 'title': 'First Commit', 'so': 'SO 1.1', 'order': 1},
    {'slug': 'wrong-branch', 'module_order': 1, 'title': 'Wrong Branch Commit', 'so': 'SO 1.2', 'order': 2},
    {'slug': 'staging-area', 'module_order': 1, 'title': 'Partial Staging', 'so': 'SO 1.3', 'order': 3},
    {'slug': 'detached-head', 'module_order': 1, 'title': 'Detached HEAD', 'so': 'SO 1.4', 'order': 4},
    {'slug': 'branch-rename', 'module_order': 1, 'title': 'Branch Cleanup', 'so': 'SO 1.5', 'order': 5},
    {'slug': 'create-switch-branch', 'module_order': 1, 'title': 'Creating and Switching Branches', 'so': 'SO 1.6', 'order': 6},
    # Module 2 – Local Recovery
    {'slug': 'amend-commit', 'module_order': 2, 'title': 'Amend Last Commit', 'so': 'SO 2.1', 'order': 1},
    {'slug': 'reset-soft', 'module_order': 2, 'title': 'Soft Reset', 'so': 'SO 2.2', 'order': 2},
    {'slug': 'reset-hard', 'module_order': 2, 'title': 'Hard Reset', 'so': 'SO 2.3', 'order': 3},
    {'slug': 'restore-file', 'module_order': 2, 'title': 'Restore a File', 'so': 'SO 2.4', 'order': 4},
    {'slug': 'stash-wip', 'module_order': 2, 'title': 'Stash & Switch', 'so': 'SO 2.5', 'order': 5},
    # Module 3 – Merging & Remotes
    {'slug': 'fast-forward', 'module_order': 3, 'title': 'Fast-Forward Merge', 'so': 'SO 3.1', 'order': 1},
    {'slug': 'merge-conflict', 'module_order': 3, 'title': 'Merge Conflict', 'so': 'SO 3.2', 'order': 2},
    {'slug': 'rebase-branch', 'module_order': 3, 'title': 'Rebase Onto Main', 'so': 'SO 3.3', 'order': 3},
    {'slug': 'push-rejected', 'module_order': 3, 'title': 'Rejected Push', 'so': 'SO 3.4', 'order': 4},
    {'slug': 'fetch-merge', 'module_order': 3, 'title': 'Fetch & Integrate', 'so': 'SO 3.5', 'order': 5},
    # Module 4 – Undoing Pushed Work
    {'slug': 'revert-push', 'module_order': 4, 'title': 'Revert a Pushed Commit', 'so': 'SO 4.1', 'order': 1},
    {'slug': 'force-push', 'module_order': 4, 'title': 'Force Push Recovery', 'so': 'SO 4.2', 'order': 2},
    {'slug': 'lost-commit', 'module_order': 4, 'title': 'Lost Commit Recovery', 'so': 'SO 4.3', 'order': 3},
    {'slug': 'full-recovery', 'module_order': 4, 'title': 'Repository Recovery', 'so': 'SO 4.4', 'order': 4},
]

# Full template definitions ported from SCENARIOS_DB in the HTML.
# Each entry maps scenario slug -> list of templates (currently 1 per scenario;
# admins should add templates 2-5 for each scenario via the admin interface).
TEMPLATES = {
    'init-commit': [
        {
            'template_index': 1,
            'narrative': "You've started a new project. Stage all the new files and create a well-formed initial commit.",
            'initial_state': {
                'commits': [],
                'refs': {'HEAD': {'type': 'branch', 'ref': 'main'}, 'main': None},
                'stagingArea': [],
                'workingDir': [
                    {'name': 'README.md', 'status': 'new'},
                    {'name': 'index.js', 'status': 'new'},
                ],
            },
            'target_state': {
                'commits': [{'message': '__any__', 'parents': []}],
                'refs': {'HEAD': {'type': 'branch', 'ref': 'main'}},
                'stagingArea': [],
            },
            'min_commands': 2,
            'hard_cap': 4,
        },
    ],
    'create-switch-branch': [
        {
            'template_index': 1,
            'narrative': "Your team wants you to start working on a new dashboard feature. Create a new branch called `feature/dashboard`, switch to it, and make your first commit on that branch.",
            'initial_state': {
                'commits': [
                    {'hash': 'a1b2c3d4e5f', 'shortHash': 'a1b2c3d', 'message': 'Initial commit', 'parents': [], 'timestamp': 1000},
                    {'hash': 'b2c3d4e5f6a', 'shortHash': 'b2c3d4e', 'message': 'Add project structure', 'parents': ['a1b2c3d4e5f'], 'timestamp': 2000},
                ],
                'refs': {
                    'HEAD': {'type': 'branch', 'ref': 'main'},
                    'main': 'b2c3d4e5f6a',
                },
                'stagingArea': [],
                'workingDir': [
                    {'name': 'dashboard.js', 'status': 'new'},
                ],
            },
            'target_state': {
                'commits': [{'message': '__any__', 'parents': ['b2c3d4e5f6a']}],
                'refs': {
                    'HEAD': {'type': 'branch', 'ref': 'feature/dashboard'},
                    'main': 'b2c3d4e5f6a',
                    'feature/dashboard': '__any__',
                },
                'stagingArea': [],
            },
            'min_commands': 3,
            'hard_cap': 6,
        },
    ],
    'wrong-branch': [
        {
            'template_index': 1,
            'narrative': "Your team is building a login feature on feature/login. You just realized you committed your changes directly to main instead. Move the commit to feature/login and restore main.",
            'initial_state': {
                'commits': [
                    {'hash': 'a1b2c3d4e5f', 'shortHash': 'a1b2c3d', 'message': 'Initial commit', 'parents': [], 'timestamp': 1000},
                    {'hash': 'b2c3d4e5f6a', 'shortHash': 'b2c3d4e', 'message': 'Add project structure', 'parents': ['a1b2c3d4e5f'], 'timestamp': 2000},
                    {'hash': 'c3d4e5f6a7b', 'shortHash': 'c3d4e5f', 'message': 'feat: add login page', 'parents': ['b2c3d4e5f6a'], 'timestamp': 3000},
                ],
                'refs': {
                    'HEAD': {'type': 'branch', 'ref': 'main'},
                    'main': 'c3d4e5f6a7b',
                    'feature/login': 'b2c3d4e5f6a',
                },
                'stagingArea': [],
                'workingDir': [],
            },
            'target_state': {
                'refs': {
                    'HEAD': {'type': 'branch', 'ref': 'feature/login'},
                    'main': 'b2c3d4e5f6a',
                    'feature/login': '__any_with_login__',
                },
            },
            'min_commands': 4,
            'hard_cap': 6,
        },
    ],
}

PLACEHOLDER_TEMPLATE = {
    'template_index': 1,
    'narrative': 'Placeholder scenario — an admin needs to define the initial and target states for this scenario.',
    'initial_state': {'commits': [], 'refs': {'HEAD': {'type': 'branch', 'ref': 'main'}, 'main': None}, 'stagingArea': [], 'workingDir': []},
    'target_state': {'commits': [{'message': '__any__', 'parents': []}], 'refs': {'HEAD': {'type': 'branch', 'ref': 'main'}}, 'stagingArea': []},
    'min_commands': 2,
    'hard_cap': 4,
}


class Command(BaseCommand):
    help = 'Seed curriculum data (Modules, Scenarios, ScenarioTemplates)'

    def handle(self, *args, **options):
        module_map = {}

        for m in MODULES:
            obj, created = Module.objects.update_or_create(
                order=m['order'],
                defaults={'title': m['title'], 'color': m['color'], 'icon': m['icon']},
            )
            module_map[m['order']] = obj
            self.stdout.write(f"{'Created' if created else 'Updated'} module: {obj.title}")

        for s in SCENARIOS:
            module = module_map[s['module_order']]
            scenario, created = Scenario.objects.update_or_create(
                specific_objective=s['so'],
                defaults={
                    'module': module,
                    'title': s['title'],
                    'difficulty': 'easy',
                    'order': s['order'],
                },
            )
            self.stdout.write(f"  {'Created' if created else 'Updated'} scenario: {scenario.title}")

            templates = TEMPLATES.get(s['slug'], [PLACEHOLDER_TEMPLATE])
            for t in templates:
                ScenarioTemplate.objects.update_or_create(
                    scenario=scenario,
                    template_index=t['template_index'],
                    defaults={
                        'narrative': t['narrative'],
                        'initial_state': t['initial_state'],
                        'target_state': t['target_state'],
                        'min_commands': t['min_commands'],
                        'hard_cap': t['hard_cap'],
                    },
                )

        self.stdout.write(self.style.SUCCESS('Seed complete.'))
