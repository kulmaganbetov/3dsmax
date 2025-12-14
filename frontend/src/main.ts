/**
 * Главный модуль приложения
 *
 * Инициализирует 3D-сцену, связывает UI с параметрическим
 * генератором и обрабатывает пользовательские действия.
 *
 * @module main
 */

import './styles/main.css';
import * as THREE from 'three';
import { SceneManager } from './utils/SceneManager';
import { BuildingGenerator, BuildingType } from './utils/BuildingGenerator';
import { ModelExporter } from './utils/ModelExporter';
import { apiClient } from './utils/ApiClient';
import {
    BuildingParameters,
    DEFAULT_BUILDING_PARAMS,
    FacadeType,
    WindowStyle,
    RoofType,
} from './types/building';

/**
 * Главный класс приложения
 */
class App {
    private sceneManager: SceneManager;
    private buildingGenerator: BuildingGenerator;
    private params: BuildingParameters;
    private building: THREE.Group | null = null;

    // Флаг для отложенной регенерации
    private regenerateTimeout: number | null = null;
    private isRegenerating: boolean = false;

    constructor() {
        // Инициализация параметров по умолчанию
        this.params = { ...DEFAULT_BUILDING_PARAMS };

        // Инициализация сцены
        const canvas = document.getElementById('canvas') as HTMLCanvasElement;
        this.sceneManager = new SceneManager(canvas);

        // Инициализация генератора
        this.buildingGenerator = new BuildingGenerator(this.params);

        // Инициализация UI
        this.initUI();
        this.initEventListeners();

        // Генерация начальной модели
        this.generateBuilding();

        // Запуск рендеринга
        this.sceneManager.start();
    }

    /**
     * Инициализация пользовательского интерфейса
     */
    private initUI(): void {
        // Инициализация вкладок
        this.initTabs();

        // Установка начальных значений в контролы
        this.setControlValues();

        // Обновление отображения значений
        this.updateValueDisplays();
    }

