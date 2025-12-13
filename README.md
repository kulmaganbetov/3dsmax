# Параметрическое моделирование архитектурных объектов

Веб-приложение для параметрического моделирования сложных архитектурных объектов с использованием Three.js и Django с последующим импортом моделей в Autodesk 3ds Max.

## Архитектура проекта

```
3dsmax/
├── backend/                    # Django REST API
│   ├── config/                 # Настройки Django
│   │   ├── settings.py        # Конфигурация
│   │   ├── urls.py            # Главные маршруты
│   │   └── wsgi.py            # WSGI точка входа
│   ├── apps/
│   │   ├── users/             # Приложение пользователей
│   │   │   ├── models.py      # Модель User
│   │   │   ├── serializers.py # Сериализаторы
│   │   │   ├── views.py       # API endpoints
│   │   │   └── urls.py        # Маршруты авторизации
│   │   └── projects/          # Архитектурные проекты
│   │       ├── models.py      # Project, BuildingParameters, ExportedModel
│   │       ├── serializers.py # Сериализаторы
│   │       ├── views.py       # CRUD API
│   │       └── urls.py        # Маршруты проектов
│   ├── requirements.txt       # Python зависимости
│   └── manage.py
│
├── frontend/                   # Three.js приложение
│   ├── src/
│   │   ├── types/
│   │   │   └── building.ts    # TypeScript типы
│   │   ├── utils/
│   │   │   ├── BuildingGenerator.ts  # Генератор зданий
│   │   │   ├── ModelExporter.ts      # Экспорт OBJ/GLTF
│   │   │   ├── SceneManager.ts       # Управление сценой
│   │   │   └── ApiClient.ts          # REST API клиент
│   │   ├── styles/
│   │   │   └── main.css       # Стили интерфейса
│   │   └── main.ts            # Точка входа
│   ├── index.html             # HTML шаблон
│   ├── package.json           # Node.js зависимости
│   ├── tsconfig.json          # TypeScript конфигурация
│   └── vite.config.ts         # Vite конфигурация
│
└── docs/                       # Документация
```

## Технологический стек

### Frontend
- **TypeScript** - типизированный JavaScript
- **Three.js** - 3D графика в браузере
- **Vite** - сборщик и dev-сервер
- **Axios** - HTTP клиент

### Backend
- **Django 4.2** - веб-фреймворк
- **Django REST Framework** - REST API
- **PostgreSQL** - база данных
- **JWT** - авторизация (SimpleJWT)
- **drf-yasg** - Swagger документация

## Установка и запуск

### Требования
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### Backend

```bash
# Создание виртуального окружения
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или venv\Scripts\activate  # Windows

# Установка зависимостей
pip install -r requirements.txt

# Создание базы данных PostgreSQL
createdb parametric_arch

# Настройка переменных окружения
export DB_NAME=parametric_arch
export DB_USER=postgres
export DB_PASSWORD=your_password
export DB_HOST=localhost
export DB_PORT=5432
export DJANGO_SECRET_KEY=your-secret-key

# Миграции
python manage.py migrate

# Создание суперпользователя
python manage.py createsuperuser

# Запуск сервера
python manage.py runserver
```

### Frontend

```bash
cd frontend

# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev

# Сборка для продакшена
npm run build
```

## API Endpoints

### Авторизация (`/api/auth/`)
| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/register/` | Регистрация |
| POST | `/login/` | Получение JWT токенов |
| POST | `/token/refresh/` | Обновление access токена |
| GET/PATCH | `/profile/` | Профиль пользователя |
| POST | `/change-password/` | Смена пароля |
| POST | `/logout/` | Выход |

### Проекты (`/api/projects/`)
| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/` | Список проектов |
| POST | `/` | Создание проекта |
| GET | `/{id}/` | Детали проекта |
| PATCH | `/{id}/` | Обновление проекта |
| DELETE | `/{id}/` | Удаление проекта |
| PATCH | `/{id}/parameters/` | Обновление параметров здания |
| GET | `/{id}/threejs-params/` | Параметры для Three.js |
| POST | `/{id}/export/` | Загрузка экспорта |
| GET | `/{id}/exports/` | Список экспортов |
| GET | `/public/` | Публичные проекты |

### Swagger документация
Доступна по адресу: `http://localhost:8000/api/docs/`

## Параметрическое моделирование

### Доступные параметры здания

#### Размеры
- Ширина (5-100 м)
- Длина (5-100 м)
- Высота этажа (2.5-6 м)
- Количество этажей (1-50)

