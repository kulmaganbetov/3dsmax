/**
 * Генератор параметрических архитектурных моделей
 *
 * Поддерживает 4 типа зданий:
 * - residential: Жилой многоэтажный дом
 * - skyscraper: Офисная башня
 * - mansion: Классический особняк
 * - cottage: Современный коттедж
 */

import * as THREE from 'three';
import {
    BuildingParameters,
    ModelInfo,
} from '../types/building';

export type BuildingType = 'residential' | 'skyscraper' | 'mansion' | 'cottage';

export class BuildingGenerator {
    private params: BuildingParameters;
    private buildingGroup: THREE.Group;
    private buildingType: BuildingType = 'residential';

    // Материалы
    private facadeMaterial!: THREE.MeshStandardMaterial;
    private facadeSecondaryMaterial!: THREE.MeshStandardMaterial;
    private windowFrameMaterial!: THREE.MeshStandardMaterial;
    private glassMaterial!: THREE.MeshStandardMaterial;
    private roofMaterial!: THREE.MeshStandardMaterial;
    private accentMaterial!: THREE.MeshStandardMaterial;
    private groundMaterial!: THREE.MeshStandardMaterial;

    constructor(params: BuildingParameters) {
        this.params = params;
        this.buildingGroup = new THREE.Group();
        this.initMaterials();
    }

    /**
     * Установка типа здания
     */
    public setBuildingType(type: BuildingType): void {
        this.buildingType = type;
    }

    /**
     * Инициализация материалов
     */
    private initMaterials(): void {
        this.facadeMaterial = new THREE.MeshStandardMaterial({
            color: this.params.facade.color,
            roughness: 0.8,
            metalness: 0.1,
            side: THREE.DoubleSide,
        });

        this.facadeSecondaryMaterial = new THREE.MeshStandardMaterial({
            color: this.darkenColor(this.params.facade.color, 0.15),
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.DoubleSide,
        });

        this.windowFrameMaterial = new THREE.MeshStandardMaterial({
            color: this.params.windows.frameColor,
            roughness: 0.4,
            metalness: 0.5,
        });

        this.glassMaterial = new THREE.MeshStandardMaterial({
            color: this.params.windows.glassColor,
            transparent: true,
            opacity: 0.4,
            roughness: 0.1,
            metalness: 0.8,
            side: THREE.DoubleSide,
        });

        this.roofMaterial = new THREE.MeshStandardMaterial({
            color: this.params.roof.color,
            roughness: 0.9,
            metalness: 0.1,
            side: THREE.DoubleSide,
        });

        this.accentMaterial = new THREE.MeshStandardMaterial({
            color: '#E8DCC4',
            roughness: 0.6,
            metalness: 0.2,
        });

        this.groundMaterial = new THREE.MeshStandardMaterial({
            color: '#555555',
            roughness: 0.9,
            metalness: 0.0,
        });
    }