    /**
     * Инициализация вкладок
     */
    private initTabs(): void {
        const tabs = document.querySelectorAll('.tab');
        const contents = document.querySelectorAll('.tab-content');

        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');

                // Удаляем активный класс со всех вкладок
                tabs.forEach((t) => t.classList.remove('active'));
                contents.forEach((c) => c.classList.remove('active'));

                // Активируем выбранную вкладку
                tab.classList.add('active');
                document.getElementById(`tab-${tabId}`)?.classList.add('active');
            });
        });
    }

    /**
     * Установка значений в контролы
     */
    private setControlValues(): void {
        const { dimensions, facade, windows, roof, extras } = this.params;

        // Размеры
        this.setInputValue('width', dimensions.width);
        this.setInputValue('length', dimensions.length);
        this.setInputValue('floorHeight', dimensions.floorHeight);
        this.setInputValue('floorsCount', dimensions.floorsCount);

        // Фасад
        this.setSelectValue('facadeType', facade.type);
        this.setColorValue('facadeColor', facade.color);

        // Окна
        this.setSelectValue('windowStyle', windows.style);
        this.setInputValue('windowWidth', windows.width);
        this.setInputValue('windowHeight', windows.height);
        this.setInputValue('windowsPerFloor', windows.perFloor);
        this.setColorValue('windowColor', windows.frameColor);
        this.setColorValue('glassColor', windows.glassColor);
        this.setInputValue('glassOpacity', windows.glassOpacity);

        // Крыша
        this.setSelectValue('roofType', roof.type);
        this.setColorValue('roofColor', roof.color);
        this.setInputValue('roofHeight', roof.height);

        // Дополнительно
        this.setCheckboxValue('hasBalconies', extras.hasBalconies);
        this.setInputValue('balconyDepth', extras.balconyDepth);
        this.setCheckboxValue('hasEntrance', extras.hasEntrance);
        this.setInputValue('entranceWidth', extras.entranceWidth);

        // Видимость групп в зависимости от чекбоксов
        this.toggleBalconyControls(extras.hasBalconies);
        this.toggleEntranceControls(extras.hasEntrance);
        this.toggleRoofHeightControl(roof.type);
    }

    /**
     * Инициализация обработчиков событий
     */
    private initEventListeners(): void {
        // Тип здания
        const buildingTypeSelect = document.getElementById('buildingType') as HTMLSelectElement;
        if (buildingTypeSelect) {
            buildingTypeSelect.addEventListener('change', () => {
                this.buildingGenerator.setBuildingType(buildingTypeSelect.value as BuildingType);
                this.scheduleRegenerate();
            });
        }

        // Размеры
        this.bindRangeInput('width', (v) => {
            this.params.dimensions.width = v;
        });
        this.bindRangeInput('length', (v) => {
            this.params.dimensions.length = v;
        });
        this.bindRangeInput('floorHeight', (v) => {
            this.params.dimensions.floorHeight = v;
        });
        this.bindRangeInput('floorsCount', (v) => {
            this.params.dimensions.floorsCount = v;
        });

        // Фасад
        this.bindSelectInput('facadeType', (v) => {
            this.params.facade.type = v as FacadeType;
        });
        this.bindColorInput('facadeColor', (v) => {
            this.params.facade.color = v;
        });

        // Окна
        this.bindSelectInput('windowStyle', (v) => {
            this.params.windows.style = v as WindowStyle;
        });
        this.bindRangeInput('windowWidth', (v) => {
            this.params.windows.width = v;
        });
        this.bindRangeInput('windowHeight', (v) => {
            this.params.windows.height = v;
        });
        this.bindRangeInput('windowsPerFloor', (v) => {
            this.params.windows.perFloor = v;
        });
        this.bindColorInput('windowColor', (v) => {
            this.params.windows.frameColor = v;
        });
        this.bindColorInput('glassColor', (v) => {
            this.params.windows.glassColor = v;
        });
        this.bindRangeInput('glassOpacity', (v) => {
            this.params.windows.glassOpacity = v;
        });

        // Крыша
        this.bindSelectInput('roofType', (v) => {
            this.params.roof.type = v as RoofType;
            this.toggleRoofHeightControl(v as RoofType);
        });
        this.bindColorInput('roofColor', (v) => {
            this.params.roof.color = v;
        });
        this.bindRangeInput('roofHeight', (v) => {
            this.params.roof.height = v;
        });

        // Дополнительно
        this.bindCheckboxInput('hasBalconies', (v) => {
            this.params.extras.hasBalconies = v;
            this.toggleBalconyControls(v);
        });
        this.bindRangeInput('balconyDepth', (v) => {
            this.params.extras.balconyDepth = v;
        });
        this.bindCheckboxInput('hasEntrance', (v) => {
            this.params.extras.hasEntrance = v;
            this.toggleEntranceControls(v);
        });
        this.bindRangeInput('entranceWidth', (v) => {
            this.params.extras.entranceWidth = v;
        });

        // Кнопки экспорта
        document.getElementById('exportOBJ')?.addEventListener('click', () => {
            this.exportModel('obj');
        });

        document.getElementById('exportGLTF')?.addEventListener('click', () => {
            this.exportModel('gltf');
        });

        // Кнопка сохранения проекта
        document.getElementById('saveProject')?.addEventListener('click', () => {
            this.saveProject();
        });

        // Управление камерой
        document.getElementById('resetCamera')?.addEventListener('click', () => {
            this.sceneManager.resetCamera();
        });

        document.getElementById('topView')?.addEventListener('click', () => {
            this.sceneManager.setTopView();
        });

        document.getElementById('frontView')?.addEventListener('click', () => {
            this.sceneManager.setFrontView();
        });
    }

    /**
     * Привязка range input к параметру
     */
    private bindRangeInput(id: string, setter: (value: number) => void): void {
        const input = document.getElementById(id) as HTMLInputElement;
        const display = document.getElementById(`${id}-value`);

        if (!input) return;

        input.addEventListener('input', () => {
            const value = parseFloat(input.value);
            setter(value);

            if (display) {
                display.textContent = value.toString();
            }

            this.scheduleRegenerate();
        });
    }

    /**
     * Привязка select input к параметру
     */
    private bindSelectInput(id: string, setter: (value: string) => void): void {
        const select = document.getElementById(id) as HTMLSelectElement;

        if (!select) return;

        select.addEventListener('change', () => {
            setter(select.value);
            this.scheduleRegenerate();
        });
    }

    /**
     * Привязка color input к параметру
     */
    private bindColorInput(id: string, setter: (value: string) => void): void {
        const input = document.getElementById(id) as HTMLInputElement;

        if (!input) return;

        input.addEventListener('input', () => {
            setter(input.value);
            this.scheduleRegenerate();
        });
    }

    /**
     * Привязка checkbox input к параметру
     */
    private bindCheckboxInput(id: string, setter: (value: boolean) => void): void {
        const input = document.getElementById(id) as HTMLInputElement;

        if (!input) return;

        input.addEventListener('change', () => {
            setter(input.checked);
            this.scheduleRegenerate();
        });
    }

    /**
     * Отложенная регенерация модели
     */
    private scheduleRegenerate(): void {
        if (this.regenerateTimeout) {
            clearTimeout(this.regenerateTimeout);
        }

        this.regenerateTimeout = window.setTimeout(() => {
            this.generateBuilding();
        }, 100);
    }

    /**
     * Генерация здания
     */
    private generateBuilding(): void {
        if (this.isRegenerating) return;
        this.isRegenerating = true;

        // Показываем индикатор загрузки
        const loading = document.getElementById('loading');
        loading?.classList.add('visible');

        // Очищаем сцену
        if (this.building) {
            this.sceneManager.removeObject(this.building);
        }

        // Генерируем новое здание
        setTimeout(() => {
            this.building = this.buildingGenerator.updateParams(this.params);
            this.sceneManager.addObject(this.building);

            // Обновляем информацию о модели
            this.updateModelInfo();

            // Скрываем индикатор загрузки
            loading?.classList.remove('visible');
            this.isRegenerating = false;
        }, 10);
    }

    /**
     * Обновление информации о модели
     */
    private updateModelInfo(): void {
        const info = this.buildingGenerator.getModelInfo();

        const totalHeightEl = document.getElementById('totalHeight');
        const verticesEl = document.getElementById('verticesCount');
        const facesEl = document.getElementById('facesCount');

        if (totalHeightEl) {
            totalHeightEl.textContent = `${info.totalHeight.toFixed(1)} м`;
        }
        if (verticesEl) {
            verticesEl.textContent = info.verticesCount.toLocaleString();
        }
        if (facesEl) {
            facesEl.textContent = info.facesCount.toLocaleString();
        }
    }

    /**
     * Экспорт модели
     */
    private async exportModel(format: 'obj' | 'gltf'): Promise<void> {
        if (!this.building) return;

        const exporter = new ModelExporter(this.building);
        const projectName = (document.getElementById('projectName') as HTMLInputElement)?.value || 'building';

        if (format === 'obj') {
            exporter.exportOBJ(projectName);
        } else {
            await exporter.exportGLTF(projectName, true);
        }
    }

    /**
     * Сохранение проекта на сервер
     */
    private async saveProject(): Promise<void> {
        const nameInput = document.getElementById('projectName') as HTMLInputElement;
        const name = nameInput?.value?.trim();

        if (!name) {
            alert('Введите название проекта');
            return;
        }

        if (!apiClient.isAuthenticated()) {
            alert('Для сохранения проекта необходимо авторизоваться');
            return;
        }

        try {
            const project = await apiClient.createProject({
                name,
                description: `Параметрическая модель здания: ${this.params.dimensions.floorsCount} этажей`,
                parameters: this.params,
            });

            alert(`Проект "${project.name}" успешно сохранен!`);
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('Ошибка при сохранении проекта');
        }
    }

    /**
     * Вспомогательные методы для работы с контролами
     */
    private setInputValue(id: string, value: number): void {
        const input = document.getElementById(id) as HTMLInputElement;
        if (input) input.value = value.toString();
    }

    private setSelectValue(id: string, value: string): void {
        const select = document.getElementById(id) as HTMLSelectElement;
        if (select) select.value = value;
    }

    private setColorValue(id: string, value: string): void {
        const input = document.getElementById(id) as HTMLInputElement;
        if (input) input.value = value;
    }

    private setCheckboxValue(id: string, value: boolean): void {
        const input = document.getElementById(id) as HTMLInputElement;
        if (input) input.checked = value;
    }

    private updateValueDisplays(): void {
        const displays = document.querySelectorAll('.value-display');
        displays.forEach((display) => {
            const id = display.id.replace('-value', '');
            const input = document.getElementById(id) as HTMLInputElement;
            if (input && display) {
                display.textContent = input.value;
            }
        });
    }

    private toggleBalconyControls(visible: boolean): void {
        const group = document.getElementById('balconyDepthGroup');
        if (group) group.style.display = visible ? 'block' : 'none';
    }

    private toggleEntranceControls(visible: boolean): void {
        const group = document.getElementById('entranceWidthGroup');
        if (group) group.style.display = visible ? 'block' : 'none';
    }

    private toggleRoofHeightControl(type: RoofType): void {
        const group = document.getElementById('roofHeightGroup');
        if (group) group.style.display = type === 'flat' ? 'none' : 'block';
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
