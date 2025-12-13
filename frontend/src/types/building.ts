/**
 * Типы данных для параметрического моделирования зданий
 *
 * Определяет интерфейсы для параметров здания, используемых
 * в генераторе Three.js и при обмене данными с backend.
 */

// Типы фасадов
export type FacadeType = 'modern' | 'classic' | 'minimalist' | 'industrial' | 'glass';

// Стили окон
export type WindowStyle = 'rectangular' | 'arched' | 'panoramic' | 'french';

// Типы крыши
export type RoofType = 'flat' | 'pitched' | 'hip';

/**
 * Параметры размеров здания
 */
export interface BuildingDimensions {
    width: number;          // Ширина здания (м)
    length: number;         // Длина здания (м)
    floorHeight: number;    // Высота одного этажа (м)
    floorsCount: number;    // Количество этажей
}

/**
 * Параметры фасада
 */
export interface FacadeParams {
    type: FacadeType;       // Тип фасада
    color: string;          // HEX цвет фасада
}

/**
 * Параметры окон
 */
export interface WindowParams {
    style: WindowStyle;     // Стиль окон
    width: number;          // Ширина окна (м)
    height: number;         // Высота окна (м)
    perFloor: number;       // Количество окон на этаж (на одной стене)
    frameColor: string;     // Цвет рамы
    glassColor: string;     // Цвет стекла
    glassOpacity: number;   // Прозрачность стекла (0-1)
}

/**
 * Параметры крыши
 */
export interface RoofParams {
    type: RoofType;         // Тип крыши
    color: string;          // Цвет крыши
    height: number;         // Высота крыши (для скатной)
}

/**
 * Дополнительные параметры
 */
export interface ExtrasParams {
    hasBalconies: boolean;      // Наличие балконов
    balconyDepth: number;       // Глубина балкона (м)
    hasEntrance: boolean;       // Наличие входной группы
    entranceWidth: number;      // Ширина входа (м)
}

/**
 * Полный набор параметров здания
 */
export interface BuildingParameters {
    dimensions: BuildingDimensions;
    facade: FacadeParams;
    windows: WindowParams;
    roof: RoofParams;
    extras: ExtrasParams;
}

/**
 * Параметры по умолчанию
 */
export const DEFAULT_BUILDING_PARAMS: BuildingParameters = {
    dimensions: {
        width: 20,
        length: 30,
        floorHeight: 3,
        floorsCount: 5,
    },
    facade: {
        type: 'modern',
        color: '#CCCCCC',
    },
    windows: {
        style: 'rectangular',
        width: 1.5,
        height: 1.8,
        perFloor: 6,
        frameColor: '#333333',
        glassColor: '#87CEEB',
        glassOpacity: 0.3,
    },
    roof: {
        type: 'flat',
        color: '#555555',
        height: 2,
    },
    extras: {
        hasBalconies: false,
        balconyDepth: 1.5,
        hasEntrance: true,
        entranceWidth: 4,
    },
};

/**
 * Информация о сгенерированной модели
 */
export interface ModelInfo {
    verticesCount: number;
    facesCount: number;
    totalHeight: number;
}

/**
 * Настройки экспорта
 */
export interface ExportSettings {
    format: 'obj' | 'gltf' | 'glb';
    includeTextures: boolean;
    scale: number;
}

/**
 * Проект для сохранения на сервере
 */
export interface ProjectData {
    id?: string;
    name: string;
    description?: string;
    parameters: BuildingParameters;
    isPublic?: boolean;
    tags?: string[];
}
