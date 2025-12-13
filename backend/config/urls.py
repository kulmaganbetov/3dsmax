"""
URL configuration for Parametric Architecture Modeling project.

Основные маршруты API:
- /api/auth/ - авторизация и регистрация
- /api/projects/ - CRUD для архитектурных проектов
- /api/docs/ - Swagger документация API
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Swagger/OpenAPI schema configuration
schema_view = get_schema_view(
    openapi.Info(
        title="Parametric Architecture API",
        default_version='v1',
        description="""
        API для веб-приложения параметрического моделирования архитектурных объектов.

        ## Возможности:
        - Регистрация и авторизация пользователей
        - Создание и управление архитектурными проектами
        - Сохранение параметров зданий
        - Хранение экспортированных 3D-моделей

        ## Форматы экспорта:
        - OBJ (Wavefront)
        - GLTF/GLB
        """,
        terms_of_service="https://www.example.com/terms/",
        contact=openapi.Contact(email="contact@example.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # API endpoints
    path('api/auth/', include('apps.users.urls')),
    path('api/projects/', include('apps.projects.urls')),

    # API Documentation
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('api/docs.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
