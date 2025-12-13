"""
Views для управления архитектурными проектами.

Предоставляет CRUD операции для проектов, параметров зданий
и экспортированных моделей.
"""

from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import ArchitecturalProject, BuildingParameters, ExportedModel
from .serializers import (
    ArchitecturalProjectListSerializer,
    ArchitecturalProjectDetailSerializer,
    ArchitecturalProjectCreateSerializer,
    BuildingParametersSerializer,
    ProjectParametersUpdateSerializer,
    ExportedModelSerializer,
    ExportedModelUploadSerializer,
)


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Разрешение: только владелец может изменять объект.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user


class ArchitecturalProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet для архитектурных проектов.

    Endpoints:
    - GET /api/projects/ - список проектов
    - POST /api/projects/ - создание проекта
    - GET /api/projects/{id}/ - детали проекта
    - PUT/PATCH /api/projects/{id}/ - обновление проекта
    - DELETE /api/projects/{id}/ - удаление проекта
    - PATCH /api/projects/{id}/parameters/ - обновление параметров
    - POST /api/projects/{id}/export/ - загрузка экспорта
    - GET /api/projects/{id}/exports/ - список экспортов
    """

    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description', 'tags']
    ordering_fields = ['created_at', 'updated_at', 'name']
    ordering = ['-updated_at']

    def get_queryset(self):
        """Возвращает проекты текущего пользователя или публичные."""
        user = self.request.user
        if user.is_authenticated:
            return ArchitecturalProject.objects.filter(owner=user)
        return ArchitecturalProject.objects.filter(is_public=True)

    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия."""
        if self.action == 'list':
            return ArchitecturalProjectListSerializer
        if self.action == 'create':
            return ArchitecturalProjectCreateSerializer
        return ArchitecturalProjectDetailSerializer

    def perform_create(self, serializer):
        """Установка владельца при создании проекта."""
        serializer.save(owner=self.request.user)

    @swagger_auto_schema(
        operation_description="Обновление параметров здания",
        request_body=ProjectParametersUpdateSerializer,
        responses={200: BuildingParametersSerializer}
    )
    @action(detail=True, methods=['patch'], url_path='parameters')
    def update_parameters(self, request, pk=None):
        """
        Обновление параметров здания проекта.

        PATCH /api/projects/{id}/parameters/
        """
        project = self.get_object()
        parameters = project.parameters

        serializer = ProjectParametersUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Обновляем только переданные поля
        for field, value in serializer.validated_data.items():
            setattr(parameters, field, value)
        parameters.save()

        return Response(
            BuildingParametersSerializer(parameters).data,
            status=status.HTTP_200_OK
        )

    @swagger_auto_schema(
        operation_description="Загрузка экспортированной 3D-модели",
        request_body=ExportedModelUploadSerializer,
        responses={201: ExportedModelSerializer}
    )
    @action(
        detail=True,
        methods=['post'],
        url_path='export',
        parser_classes=[MultiPartParser, FormParser]
    )
    def upload_export(self, request, pk=None):
        """
        Загрузка экспортированной 3D-модели.

        POST /api/projects/{id}/export/

        Принимает файлы форматов OBJ, GLTF, GLB.
        """
        project = self.get_object()

        serializer = ExportedModelUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(project=project)

        return Response(
            ExportedModelSerializer(
                serializer.instance,
                context={'request': request}
            ).data,
            status=status.HTTP_201_CREATED
        )

    @swagger_auto_schema(
        operation_description="Список экспортированных моделей проекта",
        responses={200: ExportedModelSerializer(many=True)}
    )
    @action(detail=True, methods=['get'], url_path='exports')
    def list_exports(self, request, pk=None):
        """
        Список экспортированных моделей проекта.

        GET /api/projects/{id}/exports/
        """
        project = self.get_object()
        exports = project.exported_models.all()
        serializer = ExportedModelSerializer(
            exports, many=True, context={'request': request}
        )
        return Response(serializer.data)

    @swagger_auto_schema(
        operation_description="Получение параметров в формате Three.js",
        responses={200: openapi.Response(
            description="Параметры для Three.js",
            schema=openapi.Schema(type=openapi.TYPE_OBJECT)
        )}
    )
    @action(detail=True, methods=['get'], url_path='threejs-params')
    def threejs_params(self, request, pk=None):
        """
        Получение параметров проекта в формате Three.js.

        GET /api/projects/{id}/threejs-params/
        """
        project = self.get_object()
        return Response(project.parameters.to_threejs_params())


class PublicProjectsView(generics.ListAPIView):
    """
    Список публичных проектов.

    GET /api/projects/public/
    """

    serializer_class = ArchitecturalProjectListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'description', 'tags']
    ordering = ['-created_at']

    def get_queryset(self):
        return ArchitecturalProject.objects.filter(is_public=True)


class ExportedModelDetailView(generics.RetrieveDestroyAPIView):
    """
    Детали и удаление экспортированной модели.

    GET /api/projects/exports/{id}/
    DELETE /api/projects/exports/{id}/
    """

    serializer_class = ExportedModelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ExportedModel.objects.filter(
            project__owner=self.request.user
        )
