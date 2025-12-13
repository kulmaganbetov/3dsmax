"""
Сериализаторы для архитектурных проектов.

Обеспечивают преобразование моделей Project, BuildingParameters
и ExportedModel в JSON и обратно.
"""

from rest_framework import serializers
from .models import ArchitecturalProject, BuildingParameters, ExportedModel


class BuildingParametersSerializer(serializers.ModelSerializer):
    """
    Сериализатор параметров здания.

    Включает вычисляемые поля и метод преобразования
    в формат Three.js.
    """

    total_height = serializers.ReadOnlyField()
    threejs_params = serializers.SerializerMethodField()

    class Meta:
        model = BuildingParameters
        fields = [
            'id', 'width', 'length', 'floor_height', 'floors_count',
            'facade_type', 'facade_color',
            'window_style', 'window_width', 'window_height',
            'windows_per_floor', 'window_color', 'glass_color', 'glass_opacity',
            'roof_type', 'roof_color', 'roof_height',
            'has_balconies', 'balcony_depth',
            'has_entrance', 'entrance_width',
            'extra_parameters', 'total_height', 'threejs_params',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_threejs_params(self, obj):
        """Получение параметров в формате Three.js."""
        return obj.to_threejs_params()


class ExportedModelSerializer(serializers.ModelSerializer):
    """Сериализатор экспортированных моделей."""

    file_size_mb = serializers.ReadOnlyField()
    file_url = serializers.SerializerMethodField()
    material_file_url = serializers.SerializerMethodField()

    class Meta:
        model = ExportedModel
        fields = [
            'id', 'format', 'file', 'file_url', 'material_file',
            'material_file_url', 'file_size', 'file_size_mb',
            'vertices_count', 'faces_count', 'export_settings',
            'created_at'
        ]
        read_only_fields = ['id', 'file_size', 'created_at']

    def get_file_url(self, obj):
        """Получение полного URL файла."""
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

    def get_material_file_url(self, obj):
        """Получение полного URL файла материалов."""
        request = self.context.get('request')
        if obj.material_file and request:
            return request.build_absolute_uri(obj.material_file.url)
        return None


class ArchitecturalProjectListSerializer(serializers.ModelSerializer):
    """
    Сериализатор для списка проектов.

    Легковесная версия без вложенных параметров.
    """

    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    tags_list = serializers.ReadOnlyField()
    exports_count = serializers.SerializerMethodField()

    class Meta:
        model = ArchitecturalProject
        fields = [
            'id', 'name', 'description', 'preview_image',
            'owner_name', 'is_public', 'tags', 'tags_list',
            'exports_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_exports_count(self, obj):
        """Количество экспортированных моделей."""
        return obj.exported_models.count()


class ArchitecturalProjectDetailSerializer(serializers.ModelSerializer):
    """
    Детальный сериализатор проекта.

    Включает полные параметры здания и список экспортов.
    """

    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    parameters = BuildingParametersSerializer(read_only=True)
    exported_models = ExportedModelSerializer(many=True, read_only=True)
    tags_list = serializers.ReadOnlyField()

    class Meta:
        model = ArchitecturalProject
        fields = [
            'id', 'name', 'description', 'preview_image',
            'owner', 'owner_name', 'is_public', 'tags', 'tags_list',
            'parameters', 'exported_models',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']


class ArchitecturalProjectCreateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для создания проекта.

    Позволяет создать проект вместе с параметрами здания.
    """

    parameters = BuildingParametersSerializer(required=False)

    class Meta:
        model = ArchitecturalProject
        fields = [
            'name', 'description', 'is_public', 'tags', 'parameters'
        ]

    def create(self, validated_data):
        """Создание проекта с параметрами."""
        parameters_data = validated_data.pop('parameters', None)
        project = ArchitecturalProject.objects.create(**validated_data)

        # Создаем параметры по умолчанию если не переданы
        if parameters_data:
            BuildingParameters.objects.create(project=project, **parameters_data)
        else:
            BuildingParameters.objects.create(project=project)

        return project


class ProjectParametersUpdateSerializer(serializers.Serializer):
    """
    Сериализатор для обновления параметров здания.

    Используется для частичного обновления параметров.
    """

    # Основные размеры
    width = serializers.FloatField(required=False, min_value=5, max_value=200)
    length = serializers.FloatField(required=False, min_value=5, max_value=200)
    floor_height = serializers.FloatField(required=False, min_value=2.5, max_value=6)
    floors_count = serializers.IntegerField(required=False, min_value=1, max_value=100)

    # Фасад
    facade_type = serializers.ChoiceField(
        choices=['modern', 'classic', 'minimalist', 'industrial', 'glass'],
        required=False
    )
    facade_color = serializers.CharField(required=False, max_length=7)

    # Окна
    window_style = serializers.ChoiceField(
        choices=['rectangular', 'arched', 'panoramic', 'french'],
        required=False
    )
    window_width = serializers.FloatField(required=False, min_value=0.5, max_value=5)
    window_height = serializers.FloatField(required=False, min_value=0.5, max_value=4)
    windows_per_floor = serializers.IntegerField(required=False, min_value=1, max_value=50)
    window_color = serializers.CharField(required=False, max_length=7)
    glass_color = serializers.CharField(required=False, max_length=7)
    glass_opacity = serializers.FloatField(required=False, min_value=0, max_value=1)

    # Крыша
    roof_type = serializers.ChoiceField(
        choices=['flat', 'pitched', 'hip'],
        required=False
    )
    roof_color = serializers.CharField(required=False, max_length=7)
    roof_height = serializers.FloatField(required=False, min_value=0, max_value=10)

    # Дополнительно
    has_balconies = serializers.BooleanField(required=False)
    balcony_depth = serializers.FloatField(required=False, min_value=0.5, max_value=3)
    has_entrance = serializers.BooleanField(required=False)
    entrance_width = serializers.FloatField(required=False, min_value=2, max_value=10)
    extra_parameters = serializers.JSONField(required=False)


class ExportedModelUploadSerializer(serializers.ModelSerializer):
    """Сериализатор для загрузки экспортированной модели."""

    class Meta:
        model = ExportedModel
        fields = [
            'format', 'file', 'material_file', 'vertices_count',
            'faces_count', 'export_settings'
        ]

    def create(self, validated_data):
        """Создание записи с автоматическим расчетом размера файла."""
        file = validated_data.get('file')
        if file:
            validated_data['file_size'] = file.size
        return super().create(validated_data)
