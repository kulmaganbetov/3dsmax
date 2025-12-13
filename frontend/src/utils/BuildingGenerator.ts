/**
 * Генератор параметрических архитектурных моделей
 *
 * Основной класс для создания 3D-моделей зданий в Three.js
 * на основе заданных параметров. Использует THREE.Shape и
 * ExtrudeGeometry для генерации сложных архитектурных форм.
 *
 * @module BuildingGenerator
 */

import * as THREE from 'three';
import {
    BuildingParameters,
    BuildingDimensions,
    FacadeParams,
    WindowParams,
    RoofParams,
    ExtrasParams,
    ModelInfo,
} from '../types/building';

/**
 * Класс генератора зданий
 *
 * Создает модульную 3D-модель здания из отдельных компонентов:
 * - Основной корпус здания
 * - Этажи с межэтажными перекрытиями
 * - Окна на всех фасадах
 * - Крыша (плоская, скатная или вальмовая)
 * - Балконы (опционально)
 * - Входная группа (опционально)
 */
export class BuildingGenerator {
    private params: BuildingParameters;
    private buildingGroup: THREE.Group;

    // Материалы
    private facadeMaterial!: THREE.MeshStandardMaterial;
    private windowFrameMaterial!: THREE.MeshStandardMaterial;
    private glassMaterial!: THREE.MeshStandardMaterial;
    private roofMaterial!: THREE.MeshStandardMaterial;
    private floorSeparatorMaterial!: THREE.MeshStandardMaterial;
    private entranceMaterial!: THREE.MeshStandardMaterial;

    constructor(params: BuildingParameters) {
        this.params = params;
        this.buildingGroup = new THREE.Group();
        this.initMaterials();
    }

    /**
     * Инициализация материалов для различных частей здания
     */
    private initMaterials(): void {
        // Материал фасада
        this.facadeMaterial = new THREE.MeshStandardMaterial({
            color: this.params.facade.color,
            roughness: 0.7,
            metalness: 0.1,
            flatShading: false,
        });

        // Материал оконной рамы
        this.windowFrameMaterial = new THREE.MeshStandardMaterial({
            color: this.params.windows.frameColor,
            roughness: 0.3,
            metalness: 0.6,
        });

        // Материал стекла
        this.glassMaterial = new THREE.MeshStandardMaterial({
            color: this.params.windows.glassColor,
            transparent: true,
            opacity: this.params.windows.glassOpacity,
            roughness: 0.1,
            metalness: 0.9,
            side: THREE.DoubleSide,
        });

        // Материал крыши
        this.roofMaterial = new THREE.MeshStandardMaterial({
            color: this.params.roof.color,
            roughness: 0.8,
            metalness: 0.2,
        });

        // Материал межэтажных разделителей
        this.floorSeparatorMaterial = new THREE.MeshStandardMaterial({
            color: this.darkenColor(this.params.facade.color, 0.2),
            roughness: 0.6,
            metalness: 0.1,
        });

        // Материал входной группы
        this.entranceMaterial = new THREE.MeshStandardMaterial({
            color: '#888888',
            roughness: 0.4,
            metalness: 0.3,
        });
    }