#### Фасад
- Тип: современный, классический, минималистичный, индустриальный, стеклянный
- Цвет фасада

#### Окна
- Стиль: прямоугольные, арочные, панорамные, французские
- Размеры (ширина, высота)
- Количество на этаж
- Цвет рамы и стекла
- Прозрачность стекла

#### Крыша
- Тип: плоская, скатная, вальмовая
- Цвет
- Высота (для скатной)

#### Дополнительно
- Балконы (глубина)
- Входная группа (ширина)

## Экспорт и совместимость с 3ds Max

### Поддерживаемые форматы

#### OBJ (Wavefront)
- **Совместимость**: все версии 3ds Max
- **Файлы**: `.obj` (геометрия) + `.mtl` (материалы)
- **Импорт**: File → Import → Select Files
- **Особенности**:
  - Универсальная совместимость
  - Базовые материалы
  - Нет PBR
  - Нет анимации

#### GLTF/GLB
- **Совместимость**: 3ds Max 2021+
- **Файлы**: `.gltf` (JSON) или `.glb` (бинарный)
- **Особенности**:
  - PBR материалы
  - Компактный размер
  - Современный формат

### Рекомендации по импорту в 3ds Max

1. **Единицы измерения**
   - Модели экспортируются в метрах (1 unit = 1 meter)
   - Перед импортом: Customize → Units Setup → System Unit Scale = 1 meter

2. **Импорт OBJ**
   ```
   File → Import → Import...
   Выберите .obj файл
   В настройках включите "Import materials" для загрузки .mtl
   ```

3. **Импорт GLTF (3ds Max 2021+)**
   ```
   File → Import → Import...
   Выберите .gltf или .glb файл
   Материалы конвертируются автоматически
   ```

4. **Проверка модели**
   - Проверьте масштаб объекта
   - Убедитесь в корректности нормалей
   - Проверьте материалы

## Использование Three.js генератора

### Основные классы

#### BuildingGenerator
```typescript
import { BuildingGenerator } from './utils/BuildingGenerator';

const params: BuildingParameters = {
    dimensions: { width: 20, length: 30, floorHeight: 3, floorsCount: 5 },
    facade: { type: 'modern', color: '#CCCCCC' },
    windows: { style: 'rectangular', width: 1.5, height: 1.8, ... },
    roof: { type: 'flat', color: '#555555', height: 2 },
    extras: { hasBalconies: false, hasEntrance: true, ... }
};

const generator = new BuildingGenerator(params);
const building = generator.generate(); // THREE.Group

// Обновление параметров
generator.updateParams(newParams);
```

#### ModelExporter
```typescript
import { ModelExporter } from './utils/ModelExporter';

const exporter = new ModelExporter(building);

// Экспорт в OBJ
exporter.exportOBJ('building_name');

// Экспорт в GLTF
await exporter.exportGLTF('building_name', true); // true = GLB
```

### Используемые Three.js техники

1. **THREE.Shape + ExtrudeGeometry** - создание основного корпуса
2. **BufferGeometry** - оптимизированная геометрия
3. **MeshStandardMaterial** - PBR материалы
4. **Shadow mapping** - реалистичные тени
5. **OrbitControls** - управление камерой

## Особенности реализации

### Генерация геометрии в браузере
- Вся 3D-геометрия создается на клиенте
- Backend хранит только параметры и файлы
- Мгновенный предпросмотр изменений

### Модульная архитектура
- Отдельные методы для каждого элемента здания
- Легко расширяемый генератор
- Независимые компоненты (окна, крыша, балконы)

### Оптимизация
- Отложенная регенерация (debounce)
- Переиспользование материалов
- Эффективное управление памятью

## Ограничения

1. **Форматы экспорта**
   - OBJ не поддерживает PBR материалы
   - GLTF требует 3ds Max 2021+

2. **Геометрия**
   - Максимум 50 этажей
   - Прямоугольная форма здания
   - Без криволинейных поверхностей

3. **Материалы**
   - Базовые цвета без текстур
   - Нет карт нормалей

## Развитие проекта

### Возможные улучшения
- [ ] Добавление текстур фасадов
- [ ] Криволинейные формы зданий
- [ ] Внутренняя планировка
- [ ] Ландшафт и окружение
- [ ] Анимация (двери, окна)
- [ ] VR режим просмотра
- [ ] Экспорт в FBX

## Лицензия

MIT License

## Автор

Дипломный проект студента 4 курса
