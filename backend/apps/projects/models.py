"""
Модели для хранения архитектурных проектов.

Основные модели:
- ArchitecturalProject: Основной проект с метаданными
- BuildingParameters: Параметры здания (JSON структура)
- ExportedModel: Экспортированные 3D-файлы
"""

import os
import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


def model_file_path(instance, filename):
    """Генерация пути для сохранения 3D-модели."""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('models', str(instance.project.id), filename)


def preview_image_path(instance, filename):
    """Генерация пути для превью изображения."""
    ext = filename.split('.')[-1]
    filename = f"preview_{uuid.uuid4()}.{ext}"
    return os.path.join('previews', str(instance.id), filename)


class FacadeType(models.TextChoices):
    """Типы фасадов здания."""
    MODERN = 'modern', 'Современный'
    CLASSIC = 'classic', 'Классический'
    MINIMALIST = 'minimalist', 'Минималистичный'
    INDUSTRIAL = 'industrial', 'Индустриальный'
    GLASS = 'glass', 'Стеклянный'


class WindowStyle(models.TextChoices):
    """Стили окон."""
    RECTANGULAR = 'rectangular', 'Прямоугольные'
    ARCHED = 'arched', 'Арочные'
    PANORAMIC = 'panoramic', 'Панорамные'
    FRENCH = 'french', 'Французские'


