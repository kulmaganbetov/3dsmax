"""
URL маршруты для приложения projects.

Endpoints:
- GET/POST /api/projects/ - список и создание проектов
- GET/PUT/PATCH/DELETE /api/projects/{id}/ - детали проекта
- PATCH /api/projects/{id}/parameters/ - обновление параметров здания
- POST /api/projects/{id}/export/ - загрузка экспорта
- GET /api/projects/{id}/exports/ - список экспортов проекта
- GET /api/projects/{id}/threejs-params/ - параметры для Three.js
- GET /api/projects/public/ - публичные проекты
- GET/DELETE /api/projects/exports/{id}/ - детали экспорта
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'projects'

router = DefaultRouter()
router.register('', views.ArchitecturalProjectViewSet, basename='project')

urlpatterns = [
    # Публичные проекты (до роутера, чтобы не конфликтовал с {id})
    path('public/', views.PublicProjectsView.as_view(), name='public-projects'),

    # Детали экспорта
    path(
        'exports/<uuid:pk>/',
        views.ExportedModelDetailView.as_view(),
        name='export-detail'
    ),

    # Основные CRUD через роутер
    path('', include(router.urls)),
]
