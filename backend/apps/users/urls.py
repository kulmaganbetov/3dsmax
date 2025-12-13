"""
URL маршруты для приложения users.

Endpoints:
- POST /api/auth/register/ - регистрация
- POST /api/auth/login/ - авторизация (получение токенов)
- POST /api/auth/token/refresh/ - обновление access токена
- GET/PUT /api/auth/profile/ - профиль пользователя
- POST /api/auth/change-password/ - смена пароля
- POST /api/auth/logout/ - выход
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

app_name = 'users'

urlpatterns = [
    # Регистрация и авторизация
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Профиль
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),

    # Выход
    path('logout/', views.LogoutView.as_view(), name='logout'),
]