class ArchitecturalProject(models.Model):
    """
    Основная модель архитектурного проекта.

    Хранит метаданные проекта и связывает параметры здания
    с экспортированными моделями.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='projects',
        verbose_name='Владелец'
    )

    name = models.CharField(
        'Название проекта',
        max_length=200
    )

    description = models.TextField(
        'Описание',
        blank=True,
        help_text='Подробное описание архитектурного проекта'
    )

    preview_image = models.ImageField(
        'Превью',
        upload_to=preview_image_path,
        blank=True,
        null=True,
        help_text='Изображение превью проекта'
    )

    is_public = models.BooleanField(
        'Публичный',
        default=False,
        help_text='Виден ли проект другим пользователям'
    )

    tags = models.CharField(
        'Теги',
        max_length=500,
        blank=True,
        help_text='Теги через запятую'
    )

    created_at = models.DateTimeField(
        'Дата создания',
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        'Последнее изменение',
        auto_now=True
    )

    class Meta:
        verbose_name = 'Архитектурный проект'
        verbose_name_plural = 'Архитектурные проекты'
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.name} ({self.owner.username})"

    @property
    def tags_list(self):
        """Список тегов."""
        if self.tags:
            return [tag.strip() for tag in self.tags.split(',')]
        return []


class BuildingParameters(models.Model):
    """
    Параметры здания для генерации 3D-модели.

    Содержит все необходимые параметры для параметрического
    моделирования в Three.js.
    """

    project = models.OneToOneField(
        ArchitecturalProject,
        on_delete=models.CASCADE,
        related_name='parameters',
        verbose_name='Проект'
    )

    # Основные размеры
    width = models.FloatField(
        'Ширина (м)',
        validators=[MinValueValidator(5), MaxValueValidator(200)],
        default=20,
        help_text='Ширина здания в метрах'
    )

    length = models.FloatField(
        'Длина (м)',
        validators=[MinValueValidator(5), MaxValueValidator(200)],
        default=30,
        help_text='Длина здания в метрах'
    )

    floor_height = models.FloatField(
        'Высота этажа (м)',
        validators=[MinValueValidator(2.5), MaxValueValidator(6)],
        default=3,
        help_text='Высота одного этажа'
    )

    floors_count = models.IntegerField(
        'Количество этажей',
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        default=5,
        help_text='Общее количество этажей'
    )

    # Фасад
    facade_type = models.CharField(
        'Тип фасада',
        max_length=20,
        choices=FacadeType.choices,
        default=FacadeType.MODERN
    )

    facade_color = models.CharField(
        'Цвет фасада',
        max_length=7,
        default='#CCCCCC',
        help_text='HEX код цвета'
    )

    # Окна
    window_style = models.CharField(
        'Стиль окон',
        max_length=20,
        choices=WindowStyle.choices,
        default=WindowStyle.RECTANGULAR
    )

    window_width = models.FloatField(
        'Ширина окна (м)',
        validators=[MinValueValidator(0.5), MaxValueValidator(5)],
        default=1.5
    )

    window_height = models.FloatField(
        'Высота окна (м)',
        validators=[MinValueValidator(0.5), MaxValueValidator(4)],
        default=1.8
    )

    windows_per_floor = models.IntegerField(
        'Окон на этаж (фасад)',
        validators=[MinValueValidator(1), MaxValueValidator(50)],
        default=6,
        help_text='Количество окон на одной стороне этажа'
    )

    window_color = models.CharField(
        'Цвет рамы окна',
        max_length=7,
        default='#333333'
    )

    glass_color = models.CharField(
        'Цвет стекла',
        max_length=7,
        default='#87CEEB'
    )

    glass_opacity = models.FloatField(
        'Прозрачность стекла',
        validators=[MinValueValidator(0), MaxValueValidator(1)],
        default=0.3
    )

    # Крыша
    roof_type = models.CharField(
        'Тип крыши',
        max_length=20,
        choices=[
            ('flat', 'Плоская'),
            ('pitched', 'Скатная'),
            ('hip', 'Вальмовая'),
        ],
        default='flat'
    )

    roof_color = models.CharField(
        'Цвет крыши',
        max_length=7,
        default='#555555'
    )

    roof_height = models.FloatField(
        'Высота крыши (м)',
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        default=2,
        help_text='Высота крыши (для скатной)'
    )

    # Дополнительные элементы
    has_balconies = models.BooleanField(
        'Балконы',
        default=False
    )

    balcony_depth = models.FloatField(
        'Глубина балкона (м)',
        validators=[MinValueValidator(0.5), MaxValueValidator(3)],
        default=1.5
    )

    has_entrance = models.BooleanField(
        'Входная группа',
        default=True
    )

    entrance_width = models.FloatField(
        'Ширина входа (м)',
        validators=[MinValueValidator(2), MaxValueValidator(10)],
        default=4
    )

    # JSON для дополнительных параметров
    extra_parameters = models.JSONField(
        'Дополнительные параметры',
        default=dict,
        blank=True,
        help_text='Дополнительные параметры в формате JSON'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Параметры здания'
        verbose_name_plural = 'Параметры зданий'

    def __str__(self):
        return f"Параметры: {self.project.name}"

    @property
    def total_height(self):
        """Общая высота здания."""
        roof_h = self.roof_height if self.roof_type != 'flat' else 0
        return self.floors_count * self.floor_height + roof_h

    def to_threejs_params(self):
        """
        Преобразование параметров в формат для Three.js.

        Returns:
            dict: Параметры в формате, ожидаемом фронтендом
        """
        return {
            'dimensions': {
                'width': self.width,
                'length': self.length,
                'floorHeight': self.floor_height,
                'floorsCount': self.floors_count,
                'totalHeight': self.total_height,
            },
            'facade': {
                'type': self.facade_type,
                'color': self.facade_color,
            },
            'windows': {
                'style': self.window_style,
                'width': self.window_width,
                'height': self.window_height,
                'perFloor': self.windows_per_floor,
                'frameColor': self.window_color,
                'glassColor': self.glass_color,
                'glassOpacity': self.glass_opacity,
            },
            'roof': {
                'type': self.roof_type,
                'color': self.roof_color,
                'height': self.roof_height,
            },
            'extras': {
                'hasBalconies': self.has_balconies,
                'balconyDepth': self.balcony_depth,
                'hasEntrance': self.has_entrance,
                'entranceWidth': self.entrance_width,
            },
            'extra': self.extra_parameters,
        }


class ExportedModel(models.Model):
    """
    Экспортированные 3D-модели.

    Хранит файлы моделей в различных форматах (OBJ, GLTF).
    """

    FORMAT_CHOICES = [
        ('obj', 'Wavefront OBJ'),
        ('gltf', 'GLTF'),
        ('glb', 'GLB (Binary GLTF)'),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    project = models.ForeignKey(
        ArchitecturalProject,
        on_delete=models.CASCADE,
        related_name='exported_models',
        verbose_name='Проект'
    )

    format = models.CharField(
        'Формат',
        max_length=10,
        choices=FORMAT_CHOICES
    )

    file = models.FileField(
        'Файл модели',
        upload_to=model_file_path
    )

    # Дополнительный файл материалов (для OBJ)
    material_file = models.FileField(
        'Файл материалов (MTL)',
        upload_to=model_file_path,
        blank=True,
        null=True
    )

    file_size = models.BigIntegerField(
        'Размер файла (байт)',
        default=0
    )

    vertices_count = models.IntegerField(
        'Количество вершин',
        default=0
    )

    faces_count = models.IntegerField(
        'Количество граней',
        default=0
    )

    export_settings = models.JSONField(
        'Настройки экспорта',
        default=dict,
        blank=True
    )

    created_at = models.DateTimeField(
        'Дата экспорта',
        auto_now_add=True
    )

    class Meta:
        verbose_name = 'Экспортированная модель'
        verbose_name_plural = 'Экспортированные модели'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.project.name} - {self.format.upper()}"

    @property
    def file_size_mb(self):
        """Размер файла в мегабайтах."""
        return round(self.file_size / (1024 * 1024), 2)
