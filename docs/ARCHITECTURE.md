# Архитектура приложения

## Диаграмма компонентов

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                        Браузер (Client)                          │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │   │
│  │  │    UI       │  │  Three.js    │  │    BuildingGenerator    │  │   │
│  │  │  Controls   │──│   Scene      │──│  - createMainBody()     │  │   │
│  │  │             │  │   Manager    │  │  - createWindows()      │  │   │
│  │  └──────┬──────┘  └──────┬───────┘  │  - createRoof()         │  │   │
│  │         │                │          │  - createBalconies()    │  │   │
│  │         │                │          └───────────┬─────────────┘  │   │
│  │         │                │                      │                │   │
│  │         │                ▼                      ▼                │   │
│  │         │         ┌─────────────────────────────────┐            │   │
│  │         │         │      ModelExporter              │            │   │
│  │         │         │  - exportOBJ()                  │            │   │
│  │         │         │  - exportGLTF()                 │            │   │
│  │         │         │  - generateMTL()                │            │   │
│  │         │         └──────────────┬──────────────────┘            │   │
│  │         │                        │                               │   │
│  │         ▼                        ▼                               │   │
│  │  ┌─────────────────────────────────────┐                         │   │
│  │  │           ApiClient                  │                         │   │
│  │  │  - login() / register()             │                         │   │
│  │  │  - createProject() / updateProject()│                         │   │
│  │  │  - uploadExport()                   │                         │   │
│  │  └──────────────┬──────────────────────┘                         │   │
│  └─────────────────┼────────────────────────────────────────────────┘   │
│                    │                                                     │
└────────────────────┼─────────────────────────────────────────────────────┘
                     │ REST API (JSON)
                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      Django REST Framework                        │   │
│  │                                                                   │   │
│  │  ┌────────────────────┐    ┌────────────────────┐                │   │
│  │  │    Auth Views      │    │   Project Views    │                │   │
│  │  │  /api/auth/        │    │   /api/projects/   │                │   │
│  │  │  - register        │    │   - CRUD           │                │   │
│  │  │  - login           │    │   - parameters     │                │   │
│  │  │  - profile         │    │   - exports        │                │   │
│  │  └────────┬───────────┘    └─────────┬──────────┘                │   │
│  │           │                          │                            │   │
│  │           ▼                          ▼                            │   │
│  │  ┌────────────────────────────────────────────────────────────┐  │   │
│  │  │                    Serializers                              │  │   │
│  │  │  - UserSerializer                                           │  │   │
│  │  │  - ProjectSerializer                                        │  │   │
│  │  │  - BuildingParametersSerializer                             │  │   │
│  │  │  - ExportedModelSerializer                                  │  │   │
│  │  └──────────────────────────┬─────────────────────────────────┘  │   │
│  │                             │                                     │   │
│  │                             ▼                                     │   │
│  │  ┌────────────────────────────────────────────────────────────┐  │   │
│  │  │                      Models                                 │  │   │
│  │  │  - User                                                     │  │   │
│  │  │  - ArchitecturalProject                                     │  │   │
│  │  │  - BuildingParameters                                       │  │   │
│  │  │  - ExportedModel                                            │  │   │
│  │  └──────────────────────────┬─────────────────────────────────┘  │   │
│  │                             │                                     │   │
│  └─────────────────────────────┼─────────────────────────────────────┘   │
│                                │                                         │
└────────────────────────────────┼─────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           PostgreSQL                                     │
│  ┌───────────────┐  ┌────────────────────┐  ┌──────────────────────┐    │
│  │    users      │  │    projects        │  │  building_parameters │    │
│  │  - id         │  │  - id (UUID)       │  │  - project_id (FK)   │    │
│  │  - email      │──│  - owner_id (FK)   │──│  - width, length     │    │
│  │  - password   │  │  - name            │  │  - floors_count      │    │
│  │  - ...        │  │  - description     │  │  - facade_type       │    │
│  └───────────────┘  └────────┬───────────┘  │  - window_params     │    │
│                              │              │  - roof_params       │    │
│                              │              └──────────────────────┘    │
│                              ▼                                          │
│                     ┌────────────────────┐                              │
│                     │  exported_models   │                              │
│                     │  - project_id (FK) │                              │
│                     │  - format          │                              │
│                     │  - file_path       │                              │
│                     │  - file_size       │                              │
│                     └────────────────────┘                              │
└─────────────────────────────────────────────────────────────────────────┘
```

## Поток данных

### 1. Параметрическое моделирование

```
User Input (UI Sliders)
    │
    ▼
BuildingParameters (TypeScript Interface)
    │
    ▼
BuildingGenerator.generate()
    │
    ├─► createMainBody() ──► THREE.ExtrudeGeometry
    ├─► createWindows() ──► THREE.Shape + THREE.Group
    ├─► createRoof() ──► THREE.BoxGeometry / Custom
    ├─► createBalconies() ──► THREE.Group
    └─► createEntrance() ──► THREE.Group
    │
    ▼