    private darkenColor(hex: string, percent: number): string {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * (1 - percent)));
        const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * (1 - percent)));
        const b = Math.max(0, Math.floor((num & 0xff) * (1 - percent)));
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    private lightenColor(hex: string, percent: number): string {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, Math.floor(((num >> 16) & 0xff) * (1 + percent)));
        const g = Math.min(255, Math.floor(((num >> 8) & 0xff) * (1 + percent)));
        const b = Math.min(255, Math.floor((num & 0xff) * (1 + percent)));
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    /**
     * Генерация модели
     */
    public generate(): THREE.Group {
        // Очищаем группу
        while (this.buildingGroup.children.length > 0) {
            const child = this.buildingGroup.children[0];
            this.buildingGroup.remove(child);
        }

        this.initMaterials();

        switch (this.buildingType) {
            case 'skyscraper':
                this.generateSkyscraper();
                break;
            case 'mansion':
                this.generateMansion();
                break;
            case 'cottage':
                this.generateCottage();
                break;
            default:
                this.generateResidential();
        }

        return this.buildingGroup;
    }

    /**
     * Жилой многоэтажный дом
     */
    private generateResidential(): void {
        const { width, length, floorHeight, floorsCount } = this.params.dimensions;
        const totalHeight = floorHeight * floorsCount;

        // Основной корпус - 4 стены
        this.createWallBox(0, 0, 0, width, totalHeight, length);

        // Цоколь
        const baseHeight = 0.8;
        this.createBox(
            width / 2, baseHeight / 2, length / 2,
            width + 0.4, baseHeight, length + 0.4,
            this.facadeSecondaryMaterial
        );

        // Межэтажные линии
        for (let floor = 1; floor <= floorsCount; floor++) {
            const y = floor * floorHeight;
            this.createBox(
                width / 2, y, length / 2,
                width + 0.2, 0.15, length + 0.2,
                this.facadeSecondaryMaterial
            );
        }

        // Окна на всех фасадах
        this.createWindowsOnAllSides(width, length, floorHeight, floorsCount);

        // Балконы
        if (this.params.extras.hasBalconies) {
            this.createResidentialBalconies(width, length, floorHeight, floorsCount);
        }

        // Входная группа
        if (this.params.extras.hasEntrance) {
            this.createModernEntrance(width, length, floorHeight);
        }

        // Крыша
        this.createRoof(width, length, totalHeight);
    }

    /**
     * Офисная башня / Небоскреб
     */
    private generateSkyscraper(): void {
        const { width, length, floorHeight, floorsCount } = this.params.dimensions;
        const totalHeight = floorHeight * floorsCount;

        // Стеклянный фасад - светлый голубой цвет для видимости
        this.glassMaterial = new THREE.MeshStandardMaterial({
            color: '#87CEEB',
            transparent: true,
            opacity: 0.6,
            roughness: 0.1,
            metalness: 0.3,
            side: THREE.DoubleSide,
            envMapIntensity: 0.5,
        });

        // Основной стеклянный корпус
        this.createWallBox(0, 0, 0, width, totalHeight, length, this.glassMaterial);

        // Металлический каркас - светлый для контраста
        const frameColor = new THREE.MeshStandardMaterial({
            color: '#4A5568',
            roughness: 0.4,
            metalness: 0.6,
        });

        // Вертикальные ребра
        const ribWidth = 0.3;
        const ribCount = Math.floor(width / 4);
        for (let i = 0; i <= ribCount; i++) {
            const x = (width / ribCount) * i;
            // Передняя сторона
            this.createBox(x, totalHeight / 2, -0.1, ribWidth, totalHeight, 0.2, frameColor);
            // Задняя сторона
            this.createBox(x, totalHeight / 2, length + 0.1, ribWidth, totalHeight, 0.2, frameColor);
        }

        // Боковые ребра
        const sideRibCount = Math.floor(length / 4);
        for (let i = 0; i <= sideRibCount; i++) {
            const z = (length / sideRibCount) * i;
            this.createBox(-0.1, totalHeight / 2, z, 0.2, totalHeight, ribWidth, frameColor);
            this.createBox(width + 0.1, totalHeight / 2, z, 0.2, totalHeight, ribWidth, frameColor);
        }

        // Горизонтальные линии этажей
        for (let floor = 0; floor <= floorsCount; floor++) {
            const y = floor * floorHeight;
            // Передняя и задняя
            this.createBox(width / 2, y, -0.1, width + 0.4, 0.15, 0.2, frameColor);
            this.createBox(width / 2, y, length + 0.1, width + 0.4, 0.15, 0.2, frameColor);
            // Боковые
            this.createBox(-0.1, y, length / 2, 0.2, 0.15, length + 0.4, frameColor);
            this.createBox(width + 0.1, y, length / 2, 0.2, 0.15, length + 0.4, frameColor);
        }

        // Вершина башни
        this.createSkyscraperTop(width, length, totalHeight);

        // Основание / лобби
        this.createSkyscraperLobby(width, length);
    }

    /**
     * Классический особняк
     */
    private generateMansion(): void {
        const { width, length, floorHeight, floorsCount } = this.params.dimensions;
        const totalHeight = floorHeight * Math.min(floorsCount, 3); // Макс 3 этажа

        // Материалы для особняка
        this.facadeMaterial = new THREE.MeshStandardMaterial({
            color: '#F5F0E6',
            roughness: 0.9,
            metalness: 0.0,
            side: THREE.DoubleSide,
        });

        // Основной корпус
        this.createWallBox(0, 0, 0, width, totalHeight, length);

        // Колонны на фасаде
        const columnRadius = 0.4;
        const columnCount = 4;
        const columnSpacing = width / (columnCount + 1);

        for (let i = 1; i <= columnCount; i++) {
            const x = columnSpacing * i;
            this.createColumn(x, 0, -0.3, columnRadius, totalHeight);
        }

        // Фронтон (треугольник над входом)
        this.createPediment(width / 2, totalHeight, 0, width * 0.6, 2);

        // Карнизы
        this.createCornice(width, length, totalHeight);
        this.createCornice(width, length, floorHeight);
        if (floorsCount >= 2) {
            this.createCornice(width, length, floorHeight * 2);
        }

        // Классические окна с наличниками
        this.createMansionWindows(width, length, floorHeight, Math.min(floorsCount, 3));

        // Парадный вход
        this.createGrandEntrance(width, length, floorHeight);

        // Балюстрада на крыше
        this.createBalustrade(width, length, totalHeight);

        // Крыша с мансардой
        this.createMansionRoof(width, length, totalHeight);
    }

    /**
     * Современный коттедж
     */
    private generateCottage(): void {
        const { width, length, floorHeight, floorsCount } = this.params.dimensions;
        const floors = Math.min(floorsCount, 2); // Макс 2 этажа
        const totalHeight = floorHeight * floors;

        // Материалы для коттеджа
        const woodMaterial = new THREE.MeshStandardMaterial({
            color: '#8B4513',
            roughness: 0.8,
            metalness: 0.1,
        });

        const whiteMaterial = new THREE.MeshStandardMaterial({
            color: '#FAFAFA',
            roughness: 0.7,
            metalness: 0.0,
            side: THREE.DoubleSide,
        });

        // Основной объем (L-образная форма)
        const mainWidth = width * 0.7;
        const wingWidth = width * 0.5;
        const wingLength = length * 0.6;

        // Главный блок
        this.createWallBox(0, 0, 0, mainWidth, totalHeight, length, whiteMaterial);

        // Боковое крыло
        this.createWallBox(mainWidth - 0.1, 0, length - wingLength, wingWidth, totalHeight * 0.8, wingLength, whiteMaterial);

        // Деревянные акценты
        // Горизонтальные балки
        this.createBox(mainWidth / 2, totalHeight - 0.3, -0.15, mainWidth + 0.5, 0.2, 0.3, woodMaterial);
        this.createBox(mainWidth / 2, totalHeight - 0.3, length + 0.15, mainWidth + 0.5, 0.2, 0.3, woodMaterial);

        // Панорамные окна
        this.createPanoramicWindows(mainWidth, length, floorHeight, floors);

        // Терраса
        this.createTerrace(mainWidth, length, woodMaterial);

        // Гараж
        this.createGarage(mainWidth + wingWidth, length - wingLength, floorHeight * 0.8);

        // Современная крыша
        this.createCottageRoof(mainWidth, wingWidth, length, wingLength, totalHeight);

        // Ландшафт
        this.createLandscape(width * 1.5, length * 1.5);
    }

    // ============ ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ============

    /**
     * Создание коробки стен (4 стены)
     */
    private createWallBox(
        x: number, y: number, z: number,
        width: number, height: number, depth: number,
        material?: THREE.Material
    ): void {
        const mat = material || this.facadeMaterial;
        const wallThickness = 0.3;

        // Передняя стена
        this.createBox(x + width / 2, y + height / 2, z, width, height, wallThickness, mat);
        // Задняя стена
        this.createBox(x + width / 2, y + height / 2, z + depth, width, height, wallThickness, mat);
        // Левая стена
        this.createBox(x, y + height / 2, z + depth / 2, wallThickness, height, depth, mat);
        // Правая стена
        this.createBox(x + width, y + height / 2, z + depth / 2, wallThickness, height, depth, mat);
    }

    /**
     * Создание простого бокса
     */
    private createBox(
        x: number, y: number, z: number,
        width: number, height: number, depth: number,
        material: THREE.Material
    ): THREE.Mesh {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.buildingGroup.add(mesh);
        return mesh;
    }

    /**
     * Создание колонны
     */
    private createColumn(x: number, y: number, z: number, radius: number, height: number): void {
        const columnMaterial = new THREE.MeshStandardMaterial({
            color: '#E8E4DC',
            roughness: 0.7,
            metalness: 0.1,
        });

        // Основание
        const baseGeom = new THREE.CylinderGeometry(radius * 1.3, radius * 1.4, 0.4, 16);
        const base = new THREE.Mesh(baseGeom, columnMaterial);
        base.position.set(x, y + 0.2, z);
        base.castShadow = true;
        this.buildingGroup.add(base);

        // Ствол колонны
        const shaftGeom = new THREE.CylinderGeometry(radius, radius * 1.1, height - 1, 16);
        const shaft = new THREE.Mesh(shaftGeom, columnMaterial);
        shaft.position.set(x, y + height / 2, z);
        shaft.castShadow = true;
        this.buildingGroup.add(shaft);

        // Капитель
        const capitalGeom = new THREE.CylinderGeometry(radius * 1.5, radius, 0.6, 16);
        const capital = new THREE.Mesh(capitalGeom, columnMaterial);
        capital.position.set(x, y + height - 0.3, z);
        capital.castShadow = true;
        this.buildingGroup.add(capital);
    }

    /**
     * Окна на всех сторонах здания
     */
    private createWindowsOnAllSides(
        width: number, length: number,
        floorHeight: number, floorsCount: number
    ): void {
        const { perFloor, width: winW, height: winH } = this.params.windows;
        const windowSpacing = width / (perFloor + 1);
        const sideWindows = Math.max(1, Math.floor(perFloor * (length / width)));
        const sideSpacing = length / (sideWindows + 1);

        for (let floor = 0; floor < floorsCount; floor++) {
            const y = floor * floorHeight + floorHeight * 0.5;

            // Передний фасад
            for (let i = 1; i <= perFloor; i++) {
                this.createWindow(windowSpacing * i, y, -0.16, winW, winH, 0);
            }

            // Задний фасад
            for (let i = 1; i <= perFloor; i++) {
                this.createWindow(windowSpacing * i, y, length + 0.16, winW, winH, Math.PI);
            }

            // Левый фасад
            for (let i = 1; i <= sideWindows; i++) {
                this.createWindow(-0.16, y, sideSpacing * i, winW, winH, -Math.PI / 2);
            }

            // Правый фасад
            for (let i = 1; i <= sideWindows; i++) {
                this.createWindow(width + 0.16, y, sideSpacing * i, winW, winH, Math.PI / 2);
            }
        }
    }

    /**
     * Создание окна
     */
    private createWindow(
        x: number, y: number, z: number,
        width: number, height: number, rotY: number
    ): THREE.Group {
        const windowGroup = new THREE.Group();
        const frameThickness = 0.08;
        const frameDepth = 0.15;

        // Рама окна
        // Верх
        const topFrame = new THREE.Mesh(
            new THREE.BoxGeometry(width + frameThickness * 2, frameThickness, frameDepth),
            this.windowFrameMaterial
        );
        topFrame.position.y = height / 2;
        windowGroup.add(topFrame);

        // Низ
        const bottomFrame = new THREE.Mesh(
            new THREE.BoxGeometry(width + frameThickness * 2, frameThickness, frameDepth),
            this.windowFrameMaterial
        );
        bottomFrame.position.y = -height / 2;
        windowGroup.add(bottomFrame);

        // Левая
        const leftFrame = new THREE.Mesh(
            new THREE.BoxGeometry(frameThickness, height, frameDepth),
            this.windowFrameMaterial
        );
        leftFrame.position.x = -width / 2;
        windowGroup.add(leftFrame);

        // Правая
        const rightFrame = new THREE.Mesh(
            new THREE.BoxGeometry(frameThickness, height, frameDepth),
            this.windowFrameMaterial
        );
        rightFrame.position.x = width / 2;
        windowGroup.add(rightFrame);

        // Стекло
        const glass = new THREE.Mesh(
            new THREE.PlaneGeometry(width - 0.05, height - 0.05),
            this.glassMaterial
        );
        glass.position.z = 0.01;
        windowGroup.add(glass);

        // Горизонтальная перекладина
        if (this.params.facade.type === 'classic' || this.params.windows.style === 'french') {
            const hBar = new THREE.Mesh(
                new THREE.BoxGeometry(width, frameThickness * 0.7, frameDepth),
                this.windowFrameMaterial
            );
            windowGroup.add(hBar);
        }

        windowGroup.position.set(x, y, z);
        windowGroup.rotation.y = rotY;
        this.buildingGroup.add(windowGroup);

        return windowGroup;
    }

    /**
     * Крыша здания
     */
    private createRoof(width: number, length: number, height: number): void {
        const { type, height: roofHeight } = this.params.roof;

        switch (type) {
            case 'pitched':
                this.createPitchedRoof(width, length, height, roofHeight);
                break;
            case 'hip':
                this.createHipRoof(width, length, height, roofHeight);
                break;
            default:
                this.createFlatRoof(width, length, height);
        }
    }

    private createFlatRoof(width: number, length: number, height: number): void {
        // Плита крыши
        this.createBox(
            width / 2, height + 0.15, length / 2,
            width + 0.6, 0.3, length + 0.6,
            this.roofMaterial
        );

        // Парапет
        const parapetHeight = 0.6;
        const parapetThickness = 0.2;

        // Передний
        this.createBox(width / 2, height + 0.3 + parapetHeight / 2, -0.3,
            width + 0.6, parapetHeight, parapetThickness, this.facadeSecondaryMaterial);
        // Задний
        this.createBox(width / 2, height + 0.3 + parapetHeight / 2, length + 0.3,
            width + 0.6, parapetHeight, parapetThickness, this.facadeSecondaryMaterial);
        // Левый
        this.createBox(-0.3, height + 0.3 + parapetHeight / 2, length / 2,
            parapetThickness, parapetHeight, length + 0.6, this.facadeSecondaryMaterial);
        // Правый
        this.createBox(width + 0.3, height + 0.3 + parapetHeight / 2, length / 2,
            parapetThickness, parapetHeight, length + 0.6, this.facadeSecondaryMaterial);
    }

    private createPitchedRoof(width: number, length: number, height: number, roofHeight: number): void {
        const overhang = 0.8;

        // Создаем геометрию скатной крыши
        const shape = new THREE.Shape();
        shape.moveTo(-overhang, 0);
        shape.lineTo(width / 2, roofHeight);
        shape.lineTo(width + overhang, 0);
        shape.closePath();

        const extrudeSettings = {
            depth: length + overhang * 2,
            bevelEnabled: false,
        };

        const roofGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        roofGeometry.rotateX(Math.PI / 2);

        const roof = new THREE.Mesh(roofGeometry, this.roofMaterial);
        roof.position.set(0, height, length + overhang);
        roof.castShadow = true;
        this.buildingGroup.add(roof);

        // Фронтоны
        const gableShape = new THREE.Shape();
        gableShape.moveTo(0, 0);
        gableShape.lineTo(width, 0);
        gableShape.lineTo(width / 2, roofHeight);
        gableShape.closePath();

        const gableGeom = new THREE.ShapeGeometry(gableShape);

        // Передний фронтон
        const frontGable = new THREE.Mesh(gableGeom, this.facadeMaterial);
        frontGable.position.set(0, height, -0.01);
        this.buildingGroup.add(frontGable);

        // Задний фронтон
        const backGable = new THREE.Mesh(gableGeom, this.facadeMaterial);
        backGable.position.set(width, height, length + 0.01);
        backGable.rotation.y = Math.PI;
        this.buildingGroup.add(backGable);
    }

    private createHipRoof(width: number, length: number, height: number, roofHeight: number): void {
        const overhang = 0.6;

        const vertices = new Float32Array([
            // Основание
            -overhang, 0, -overhang,
            width + overhang, 0, -overhang,
            width + overhang, 0, length + overhang,
            -overhang, 0, length + overhang,
            // Конек
            width * 0.25, roofHeight, length / 2,
            width * 0.75, roofHeight, length / 2,
        ]);

        const indices = [
            0, 1, 4, 1, 5, 4,  // Передний скат
            2, 3, 5, 3, 4, 5,  // Задний скат
            0, 4, 3,          // Левый скат
            1, 2, 5,          // Правый скат
        ];

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        const roof = new THREE.Mesh(geometry, this.roofMaterial);
        roof.position.y = height;
        roof.castShadow = true;
        this.buildingGroup.add(roof);
    }

    /**
     * Балконы для жилого дома
     */
    private createResidentialBalconies(
        width: number, length: number,
        floorHeight: number, floorsCount: number
    ): void {
        const balconyWidth = 3;
        const balconyDepth = this.params.extras.balconyDepth;
        const balconyCount = Math.max(1, Math.floor(width / 5));
        const spacing = width / (balconyCount + 1);

        for (let floor = 1; floor < floorsCount; floor++) {
            const y = floor * floorHeight;

            for (let i = 1; i <= balconyCount; i++) {
                const x = spacing * i;
                this.createBalcony(x, y, -balconyDepth - 0.15, balconyWidth, balconyDepth);
            }
        }
    }

    private createBalcony(x: number, y: number, z: number, width: number, depth: number): void {
        const balconyGroup = new THREE.Group();

        // Плита
        const plate = new THREE.Mesh(
            new THREE.BoxGeometry(width, 0.2, depth),
            this.facadeSecondaryMaterial
        );
        plate.position.set(0, 0, -depth / 2);
        plate.castShadow = true;
        balconyGroup.add(plate);

        // Ограждение
        const railHeight = 1.1;
        const railMaterial = this.windowFrameMaterial;

        // Стойки
        const postGeom = new THREE.BoxGeometry(0.05, railHeight, 0.05);
        [-width / 2, 0, width / 2].forEach(px => {
            const post = new THREE.Mesh(postGeom, railMaterial);
            post.position.set(px, railHeight / 2, -depth);
            balconyGroup.add(post);
        });

        // Поручень
        const rail = new THREE.Mesh(
            new THREE.BoxGeometry(width, 0.06, 0.06),
            railMaterial
        );
        rail.position.set(0, railHeight, -depth);
        balconyGroup.add(rail);

        // Стеклянные панели
        const glassPanel = new THREE.Mesh(
            new THREE.PlaneGeometry(width / 2 - 0.1, railHeight - 0.2),
            this.glassMaterial
        );
        glassPanel.position.set(-width / 4, railHeight / 2, -depth);
        balconyGroup.add(glassPanel);

        const glassPanel2 = glassPanel.clone();
        glassPanel2.position.x = width / 4;
        balconyGroup.add(glassPanel2);

        balconyGroup.position.set(x, y, z);
        this.buildingGroup.add(balconyGroup);
    }

    /**
     * Современный вход
     */
    private createModernEntrance(width: number, length: number, floorHeight: number): void {
        const entranceWidth = this.params.extras.entranceWidth;
        const entranceHeight = floorHeight * 0.85;
        const entranceDepth = 2.5;
        const x = width / 2;

        // Козырек
        const canopyMaterial = new THREE.MeshStandardMaterial({
            color: '#333333',
            roughness: 0.3,
            metalness: 0.7,
        });

        const canopy = new THREE.Mesh(
            new THREE.BoxGeometry(entranceWidth + 2, 0.15, entranceDepth + 1),
            canopyMaterial
        );
        canopy.position.set(x, entranceHeight + 0.5, -entranceDepth / 2 - 0.5);
        canopy.castShadow = true;
        this.buildingGroup.add(canopy);

        // Стеклянная стена входа
        const glassWall = new THREE.Mesh(
            new THREE.PlaneGeometry(entranceWidth, entranceHeight),
            this.glassMaterial
        );
        glassWall.position.set(x, entranceHeight / 2, -0.16);
        this.buildingGroup.add(glassWall);

        // Рамки дверей
        const doorWidth = entranceWidth / 2 - 0.3;
        const doorHeight = entranceHeight * 0.9;

        [-0.5, 0.5].forEach(offset => {
            const doorFrame = new THREE.Mesh(
                new THREE.BoxGeometry(doorWidth + 0.1, doorHeight + 0.1, 0.1),
                this.windowFrameMaterial
            );
            doorFrame.position.set(x + offset * doorWidth, doorHeight / 2, -0.2);
            this.buildingGroup.add(doorFrame);
        });

        // Ступени
        const stepCount = 3;
        for (let i = 0; i < stepCount; i++) {
            const step = new THREE.Mesh(
                new THREE.BoxGeometry(entranceWidth + 1.5, 0.15, 0.35),
                this.groundMaterial
            );
            step.position.set(x, 0.075 + i * 0.15, -entranceDepth - 0.5 - i * 0.35);
            step.receiveShadow = true;
            this.buildingGroup.add(step);
        }
    }

    /**
     * Вершина небоскреба
     */
    private createSkyscraperTop(width: number, length: number, height: number): void {
        const topMaterial = new THREE.MeshStandardMaterial({
            color: '#1A1A2E',
            roughness: 0.3,
            metalness: 0.8,
        });

        // Техническое помещение на крыше
        const techWidth = width * 0.4;
        const techLength = length * 0.4;
        const techHeight = 3;

        this.createBox(
            width / 2, height + techHeight / 2, length / 2,
            techWidth, techHeight, techLength,
            topMaterial
        );

        // Шпиль / антенна
        const spireHeight = 5;
        const spire = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.5, spireHeight, 8),
            topMaterial
        );
        spire.position.set(width / 2, height + techHeight + spireHeight / 2, length / 2);
        this.buildingGroup.add(spire);
    }

    /**
     * Лобби небоскреба
     */
    private createSkyscraperLobby(width: number, length: number): void {
        const lobbyHeight = 6;

        // Вход с большим стеклом
        const entranceWidth = width * 0.6;
        const glassEntrance = new THREE.Mesh(
            new THREE.PlaneGeometry(entranceWidth, lobbyHeight),
            this.glassMaterial
        );
        glassEntrance.position.set(width / 2, lobbyHeight / 2, -0.2);
        this.buildingGroup.add(glassEntrance);

        // Навес
        const canopy = new THREE.Mesh(
            new THREE.BoxGeometry(entranceWidth + 4, 0.3, 4),
            new THREE.MeshStandardMaterial({ color: '#2C3E50', metalness: 0.8 })
        );
        canopy.position.set(width / 2, lobbyHeight + 0.15, -2);
        canopy.castShadow = true;
        this.buildingGroup.add(canopy);
    }

    /**
     * Фронтон особняка
     */
    private createPediment(x: number, y: number, z: number, width: number, height: number): void {
        const shape = new THREE.Shape();
        shape.moveTo(-width / 2, 0);
        shape.lineTo(width / 2, 0);
        shape.lineTo(0, height);
        shape.closePath();

        const geometry = new THREE.ShapeGeometry(shape);
        const pediment = new THREE.Mesh(geometry, this.accentMaterial);
        pediment.position.set(x, y, z - 0.4);
        this.buildingGroup.add(pediment);
    }

    /**
     * Карниз особняка
     */
    private createCornice(width: number, length: number, height: number): void {
        const corniceHeight = 0.25;
        const corniceDepth = 0.4;

        // Передний
        this.createBox(width / 2, height, -corniceDepth / 2,
            width + corniceDepth * 2, corniceHeight, corniceDepth, this.accentMaterial);
        // Задний
        this.createBox(width / 2, height, length + corniceDepth / 2,
            width + corniceDepth * 2, corniceHeight, corniceDepth, this.accentMaterial);
        // Боковые
        this.createBox(-corniceDepth / 2, height, length / 2,
            corniceDepth, corniceHeight, length, this.accentMaterial);
        this.createBox(width + corniceDepth / 2, height, length / 2,
            corniceDepth, corniceHeight, length, this.accentMaterial);
    }

    /**
     * Окна особняка с наличниками
     */
    private createMansionWindows(
        width: number, length: number,
        floorHeight: number, floorsCount: number
    ): void {
        const windowWidth = 1.2;
        const windowHeight = 2;
        const windowsPerFloor = Math.max(2, Math.floor(width / 4));
        const spacing = width / (windowsPerFloor + 1);

        for (let floor = 0; floor < floorsCount; floor++) {
            const y = floor * floorHeight + floorHeight * 0.45;

            for (let i = 1; i <= windowsPerFloor; i++) {
                const x = spacing * i;
                this.createMansionWindow(x, y, -0.3, windowWidth, windowHeight);
            }
        }
    }

    private createMansionWindow(x: number, y: number, z: number, width: number, height: number): void {
        const windowGroup = new THREE.Group();

        // Наличник (декоративная рамка)
        const frameWidth = 0.15;
        const frameColor = this.accentMaterial;

        // Верхний наличник с декором
        const topFrame = new THREE.Mesh(
            new THREE.BoxGeometry(width + frameWidth * 4, frameWidth * 2, 0.1),
            frameColor
        );
        topFrame.position.y = height / 2 + frameWidth;
        windowGroup.add(topFrame);

        // Боковые наличники
        [-1, 1].forEach(side => {
            const sideFrame = new THREE.Mesh(
                new THREE.BoxGeometry(frameWidth, height + frameWidth * 2, 0.1),
                frameColor
            );
            sideFrame.position.x = side * (width / 2 + frameWidth);
            windowGroup.add(sideFrame);
        });

        // Подоконник
        const sill = new THREE.Mesh(
            new THREE.BoxGeometry(width + frameWidth * 4, frameWidth, 0.2),
            frameColor
        );
        sill.position.set(0, -height / 2 - frameWidth / 2, 0.05);
        windowGroup.add(sill);

        // Стекло
        const glass = new THREE.Mesh(
            new THREE.PlaneGeometry(width, height),
            this.glassMaterial
        );
        glass.position.z = 0.05;
        windowGroup.add(glass);

        // Рама окна
        const verticalBar = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, height, 0.08),
            this.windowFrameMaterial
        );
        verticalBar.position.z = 0.06;
        windowGroup.add(verticalBar);

        const horizontalBar = new THREE.Mesh(
            new THREE.BoxGeometry(width, 0.05, 0.08),
            this.windowFrameMaterial
        );
        horizontalBar.position.z = 0.06;
        windowGroup.add(horizontalBar);

        windowGroup.position.set(x, y, z);
        this.buildingGroup.add(windowGroup);
    }

    /**
     * Парадный вход особняка
     */
    private createGrandEntrance(width: number, length: number, floorHeight: number): void {
        const entranceWidth = 3;
        const entranceHeight = floorHeight * 0.85;
        const x = width / 2;

        // Портик
        const porticoDepth = 2;
        const porticoHeight = floorHeight + 1;

        // Крыша портика
        this.createBox(x, porticoHeight, -porticoDepth / 2,
            entranceWidth + 2, 0.4, porticoDepth + 1, this.accentMaterial);

        // Колонны портика
        [-entranceWidth / 2 - 0.5, entranceWidth / 2 + 0.5].forEach(offset => {
            this.createColumn(x + offset, 0, -porticoDepth, 0.25, porticoHeight);
        });

        // Дверь
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: '#4A3728',
            roughness: 0.7,
        });

        const door = new THREE.Mesh(
            new THREE.BoxGeometry(entranceWidth * 0.8, entranceHeight, 0.1),
            doorMaterial
        );
        door.position.set(x, entranceHeight / 2, -0.2);
        this.buildingGroup.add(door);

        // Ступени - идут от земли вверх к входу
        const stepCount = 5;
        const stepHeight = 0.18;
        const stepDepth = 0.35;
        const startZ = -porticoDepth - stepCount * stepDepth;

        for (let i = 0; i < stepCount; i++) {
            // Каждая ступень выше предыдущей и ближе к двери
            const stepY = (i + 1) * stepHeight / 2;
            const stepZ = startZ + i * stepDepth + stepDepth / 2;
            const stepWidth = entranceWidth + 2 - i * 0.1;

            this.createBox(x, stepY, stepZ, stepWidth, (i + 1) * stepHeight, stepDepth, this.accentMaterial);
        }
    }

    /**
     * Балюстрада на крыше
     */
    private createBalustrade(width: number, length: number, height: number): void {
        const balustradeHeight = 0.8;
        const postWidth = 0.1;
        const postSpacing = 0.8;

        // Перила
        const railMaterial = this.accentMaterial;

        // Передние
        this.createBox(width / 2, height + balustradeHeight, -0.2,
            width, 0.1, 0.1, railMaterial);

        // Балясины
        const postCount = Math.floor(width / postSpacing);
        for (let i = 0; i <= postCount; i++) {
            const post = new THREE.Mesh(
                new THREE.BoxGeometry(postWidth, balustradeHeight, postWidth),
                railMaterial
            );
            post.position.set(i * postSpacing, height + balustradeHeight / 2, -0.2);
            this.buildingGroup.add(post);
        }
    }

    /**
     * Крыша особняка
     */
    private createMansionRoof(width: number, length: number, height: number): void {
        const roofHeight = 3;
        this.createHipRoof(width, length, height + 0.3, roofHeight);

        // Слуховые окна
        const dormerCount = Math.max(1, Math.floor(width / 6));
        const dormerSpacing = width / (dormerCount + 1);

        for (let i = 1; i <= dormerCount; i++) {
            this.createDormer(dormerSpacing * i, height + roofHeight * 0.4, length * 0.1);
        }
    }

    private createDormer(x: number, y: number, z: number): void {
        const dormerWidth = 1.5;
        const dormerHeight = 1.5;
        const dormerDepth = 1;

        // Корпус слухового окна
        this.createBox(x, y + dormerHeight / 2, z - dormerDepth / 2,
            dormerWidth, dormerHeight, dormerDepth, this.facadeMaterial);

        // Крыша слухового окна
        const miniRoofShape = new THREE.Shape();
        miniRoofShape.moveTo(-dormerWidth / 2 - 0.2, 0);
        miniRoofShape.lineTo(0, 0.8);
        miniRoofShape.lineTo(dormerWidth / 2 + 0.2, 0);
        miniRoofShape.closePath();

        const miniRoofGeom = new THREE.ExtrudeGeometry(miniRoofShape, {
            depth: dormerDepth + 0.3,
            bevelEnabled: false,
        });
        miniRoofGeom.rotateX(Math.PI / 2);

        const miniRoof = new THREE.Mesh(miniRoofGeom, this.roofMaterial);
        miniRoof.position.set(x, y + dormerHeight, z + 0.15);
        this.buildingGroup.add(miniRoof);

        // Окно в слуховом окне
        const glass = new THREE.Mesh(
            new THREE.PlaneGeometry(dormerWidth * 0.7, dormerHeight * 0.7),
            this.glassMaterial
        );
        glass.position.set(x, y + dormerHeight / 2, z - dormerDepth + 0.1);
        this.buildingGroup.add(glass);
    }

    /**
     * Панорамные окна коттеджа
     */
    private createPanoramicWindows(
        width: number, length: number,
        floorHeight: number, floors: number
    ): void {
        // Большие окна на первом этаже
        const windowWidth = 3;
        const windowHeight = floorHeight * 0.75;

        // Передний фасад
        this.createWindow(width * 0.25, floorHeight * 0.45, -0.2, windowWidth, windowHeight, 0);
        this.createWindow(width * 0.65, floorHeight * 0.45, -0.2, windowWidth, windowHeight, 0);

        if (floors > 1) {
            const smallWindowHeight = floorHeight * 0.5;
            this.createWindow(width * 0.25, floorHeight * 1.4, -0.2, windowWidth * 0.8, smallWindowHeight, 0);
            this.createWindow(width * 0.65, floorHeight * 1.4, -0.2, windowWidth * 0.8, smallWindowHeight, 0);
        }
    }

    /**
     * Терраса коттеджа
     */
    private createTerrace(width: number, length: number, woodMaterial: THREE.Material): void {
        const terraceWidth = width * 0.6;
        const terraceDepth = 4;

        // Пол террасы
        const floor = new THREE.Mesh(
            new THREE.BoxGeometry(terraceWidth, 0.15, terraceDepth),
            woodMaterial
        );
        floor.position.set(terraceWidth / 2, 0.075, length + terraceDepth / 2);
        floor.receiveShadow = true;
        this.buildingGroup.add(floor);

        // Перила
        const railHeight = 1;
        const railMaterial = woodMaterial;

        // Стойки
        const postPositions = [
            [0, length],
            [terraceWidth, length],
            [terraceWidth, length + terraceDepth],
            [0, length + terraceDepth],
        ];

        postPositions.forEach(([px, pz]) => {
            const post = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, railHeight, 0.1),
                railMaterial
            );
            post.position.set(px, railHeight / 2, pz);
            this.buildingGroup.add(post);
        });

        // Горизонтальные перила
        this.createBox(0, railHeight, length + terraceDepth / 2, 0.08, 0.08, terraceDepth, railMaterial);
        this.createBox(terraceWidth, railHeight, length + terraceDepth / 2, 0.08, 0.08, terraceDepth, railMaterial);
        this.createBox(terraceWidth / 2, railHeight, length + terraceDepth, terraceWidth, 0.08, 0.08, railMaterial);
    }

    /**
     * Гараж коттеджа
     */
    private createGarage(x: number, z: number, height: number): void {
        const garageWidth = 6;
        const garageDepth = 7;

        const garageMaterial = new THREE.MeshStandardMaterial({
            color: '#E8E4DC',
            roughness: 0.8,
        });

        this.createWallBox(x, 0, z, garageWidth, height, garageDepth, garageMaterial);

        // Ворота гаража
        const gateMaterial = new THREE.MeshStandardMaterial({
            color: '#555555',
            roughness: 0.6,
            metalness: 0.3,
        });

        const gate = new THREE.Mesh(
            new THREE.PlaneGeometry(garageWidth * 0.8, height * 0.85),
            gateMaterial
        );
        gate.position.set(x + garageWidth / 2, height * 0.425, z - 0.16);
        this.buildingGroup.add(gate);

        // Плоская крыша гаража
        this.createBox(x + garageWidth / 2, height + 0.1, z + garageDepth / 2,
            garageWidth + 0.4, 0.2, garageDepth + 0.4, this.roofMaterial);
    }

    /**
     * Крыша коттеджа
     */
    private createCottageRoof(
        mainWidth: number, wingWidth: number,
        length: number, wingLength: number, height: number
    ): void {
        const roofHeight = 2.5;
        const overhang = 0.8;

        // Крыша основного блока - двускатная
        // Используем BufferGeometry для точного контроля позиции
        const roofVertices = new Float32Array([
            // Передний скат (левая часть)
            -overhang, 0, -overhang,
            mainWidth / 2, roofHeight, -overhang,
            -overhang, 0, length + overhang,
            mainWidth / 2, roofHeight, length + overhang,

            // Передний скат (правая часть)
            mainWidth / 2, roofHeight, -overhang,
            mainWidth + overhang, 0, -overhang,
            mainWidth / 2, roofHeight, length + overhang,
            mainWidth + overhang, 0, length + overhang,
        ]);

        const roofIndices = [
            // Левый скат
            0, 2, 1,
            1, 2, 3,
            // Правый скат
            4, 6, 5,
            5, 6, 7,
        ];

        const roofGeometry = new THREE.BufferGeometry();
        roofGeometry.setAttribute('position', new THREE.BufferAttribute(roofVertices, 3));
        roofGeometry.setIndex(roofIndices);
        roofGeometry.computeVertexNormals();

        const mainRoof = new THREE.Mesh(roofGeometry, this.roofMaterial);
        mainRoof.position.y = height;
        mainRoof.castShadow = true;
        this.buildingGroup.add(mainRoof);

        // Фронтоны (треугольные торцы)
        const gableShape = new THREE.Shape();
        gableShape.moveTo(0, 0);
        gableShape.lineTo(mainWidth, 0);
        gableShape.lineTo(mainWidth / 2, roofHeight);
        gableShape.closePath();

        const gableGeom = new THREE.ShapeGeometry(gableShape);

        // Передний фронтон
        const frontGable = new THREE.Mesh(gableGeom, this.facadeMaterial);
        frontGable.position.set(0, height, -overhang + 0.01);
        this.buildingGroup.add(frontGable);

        // Задний фронтон
        const backGable = new THREE.Mesh(gableGeom, this.facadeMaterial);
        backGable.position.set(mainWidth, height, length + overhang - 0.01);
        backGable.rotation.y = Math.PI;
        this.buildingGroup.add(backGable);

        // Крыша крыла (плоская с небольшим наклоном)
        const wingRoofGeom = new THREE.BoxGeometry(wingWidth + 0.6, 0.25, wingLength + 0.6);
        const wingRoof = new THREE.Mesh(wingRoofGeom, this.roofMaterial);
        wingRoof.position.set(mainWidth + wingWidth / 2 - 0.05, height * 0.8 + 0.15, length - wingLength / 2);
        wingRoof.rotation.z = -0.08;
        wingRoof.castShadow = true;
        this.buildingGroup.add(wingRoof);
    }

    /**
     * Ландшафт вокруг коттеджа
     */
    private createLandscape(width: number, length: number): void {
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: '#4A7C59',
            roughness: 1,
        });

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(width, length),
            groundMaterial
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(width / 4, -0.01, length / 3);
        ground.receiveShadow = true;
        this.buildingGroup.add(ground);

        // Дорожка
        const pathMaterial = new THREE.MeshStandardMaterial({
            color: '#A0A0A0',
            roughness: 0.9,
        });

        const path = new THREE.Mesh(
            new THREE.PlaneGeometry(2, length * 0.8),
            pathMaterial
        );
        path.rotation.x = -Math.PI / 2;
        path.position.set(width * 0.3, 0.01, -length * 0.2);
        path.receiveShadow = true;
        this.buildingGroup.add(path);
    }

    /**
     * Получение информации о модели
     */
    public getModelInfo(): ModelInfo {
        let verticesCount = 0;
        let facesCount = 0;

        this.buildingGroup.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                const geometry = object.geometry;
                if (geometry instanceof THREE.BufferGeometry) {
                    const position = geometry.getAttribute('position');
                    if (position) {
                        verticesCount += position.count;
                    }
                    const index = geometry.getIndex();
                    if (index) {
                        facesCount += index.count / 3;
                    } else if (position) {
                        facesCount += position.count / 3;
                    }
                }
            }
        });

        const totalHeight = this.params.dimensions.floorHeight * this.params.dimensions.floorsCount;

        return {
            verticesCount,
            facesCount: Math.round(facesCount),
            totalHeight,
        };
    }

    /**
     * Обновление параметров
     */
    public updateParams(params: BuildingParameters): THREE.Group {
        this.params = params;
        return this.generate();
    }

    public getBuilding(): THREE.Group {
        return this.buildingGroup;
    }
}
