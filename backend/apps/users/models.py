"""
Модель пользователя для системы параметрического моделирования.

Расширенная модель пользователя с дополнительными полями
для хранения информации об архитекторе/дизайнере.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Расширенная модель пользователя.

    Attributes:
        email: Уникальный email пользователя
        organization: Организация/компания
        position: Должность
        bio: Краткая биография
        avatar: Аватар пользователя
        created_at: Дата создания аккаунта
        updated_at: Дата последнего обновления
    """

    email = models.EmailField(
        'Email адрес',
        unique=True,
        error_messages={
            'unique': 'Пользователь с таким email уже существует.',
        }
    )

    organization = models.CharField(
        'Организация',
        max_length=200,
        blank=True,
        help_text='Название компании или учебного заведения'
    )

    position = models.CharField(
        'Должность',
        max_length=100,
        blank=True,
        help_text='Например: Архитектор, Студент, Дизайнер'
    )

    bio = models.TextField(
        'О себе',
        max_length=500,
        blank=True
    )

    avatar = models.ImageField(
        'Аватар',
        upload_to='avatars/',
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        'Дата регистрации',
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        'Последнее обновление',
        auto_now=True
    )

    # Используем email для авторизации
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
        ordering = ['-created_at']

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        """Полное имя пользователя."""
        return f"{self.first_name} {self.last_name}".strip() or self.username

    @property
    def projects_count(self):
        """Количество проектов пользователя."""
        return self.projects.count()