    /**
     * Затемнение цвета на заданный процент
     */
    private darkenColor(hex: string, percent: number): string {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, ((num >> 16) & 0xff) * (1 - percent));
        const g = Math.max(0, ((num >> 8) & 0xff) * (1 - percent));
        const b = Math.max(0, (num & 0xff) * (1 - percent));
        return '#' + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b))
            .toString(16).slice(1);
    }

    /**
     * Генерация полной модели здания
     */
    public generate(): THREE.Group {
        // Очищаем группу
        while (this.buildingGroup.children.length > 0) {
            this.buildingGroup.remove(this.buildingGroup.children[0]);
        }

        const { dimensions, extras } = this.params;

        // 1. Создаем основной корпус здания
        this.createMainBody(dimensions);

        // 2. Создаем межэтажные разделители (для классического и индустриального фасадов)
        if (['classic', 'industrial'].includes(this.params.facade.type)) {
            this.createFloorSeparators(dimensions);
        }

        // 3. Создаем окна на всех фасадах
        this.createAllWindows(dimensions);

        // 4. Создаем крышу
        this.createRoof(dimensions);

        // 5. Создаем балконы (если включены)
        if (extras.hasBalconies) {
            this.createBalconies(dimensions, extras);
        }

        // 6. Создаем входную группу (если включена)
        if (extras.hasEntrance) {
            this.createEntrance(dimensions, extras);
        }

        // Центрируем модель
        this.centerBuilding();

        return this.buildingGroup;
    }

    /**
     * Создание основного корпуса здания с использованием ExtrudeGeometry
     */
    private createMainBody(dimensions: BuildingDimensions): void {
        const { width, length, floorHeight, floorsCount } = dimensions;
        const totalHeight = floorHeight * floorsCount;

        // Создаем форму основания здания
        const shape = new THREE.Shape();

        // Основной прямоугольник с небольшими скруглениями для современного стиля
        if (this.params.facade.type === 'modern' || this.params.facade.type === 'minimalist') {
            const radius = 0.3;
            shape.moveTo(radius, 0);
            shape.lineTo(width - radius, 0);
            shape.quadraticCurveTo(width, 0, width, radius);
            shape.lineTo(width, length - radius);
            shape.quadraticCurveTo(width, length, width - radius, length);
            shape.lineTo(radius, length);
            shape.quadraticCurveTo(0, length, 0, length - radius);
            shape.lineTo(0, radius);
            shape.quadraticCurveTo(0, 0, radius, 0);
        } else {
            // Простой прямоугольник для остальных стилей
            shape.moveTo(0, 0);
            shape.lineTo(width, 0);
            shape.lineTo(width, length);
            shape.lineTo(0, length);
            shape.closePath();
        }

        // Настройки экструзии
        const extrudeSettings: THREE.ExtrudeGeometryOptions = {
            depth: totalHeight,
            bevelEnabled: false,
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        // Поворачиваем геометрию чтобы высота была по Y
        geometry.rotateX(-Math.PI / 2);

        const building = new THREE.Mesh(geometry, this.facadeMaterial);
        building.name = 'mainBody';
        building.castShadow = true;
        building.receiveShadow = true;

        this.buildingGroup.add(building);
    }

    /**
     * Создание межэтажных разделителей (карнизов)
     */
    private createFloorSeparators(dimensions: BuildingDimensions): void {
        const { width, length, floorHeight, floorsCount } = dimensions;
        const separatorHeight = 0.15;
        const separatorDepth = 0.1;

        for (let floor = 1; floor <= floorsCount; floor++) {
            const y = floor * floorHeight;

            // Разделитель по ширине (передняя и задняя сторона)
            const separatorGeometry = new THREE.BoxGeometry(
                width + separatorDepth * 2,
                separatorHeight,
                separatorDepth
            );

            // Передняя сторона
            const frontSeparator = new THREE.Mesh(separatorGeometry, this.floorSeparatorMaterial);
            frontSeparator.position.set(width / 2, y, -separatorDepth / 2);
            this.buildingGroup.add(frontSeparator);

            // Задняя сторона
            const backSeparator = new THREE.Mesh(separatorGeometry, this.floorSeparatorMaterial);
            backSeparator.position.set(width / 2, y, length + separatorDepth / 2);
            this.buildingGroup.add(backSeparator);

            // Боковые разделители
            const sideSeparatorGeometry = new THREE.BoxGeometry(
                separatorDepth,
                separatorHeight,
                length + separatorDepth * 2
            );

            // Левая сторона
            const leftSeparator = new THREE.Mesh(sideSeparatorGeometry, this.floorSeparatorMaterial);
            leftSeparator.position.set(-separatorDepth / 2, y, length / 2);
            this.buildingGroup.add(leftSeparator);

            // Правая сторона
            const rightSeparator = new THREE.Mesh(sideSeparatorGeometry, this.floorSeparatorMaterial);
            rightSeparator.position.set(width + separatorDepth / 2, y, length / 2);
            this.buildingGroup.add(rightSeparator);
        }
    }

    /**
     * Создание окон на всех фасадах
     */
    private createAllWindows(dimensions: BuildingDimensions): void {
        const { width, length, floorHeight, floorsCount } = dimensions;
        const { perFloor, width: winWidth, height: winHeight, style } = this.params.windows;

        // Окна на передней и задней стороне
        this.createWindowRow(width, floorsCount, floorHeight, perFloor, winWidth, winHeight, style,
            (x, y) => ({ x, y, z: -0.01, rotY: 0 }));

        this.createWindowRow(width, floorsCount, floorHeight, perFloor, winWidth, winHeight, style,
            (x, y) => ({ x, y, z: length + 0.01, rotY: Math.PI }));

        // Окна на боковых сторонах
        const sideWindowsCount = Math.max(1, Math.floor(perFloor * (length / width)));

        this.createWindowRow(length, floorsCount, floorHeight, sideWindowsCount, winWidth, winHeight, style,
            (x, y) => ({ x: -0.01, y, z: x, rotY: -Math.PI / 2 }));

        this.createWindowRow(length, floorsCount, floorHeight, sideWindowsCount, winWidth, winHeight, style,
            (x, y) => ({ x: width + 0.01, y, z: x, rotY: Math.PI / 2 }));
    }

    /**
     * Создание ряда окон на одном фасаде
     */
    private createWindowRow(
        wallWidth: number,
        floorsCount: number,
        floorHeight: number,
        windowsPerFloor: number,
        windowWidth: number,
        windowHeight: number,
        style: string,
        positionFn: (x: number, y: number) => { x: number; y: number; z: number; rotY: number }
    ): void {
        const spacing = wallWidth / (windowsPerFloor + 1);

        for (let floor = 0; floor < floorsCount; floor++) {
            const y = floor * floorHeight + floorHeight * 0.5;

            for (let w = 0; w < windowsPerFloor; w++) {
                const x = spacing * (w + 1);
                const pos = positionFn(x, y);

                const windowMesh = this.createWindow(windowWidth, windowHeight, style);
                windowMesh.position.set(pos.x, pos.y, pos.z);
                windowMesh.rotation.y = pos.rotY;

                this.buildingGroup.add(windowMesh);
            }
        }
    }

    /**
     * Создание отдельного окна с рамой и стеклом
     */
    private createWindow(width: number, height: number, style: string): THREE.Group {
        const windowGroup = new THREE.Group();
        const frameThickness = 0.05;
        const frameDepth = 0.1;

        // Создаем форму окна в зависимости от стиля
        let windowShape: THREE.Shape;

        switch (style) {
            case 'arched':
                windowShape = this.createArchedWindowShape(width, height);
                break;
            case 'panoramic':
                // Панорамные окна - большие прямоугольные
                windowShape = this.createRectangularShape(width * 1.5, height * 1.2);
                break;
            case 'french':
                // Французские окна - от пола до потолка
                windowShape = this.createRectangularShape(width, height * 1.5);
                break;
            default:
                windowShape = this.createRectangularShape(width, height);
        }

        // Создаем раму
        const frameGeometry = this.createFrameGeometry(windowShape, frameThickness, frameDepth);
        const frame = new THREE.Mesh(frameGeometry, this.windowFrameMaterial);
        frame.castShadow = true;
        windowGroup.add(frame);

        // Создаем стекло
        const glassGeometry = new THREE.ShapeGeometry(windowShape);
        const glass = new THREE.Mesh(glassGeometry, this.glassMaterial);
        glass.position.z = frameDepth / 2;
        windowGroup.add(glass);

        // Добавляем перекладины для классического стиля
        if (this.params.facade.type === 'classic') {
            this.addWindowCrossbars(windowGroup, width, height, frameThickness, frameDepth);
        }

        windowGroup.name = 'window';
        return windowGroup;
    }

    /**
     * Создание прямоугольной формы
     */
    private createRectangularShape(width: number, height: number): THREE.Shape {
        const shape = new THREE.Shape();
        shape.moveTo(-width / 2, -height / 2);
        shape.lineTo(width / 2, -height / 2);
        shape.lineTo(width / 2, height / 2);
        shape.lineTo(-width / 2, height / 2);
        shape.closePath();
        return shape;
    }

    /**
     * Создание арочной формы окна
     */
    private createArchedWindowShape(width: number, height: number): THREE.Shape {
        const shape = new THREE.Shape();
        const archHeight = width / 2;

        shape.moveTo(-width / 2, -height / 2);
        shape.lineTo(width / 2, -height / 2);
        shape.lineTo(width / 2, height / 2 - archHeight);
        shape.quadraticCurveTo(width / 2, height / 2, 0, height / 2);
        shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - archHeight);
        shape.closePath();

        return shape;
    }

    /**
     * Создание геометрии рамы окна
     */
    private createFrameGeometry(
        shape: THREE.Shape,
        thickness: number,
        depth: number
    ): THREE.ExtrudeGeometry {
        // Создаем внутреннюю форму (отверстие)
        const innerPath = new THREE.Path();
        const points = shape.getPoints();

        // Масштабируем внутрь для создания рамы
        const scale = 0.9;
        points.forEach((point, i) => {
            const scaledX = point.x * scale;
            const scaledY = point.y * scale;
            if (i === 0) {
                innerPath.moveTo(scaledX, scaledY);
            } else {
                innerPath.lineTo(scaledX, scaledY);
            }
        });
        innerPath.closePath();

        shape.holes.push(innerPath);

        const extrudeSettings: THREE.ExtrudeGeometryOptions = {
            depth: depth,
            bevelEnabled: false,
        };

        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }

    /**
     * Добавление перекладин в окно (классический стиль)
     */
    private addWindowCrossbars(
        windowGroup: THREE.Group,
        width: number,
        height: number,
        thickness: number,
        depth: number
    ): void {
        // Горизонтальная перекладина
        const hBarGeometry = new THREE.BoxGeometry(width * 0.9, thickness, depth);
        const hBar = new THREE.Mesh(hBarGeometry, this.windowFrameMaterial);
        hBar.position.z = depth / 2;
        windowGroup.add(hBar);

        // Вертикальная перекладина
        const vBarGeometry = new THREE.BoxGeometry(thickness, height * 0.9, depth);
        const vBar = new THREE.Mesh(vBarGeometry, this.windowFrameMaterial);
        vBar.position.z = depth / 2;
        windowGroup.add(vBar);
    }

    /**
     * Создание крыши
     */
    private createRoof(dimensions: BuildingDimensions): void {
        const { width, length, floorHeight, floorsCount } = dimensions;
        const totalHeight = floorHeight * floorsCount;
        const { type, height: roofHeight } = this.params.roof;

        switch (type) {
            case 'pitched':
                this.createPitchedRoof(width, length, totalHeight, roofHeight);
                break;
            case 'hip':
                this.createHipRoof(width, length, totalHeight, roofHeight);
                break;
            default:
                this.createFlatRoof(width, length, totalHeight);
        }
    }

    /**
     * Плоская крыша
     */
    private createFlatRoof(width: number, length: number, height: number): void {
        const roofThickness = 0.3;
        const overhang = 0.3;

        const geometry = new THREE.BoxGeometry(
            width + overhang * 2,
            roofThickness,
            length + overhang * 2
        );

        const roof = new THREE.Mesh(geometry, this.roofMaterial);
        roof.position.set(width / 2, height + roofThickness / 2, length / 2);
        roof.castShadow = true;
        roof.receiveShadow = true;
        roof.name = 'roof';

        this.buildingGroup.add(roof);

        // Добавляем парапет
        this.createParapet(width, length, height + roofThickness, overhang);
    }

    /**
     * Создание парапета для плоской крыши
     */
    private createParapet(width: number, length: number, height: number, overhang: number): void {
        const parapetHeight = 0.5;
        const parapetThickness = 0.15;

        const parapetMaterial = this.floorSeparatorMaterial;

        // Передний и задний парапет
        const frontBackGeometry = new THREE.BoxGeometry(
            width + overhang * 2,
            parapetHeight,
            parapetThickness
        );

        const frontParapet = new THREE.Mesh(frontBackGeometry, parapetMaterial);
        frontParapet.position.set(width / 2, height + parapetHeight / 2, -overhang);
        this.buildingGroup.add(frontParapet);

        const backParapet = new THREE.Mesh(frontBackGeometry, parapetMaterial);
        backParapet.position.set(width / 2, height + parapetHeight / 2, length + overhang);
        this.buildingGroup.add(backParapet);

        // Боковые парапеты
        const sideGeometry = new THREE.BoxGeometry(
            parapetThickness,
            parapetHeight,
            length + overhang * 2
        );

        const leftParapet = new THREE.Mesh(sideGeometry, parapetMaterial);
        leftParapet.position.set(-overhang, height + parapetHeight / 2, length / 2);
        this.buildingGroup.add(leftParapet);

        const rightParapet = new THREE.Mesh(sideGeometry, parapetMaterial);
        rightParapet.position.set(width + overhang, height + parapetHeight / 2, length / 2);
        this.buildingGroup.add(rightParapet);
    }

    /**
     * Скатная крыша (двускатная)
     */
    private createPitchedRoof(
        width: number,
        length: number,
        height: number,
        roofHeight: number
    ): void {
        const overhang = 0.5;

        // Создаем форму профиля крыши
        const shape = new THREE.Shape();
        shape.moveTo(-overhang, 0);
        shape.lineTo(width / 2, roofHeight);
        shape.lineTo(width + overhang, 0);
        shape.closePath();

        const extrudeSettings: THREE.ExtrudeGeometryOptions = {
            depth: length + overhang * 2,
            bevelEnabled: false,
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.rotateX(-Math.PI / 2);
        geometry.rotateY(Math.PI / 2);

        const roof = new THREE.Mesh(geometry, this.roofMaterial);
        roof.position.set(0, height, -overhang);
        roof.castShadow = true;
        roof.name = 'roof';

        this.buildingGroup.add(roof);

        // Фронтоны
        this.createGables(width, length, height, roofHeight);
    }

    /**
     * Создание фронтонов
     */
    private createGables(
        width: number,
        length: number,
        height: number,
        roofHeight: number
    ): void {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(width, 0);
        shape.lineTo(width / 2, roofHeight);
        shape.closePath();

        const geometry = new THREE.ShapeGeometry(shape);

        // Передний фронтон
        const frontGable = new THREE.Mesh(geometry, this.facadeMaterial);
        frontGable.position.set(0, height, 0);
        this.buildingGroup.add(frontGable);

        // Задний фронтон
        const backGable = new THREE.Mesh(geometry, this.facadeMaterial);
        backGable.position.set(width, height, length);
        backGable.rotation.y = Math.PI;
        this.buildingGroup.add(backGable);
    }

    /**
     * Вальмовая крыша (четырехскатная)
     */
    private createHipRoof(
        width: number,
        length: number,
        height: number,
        roofHeight: number
    ): void {
        const overhang = 0.5;

        // Создаем вершины вальмовой крыши
        const vertices = new Float32Array([
            // Основание (4 угла с навесом)
            -overhang, 0, -overhang,
            width + overhang, 0, -overhang,
            width + overhang, 0, length + overhang,
            -overhang, 0, length + overhang,
            // Конек (2 точки по центру)
            width * 0.3, roofHeight, length / 2,
            width * 0.7, roofHeight, length / 2,
        ]);

        // Индексы граней
        const indices = [
            // Передний скат
            0, 1, 4,
            1, 5, 4,
            // Задний скат
            2, 3, 5,
            3, 4, 5,
            // Левый скат
            0, 4, 3,
            // Правый скат
            1, 2, 5,
        ];

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        const roof = new THREE.Mesh(geometry, this.roofMaterial);
        roof.position.y = height;
        roof.castShadow = true;
        roof.name = 'roof';

        this.buildingGroup.add(roof);
    }

    /**
     * Создание балконов
     */
    private createBalconies(dimensions: BuildingDimensions, extras: ExtrasParams): void {
        const { width, floorHeight, floorsCount } = dimensions;
        const { balconyDepth } = extras;
        const balconyWidth = 3;
        const balconyCount = Math.floor(width / (balconyWidth + 2));

        for (let floor = 1; floor < floorsCount; floor++) {
            const y = floor * floorHeight;

            for (let b = 0; b < balconyCount; b++) {
                const x = (width / (balconyCount + 1)) * (b + 1);
                this.createBalcony(x, y, -balconyDepth, balconyWidth, balconyDepth);
            }
        }
    }

    /**
     * Создание одного балкона
     */
    private createBalcony(
        x: number,
        y: number,
        z: number,
        width: number,
        depth: number
    ): void {
        const balconyGroup = new THREE.Group();

        // Плита балкона
        const plateGeometry = new THREE.BoxGeometry(width, 0.15, depth);
        const plate = new THREE.Mesh(plateGeometry, this.floorSeparatorMaterial);
        plate.position.set(0, 0, -depth / 2);
        plate.castShadow = true;
        balconyGroup.add(plate);

        // Ограждение
        const railingHeight = 1;
        const railingThickness = 0.05;

        // Боковые стойки
        const postGeometry = new THREE.BoxGeometry(railingThickness, railingHeight, railingThickness);

        [-width / 2, width / 2].forEach(px => {
            const post = new THREE.Mesh(postGeometry, this.windowFrameMaterial);
            post.position.set(px, railingHeight / 2, -depth);
            balconyGroup.add(post);
        });

        // Перила
        const railGeometry = new THREE.BoxGeometry(width, railingThickness, railingThickness);
        const rail = new THREE.Mesh(railGeometry, this.windowFrameMaterial);
        rail.position.set(0, railingHeight, -depth);
        balconyGroup.add(rail);

        // Стеклянное ограждение
        const glassGeometry = new THREE.PlaneGeometry(width - 0.1, railingHeight - 0.1);
        const glass = new THREE.Mesh(glassGeometry, this.glassMaterial);
        glass.position.set(0, railingHeight / 2, -depth);
        balconyGroup.add(glass);

        balconyGroup.position.set(x, y, z);
        balconyGroup.name = 'balcony';
        this.buildingGroup.add(balconyGroup);
    }

    /**
     * Создание входной группы
     */
    private createEntrance(dimensions: BuildingDimensions, extras: ExtrasParams): void {
        const { width, floorHeight } = dimensions;
        const { entranceWidth } = extras;
        const entranceHeight = floorHeight * 0.8;
        const entranceDepth = 2;

        const entranceGroup = new THREE.Group();

        // Козырек
        const canopyGeometry = new THREE.BoxGeometry(entranceWidth + 1, 0.2, entranceDepth + 0.5);
        const canopy = new THREE.Mesh(canopyGeometry, this.entranceMaterial);
        canopy.position.set(0, entranceHeight + 0.5, -entranceDepth / 2);
        canopy.castShadow = true;
        entranceGroup.add(canopy);

        // Колонны (для классического стиля)
        if (this.params.facade.type === 'classic') {
            const columnRadius = 0.15;
            const columnGeometry = new THREE.CylinderGeometry(
                columnRadius, columnRadius, entranceHeight + 0.5, 16
            );

            [-entranceWidth / 2, entranceWidth / 2].forEach(px => {
                const column = new THREE.Mesh(columnGeometry, this.entranceMaterial);
                column.position.set(px, (entranceHeight + 0.5) / 2, -entranceDepth);
                column.castShadow = true;
                entranceGroup.add(column);
            });
        }

        // Ступени
        const stepsCount = 3;
        const stepHeight = 0.15;
        const stepDepth = 0.3;

        for (let i = 0; i < stepsCount; i++) {
            const stepGeometry = new THREE.BoxGeometry(
                entranceWidth + 0.5 - i * 0.1,
                stepHeight,
                stepDepth
            );
            const step = new THREE.Mesh(stepGeometry, this.floorSeparatorMaterial);
            step.position.set(0, stepHeight * (i + 0.5), -entranceDepth - stepDepth * (stepsCount - i));
            step.castShadow = true;
            step.receiveShadow = true;
            entranceGroup.add(step);
        }

        // Двери
        const doorWidth = entranceWidth / 2 - 0.2;
        const doorHeight = entranceHeight * 0.9;

        [-doorWidth / 2 - 0.1, doorWidth / 2 + 0.1].forEach(px => {
            // Рама двери
            const doorFrameShape = new THREE.Shape();
            doorFrameShape.moveTo(-doorWidth / 2, 0);
            doorFrameShape.lineTo(doorWidth / 2, 0);
            doorFrameShape.lineTo(doorWidth / 2, doorHeight);
            doorFrameShape.lineTo(-doorWidth / 2, doorHeight);
            doorFrameShape.closePath();

            const innerDoor = new THREE.Path();
            const inset = 0.1;
            innerDoor.moveTo(-doorWidth / 2 + inset, inset);
            innerDoor.lineTo(doorWidth / 2 - inset, inset);
            innerDoor.lineTo(doorWidth / 2 - inset, doorHeight - inset);
            innerDoor.lineTo(-doorWidth / 2 + inset, doorHeight - inset);
            innerDoor.closePath();
            doorFrameShape.holes.push(innerDoor);

            const frameGeometry = new THREE.ExtrudeGeometry(doorFrameShape, {
                depth: 0.1,
                bevelEnabled: false,
            });

            const doorFrame = new THREE.Mesh(frameGeometry, this.windowFrameMaterial);
            doorFrame.position.set(px, 0, -0.02);
            entranceGroup.add(doorFrame);

            // Стекло двери
            const doorGlassGeometry = new THREE.PlaneGeometry(
                doorWidth - inset * 2,
                doorHeight - inset * 2
            );
            const doorGlass = new THREE.Mesh(doorGlassGeometry, this.glassMaterial);
            doorGlass.position.set(px, doorHeight / 2, 0);
            entranceGroup.add(doorGlass);
        });

        entranceGroup.position.set(width / 2, 0, 0);
        entranceGroup.name = 'entrance';
        this.buildingGroup.add(entranceGroup);
    }

    /**
     * Центрирование здания относительно начала координат
     */
    private centerBuilding(): void {
        const box = new THREE.Box3().setFromObject(this.buildingGroup);
        const center = box.getCenter(new THREE.Vector3());

        this.buildingGroup.position.x = -center.x;
        this.buildingGroup.position.z = -center.z;
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

        const totalHeight = this.params.dimensions.floorHeight * this.params.dimensions.floorsCount +
            (this.params.roof.type !== 'flat' ? this.params.roof.height : 0);

        return {
            verticesCount,
            facesCount: Math.round(facesCount),
            totalHeight,
        };
    }

    /**
     * Обновление параметров и регенерация модели
     */
    public updateParams(params: BuildingParameters): THREE.Group {
        this.params = params;
        this.initMaterials();
        return this.generate();
    }

    /**
     * Получение группы здания
     */
    public getBuilding(): THREE.Group {
        return this.buildingGroup;
    }
}
