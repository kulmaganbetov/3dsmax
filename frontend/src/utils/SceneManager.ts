/**
 * Менеджер 3D-сцены
 *
 * Управляет рендерингом, камерой, освещением и интерактивностью
 * 3D-сцены в Three.js.
 *
 * @module SceneManager
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Класс для управления 3D-сценой
 */
export class SceneManager {
    private container: HTMLElement;
    private canvas: HTMLCanvasElement;

    // Three.js объекты
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    public controls: OrbitControls;

    // Освещение
    private ambientLight: THREE.AmbientLight;
    private directionalLight: THREE.DirectionalLight;
    private hemisphereLight: THREE.HemisphereLight;

    // Вспомогательные объекты
    private gridHelper: THREE.GridHelper;
    private axesHelper: THREE.AxesHelper;

    // Анимация
    private animationId: number = 0;
    private isRunning: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.container = canvas.parentElement!;

        // Инициализация сцены
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        // Инициализация камеры
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this.camera.position.set(40, 30, 40);

        // Инициализация рендерера
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        // Инициализация управления камерой
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 200;
        this.controls.maxPolarAngle = Math.PI / 2;

        // Инициализация освещения
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(this.ambientLight);

        this.hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x8b4513, 0.3);
        this.scene.add(this.hemisphereLight);

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        this.directionalLight.position.set(50, 100, 50);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 500;
        this.directionalLight.shadow.camera.left = -100;
        this.directionalLight.shadow.camera.right = 100;
        this.directionalLight.shadow.camera.top = 100;
        this.directionalLight.shadow.camera.bottom = -100;
        this.scene.add(this.directionalLight);

        // Добавляем второй направленный свет для заполнения теней
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-30, 50, -30);
        this.scene.add(fillLight);

        // Сетка
        this.gridHelper = new THREE.GridHelper(100, 50, 0x444444, 0x222222);
        this.scene.add(this.gridHelper);

        // Оси координат
        this.axesHelper = new THREE.AxesHelper(10);
        this.scene.add(this.axesHelper);

        // Плоскость земли (для теней)
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.ShadowMaterial({
            opacity: 0.3,
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.01;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Обработчик изменения размера окна
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    /**
     * Запуск рендеринга
     */
    public start(): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }

    /**
     * Остановка рендеринга
     */
    public stop(): void {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    /**
     * Цикл анимации
     */
    private animate(): void {
        if (!this.isRunning) return;

        this.animationId = requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Обработка изменения размера окна
     */
    private onWindowResize(): void {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    /**
     * Добавление объекта на сцену
     */
    public addObject(object: THREE.Object3D): void {
        this.scene.add(object);
    }

    /**
     * Удаление объекта со сцены
     */
    public removeObject(object: THREE.Object3D): void {
        this.scene.remove(object);
    }

    /**
     * Очистка сцены (удаление всех объектов кроме света и хелперов)
     */
    public clearScene(): void {
        const objectsToRemove: THREE.Object3D[] = [];

        this.scene.traverse((object) => {
            if (
                object instanceof THREE.Mesh &&
                object !== this.gridHelper &&
                !(object.material instanceof THREE.ShadowMaterial)
            ) {
                objectsToRemove.push(object);
            }
            if (object instanceof THREE.Group) {
                objectsToRemove.push(object);
            }
        });

        objectsToRemove.forEach((object) => {
            this.scene.remove(object);
        });
    }

    /**
     * Сброс камеры в начальное положение
     */
    public resetCamera(): void {
        this.camera.position.set(40, 30, 40);
        this.controls.target.set(0, 10, 0);
        this.controls.update();
    }

    /**
     * Вид сверху
     */
    public setTopView(): void {
        this.camera.position.set(0, 80, 0);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    /**
     * Вид спереди
     */
    public setFrontView(): void {
        this.camera.position.set(0, 15, 60);
        this.controls.target.set(0, 15, 0);
        this.controls.update();
    }

    /**
     * Фокусировка камеры на объекте
     */
    public focusOnObject(object: THREE.Object3D): void {
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        const distance = maxDim / (2 * Math.tan(fov / 2));

        this.camera.position.set(
            center.x + distance * 0.8,
            center.y + distance * 0.5,
            center.z + distance * 0.8
        );
        this.controls.target.copy(center);
        this.controls.update();
    }

    /**
     * Переключение отображения сетки
     */
    public toggleGrid(visible: boolean): void {
        this.gridHelper.visible = visible;
    }

    /**
     * Переключение отображения осей
     */
    public toggleAxes(visible: boolean): void {
        this.axesHelper.visible = visible;
    }

    /**
     * Создание скриншота сцены
     */
    public takeScreenshot(): string {
        this.renderer.render(this.scene, this.camera);
        return this.canvas.toDataURL('image/png');
    }

    /**
     * Получение ссылки на сцену
     */
    public getScene(): THREE.Scene {
        return this.scene;
    }

    /**
     * Уничтожение менеджера
     */
    public dispose(): void {
        this.stop();
        window.removeEventListener('resize', this.onWindowResize.bind(this));
        this.controls.dispose();
        this.renderer.dispose();
    }
}
