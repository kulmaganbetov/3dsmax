"""
Admin configuration for Project models.
"""

from django.contrib import admin
from .models import ArchitecturalProject, BuildingParameters, ExportedModel


class BuildingParametersInline(admin.StackedInline):
    """Inline для параметров здания."""
    model = BuildingParameters
    extra = 0
    fieldsets = (
        ('Размеры', {
            'fields': ('width', 'length', 'floor_height', 'floors_count')
        }),
        ('Фасад', {
            'fields': ('facade_type', 'facade_color')
        }),
        ('Окна', {
            'fields': (
                'window_style', 'window_width', 'window_height',
                'windows_per_floor', 'window_color', 'glass_color', 'glass_opacity'
            )
        }),
        ('Крыша', {
            'fields': ('roof_type', 'roof_color', 'roof_height')
        }),
        ('Дополнительно', {
            'fields': (
                'has_balconies', 'balcony_depth',
                'has_entrance', 'entrance_width',
                'extra_parameters'
            ),
            'classes': ('collapse',)
        }),
    )


class ExportedModelInline(admin.TabularInline):
    """Inline для экспортированных моделей."""
    model = ExportedModel
    extra = 0
    readonly_fields = ['format', 'file', 'file_size', 'created_at']
    can_delete = True


@admin.register(ArchitecturalProject)
class ArchitecturalProjectAdmin(admin.ModelAdmin):
    """Настройка отображения проектов в админке."""

    list_display = [
        'name', 'owner', 'is_public', 'created_at', 'updated_at'
    ]
    list_filter = ['is_public', 'created_at', 'parameters__facade_type']
    search_fields = ['name', 'description', 'owner__email', 'tags']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-updated_at']

    inlines = [BuildingParametersInline, ExportedModelInline]

    fieldsets = (
        (None, {
            'fields': ('id', 'owner', 'name', 'description')
        }),
        ('Настройки', {
            'fields': ('is_public', 'tags', 'preview_image')
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ExportedModel)
class ExportedModelAdmin(admin.ModelAdmin):
    """Настройка отображения экспортов в админке."""

    list_display = [
        'project', 'format', 'file_size_mb', 'vertices_count',
        'faces_count', 'created_at'
    ]
    list_filter = ['format', 'created_at']
    search_fields = ['project__name']
    readonly_fields = ['id', 'file_size', 'created_at']