THREE.Group (Building Model)
    │
    ▼
SceneManager.addObject()
    │
    ▼
THREE.WebGLRenderer ──► Canvas
```

### 2. Экспорт модели

```
Building Model (THREE.Group)
    │
    ▼
ModelExporter
    │
    ├─► exportOBJ()
    │       ├─► generateOBJ() ──► .obj file
    │       └─► generateMTL() ──► .mtl file
    │
    └─► exportGLTF()
            └─► GLTFExporter ──► .gltf / .glb file
    │
    ▼
Browser Download / API Upload
```

### 3. Сохранение проекта

```
BuildingParameters
    │
    ▼
ApiClient.createProject() / updateProject()
    │
    ▼
REST API POST/PATCH /api/projects/
    │
    ▼
Django Views
    │
    ▼
Serializers (validation + transformation)
    │
    ▼
Models (ORM)
    │
    ▼
PostgreSQL
```

## Структура базы данных

### ER-диаграмма

```
┌─────────────────┐       ┌──────────────────────┐
│      User       │       │  ArchitecturalProject│
├─────────────────┤       ├──────────────────────┤
│ id (PK)         │       │ id (PK, UUID)        │
│ email (unique)  │       │ owner_id (FK)────────┼──┐
│ username        │       │ name                 │  │
│ password        │       │ description          │  │
│ first_name      │       │ preview_image        │  │
│ last_name       │       │ is_public            │  │
│ organization    │       │ tags                 │  │
│ position        │       │ created_at           │  │
│ created_at      │◄──────┤ updated_at           │  │
└─────────────────┘       └──────────┬───────────┘  │
                                     │              │
                          ┌──────────┴───────────┐  │
                          │                      │  │
              ┌───────────▼────────┐  ┌──────────▼──┴────────┐
              │BuildingParameters  │  │   ExportedModel      │
              ├────────────────────┤  ├──────────────────────┤
              │ id (PK)            │  │ id (PK, UUID)        │
              │ project_id (FK)    │  │ project_id (FK)      │
              │ width              │  │ format               │
              │ length             │  │ file                 │
              │ floor_height       │  │ material_file        │
              │ floors_count       │  │ file_size            │
              │ facade_type        │  │ vertices_count       │
              │ facade_color       │  │ faces_count          │
              │ window_*           │  │ export_settings      │
              │ roof_*             │  │ created_at           │
              │ extras             │  └──────────────────────┘
              │ extra_parameters   │
              └────────────────────┘
```

## Модули генератора

### BuildingGenerator - Методы

| Метод | Описание | Three.js техника |
|-------|----------|------------------|
| `createMainBody()` | Основной корпус здания | `ExtrudeGeometry` |
| `createFloorSeparators()` | Межэтажные карнизы | `BoxGeometry` |
| `createAllWindows()` | Окна на всех фасадах | `Shape + ShapeGeometry` |
| `createWindow()` | Одно окно с рамой | `ExtrudeGeometry + Plane` |
| `createRoof()` | Крыша (switch по типу) | `Box / Extrude / Custom` |
| `createFlatRoof()` | Плоская крыша + парапет | `BoxGeometry` |
| `createPitchedRoof()` | Двускатная крыша | `ExtrudeGeometry` |
| `createHipRoof()` | Вальмовая крыша | `BufferGeometry` |
| `createBalconies()` | Балконы с ограждением | `Group + Multiple Geometry` |
| `createEntrance()` | Входная группа | `Group + Multiple Geometry` |

### Материалы

| Материал | Использование | Свойства |
|----------|---------------|----------|
| `facadeMaterial` | Стены здания | roughness: 0.7, metalness: 0.1 |
| `windowFrameMaterial` | Рамы окон | roughness: 0.3, metalness: 0.6 |
| `glassMaterial` | Стекла | transparent, roughness: 0.1 |
| `roofMaterial` | Крыша | roughness: 0.8, metalness: 0.2 |
| `floorSeparatorMaterial` | Карнизы | darkened facade color |
| `entranceMaterial` | Козырек, колонны | roughness: 0.4, metalness: 0.3 |

## Безопасность

### Аутентификация
- JWT токены (SimpleJWT)
- Access token: 1 час
- Refresh token: 7 дней
- Blacklist при logout

### Авторизация
- `IsAuthenticated` - для большинства операций
- `IsOwnerOrReadOnly` - для проектов
- `AllowAny` - регистрация, публичные проекты

### Валидация
- Сериализаторы Django REST Framework
- TypeScript типы на frontend
- Ограничения в моделях (validators)

## Производительность

### Frontend
- Debounce при изменении параметров (100ms)
- Переиспользование материалов
- Эффективная очистка сцены

### Backend
- Пагинация списков (10 элементов)
- Фильтрация и поиск на уровне БД
- Оптимизированные запросы (select_related)

### База данных
- Индексы на foreign keys
- UUID для проектов (распределенность)
- JSON поля для гибких параметров
