/**
 * API клиент для взаимодействия с Django backend
 *
 * Предоставляет методы для работы с REST API:
 * - Авторизация и регистрация
 * - CRUD операции с проектами
 * - Загрузка экспортированных моделей
 *
 * @module ApiClient
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { BuildingParameters, ProjectData } from '../types/building';

// Интерфейсы для API ответов
interface AuthTokens {
    access: string;
    refresh: string;
}

interface UserProfile {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    full_name: string;
    organization: string;
    position: string;
    projects_count: number;
}

interface ProjectResponse {
    id: string;
    name: string;
    description: string;
    preview_image: string | null;
    owner_name: string;
    is_public: boolean;
    tags: string;
    parameters: {
        threejs_params: BuildingParameters;
    };
    exported_models: ExportedModel[];
    created_at: string;
    updated_at: string;
}

interface ExportedModel {
    id: string;
    format: string;
    file_url: string;
    material_file_url: string | null;
    file_size_mb: number;
    vertices_count: number;
    faces_count: number;
    created_at: string;
}

/**
 * Класс API клиента
 */
export class ApiClient {
    private api: AxiosInstance;
    private accessToken: string | null = null;
    private refreshToken: string | null = null;

    constructor(baseURL: string = '/api') {
        this.api = axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Загружаем токены из localStorage
        this.loadTokens();

        // Интерцептор для добавления токена авторизации
        this.api.interceptors.request.use(
            (config) => {
                if (this.accessToken) {
                    config.headers.Authorization = `Bearer ${this.accessToken}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Интерцептор для обновления токена при 401 ошибке
        this.api.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config;

                if (error.response?.status === 401 && this.refreshToken) {
                    try {
                        const tokens = await this.refreshAccessToken();
                        if (tokens && originalRequest) {
                            originalRequest.headers.Authorization = `Bearer ${tokens.access}`;
                            return this.api(originalRequest);
                        }
                    } catch {
                        this.logout();
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    // ==================== Аутентификация ====================

    /**
     * Регистрация нового пользователя
     */
    async register(data: {
        email: string;
        username: string;
        password: string;
        password_confirm: string;
        first_name?: string;
        last_name?: string;
        organization?: string;
    }): Promise<{ user: UserProfile; tokens: AuthTokens }> {
        const response = await this.api.post('/auth/register/', data);
        this.setTokens(response.data.tokens);
        return response.data;
    }

    /**
     * Вход в систему
     */
    async login(email: string, password: string): Promise<AuthTokens> {
        const response = await this.api.post('/auth/login/', { email, password });
        this.setTokens(response.data);
        return response.data;
    }

    /**
     * Выход из системы
     */
    async logout(): Promise<void> {
        if (this.refreshToken) {
            try {
                await this.api.post('/auth/logout/', { refresh: this.refreshToken });
            } catch {
                // Игнорируем ошибки при выходе
            }
        }
        this.clearTokens();
    }

    /**
     * Обновление access токена
     */
    private async refreshAccessToken(): Promise<AuthTokens | null> {
        if (!this.refreshToken) return null;

        try {
            const response = await this.api.post('/auth/token/refresh/', {
                refresh: this.refreshToken,
            });
            this.setTokens(response.data);
            return response.data;
        } catch {
            return null;
        }
    }

    /**
     * Получение профиля пользователя
     */
    async getProfile(): Promise<UserProfile> {
        const response = await this.api.get('/auth/profile/');
        return response.data;
    }

    /**
     * Обновление профиля
     */
    async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
        const response = await this.api.patch('/auth/profile/', data);
        return response.data;
    }

    // ==================== Проекты ====================

    /**
     * Получение списка проектов пользователя
     */
    async getProjects(params?: {
        search?: string;
        ordering?: string;
        page?: number;
    }): Promise<{ count: number; results: ProjectResponse[] }> {
        const response = await this.api.get('/projects/', { params });
        return response.data;
    }

    /**
     * Получение публичных проектов
     */
    async getPublicProjects(params?: {
        search?: string;
        ordering?: string;
        page?: number;
    }): Promise<{ count: number; results: ProjectResponse[] }> {
        const response = await this.api.get('/projects/public/', { params });
        return response.data;
    }

    /**
     * Создание нового проекта
     */
    async createProject(data: {
        name: string;
        description?: string;
        is_public?: boolean;
        tags?: string;
        parameters?: Partial<BuildingParameters>;
    }): Promise<ProjectResponse> {
        const response = await this.api.post('/projects/', data);
        return response.data;
    }

    /**
     * Получение проекта по ID
     */
    async getProject(id: string): Promise<ProjectResponse> {
        const response = await this.api.get(`/projects/${id}/`);
        return response.data;
    }

    /**
     * Обновление проекта
     */
    async updateProject(
        id: string,
        data: Partial<ProjectData>
    ): Promise<ProjectResponse> {
        const response = await this.api.patch(`/projects/${id}/`, data);
        return response.data;
    }

    /**
     * Удаление проекта
     */
    async deleteProject(id: string): Promise<void> {
        await this.api.delete(`/projects/${id}/`);
    }

    /**
     * Обновление параметров здания
     */
    async updateBuildingParameters(
        projectId: string,
        parameters: Partial<BuildingParameters>
    ): Promise<BuildingParameters> {
        // Преобразуем параметры из формата Three.js в формат Django
        const flatParams: Record<string, unknown> = {};

        if (parameters.dimensions) {
            flatParams.width = parameters.dimensions.width;
            flatParams.length = parameters.dimensions.length;
            flatParams.floor_height = parameters.dimensions.floorHeight;
            flatParams.floors_count = parameters.dimensions.floorsCount;
        }

        if (parameters.facade) {
            flatParams.facade_type = parameters.facade.type;
            flatParams.facade_color = parameters.facade.color;
        }

        if (parameters.windows) {
            flatParams.window_style = parameters.windows.style;
            flatParams.window_width = parameters.windows.width;
            flatParams.window_height = parameters.windows.height;
            flatParams.windows_per_floor = parameters.windows.perFloor;
            flatParams.window_color = parameters.windows.frameColor;
            flatParams.glass_color = parameters.windows.glassColor;
            flatParams.glass_opacity = parameters.windows.glassOpacity;
        }

        if (parameters.roof) {
            flatParams.roof_type = parameters.roof.type;
            flatParams.roof_color = parameters.roof.color;
            flatParams.roof_height = parameters.roof.height;
        }

        if (parameters.extras) {
            flatParams.has_balconies = parameters.extras.hasBalconies;
            flatParams.balcony_depth = parameters.extras.balconyDepth;
            flatParams.has_entrance = parameters.extras.hasEntrance;
            flatParams.entrance_width = parameters.extras.entranceWidth;
        }

        const response = await this.api.patch(
            `/projects/${projectId}/parameters/`,
            flatParams
        );
        return response.data.threejs_params;
    }

    /**
     * Получение параметров в формате Three.js
     */
    async getThreeJSParams(projectId: string): Promise<BuildingParameters> {
        const response = await this.api.get(`/projects/${projectId}/threejs-params/`);
        return response.data;
    }

    // ==================== Экспорт ====================

    /**
     * Загрузка экспортированной модели
     */
    async uploadExport(
        projectId: string,
        data: {
            format: 'obj' | 'gltf' | 'glb';
            file: Blob;
            materialFile?: Blob;
            verticesCount: number;
            facesCount: number;
        }
    ): Promise<ExportedModel> {
        const formData = new FormData();
        formData.append('format', data.format);
        formData.append('file', data.file, `model.${data.format}`);
        if (data.materialFile) {
            formData.append('material_file', data.materialFile, 'model.mtl');
        }
        formData.append('vertices_count', data.verticesCount.toString());
        formData.append('faces_count', data.facesCount.toString());

        const response = await this.api.post(
            `/projects/${projectId}/export/`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    }

    /**
     * Получение списка экспортов проекта
     */
    async getExports(projectId: string): Promise<ExportedModel[]> {
        const response = await this.api.get(`/projects/${projectId}/exports/`);
        return response.data;
    }

    /**
     * Удаление экспорта
     */
    async deleteExport(exportId: string): Promise<void> {
        await this.api.delete(`/projects/exports/${exportId}/`);
    }

    // ==================== Утилиты ====================

    /**
     * Сохранение токенов
     */
    private setTokens(tokens: AuthTokens): void {
        this.accessToken = tokens.access;
        this.refreshToken = tokens.refresh;
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
    }

    /**
     * Загрузка токенов из localStorage
     */
    private loadTokens(): void {
        this.accessToken = localStorage.getItem('access_token');
        this.refreshToken = localStorage.getItem('refresh_token');
    }

    /**
     * Очистка токенов
     */
    private clearTokens(): void {
        this.accessToken = null;
        this.refreshToken = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }

    /**
     * Проверка авторизации
     */
    isAuthenticated(): boolean {
        return !!this.accessToken;
    }

    /**
     * Получение access токена
     */
    getAccessToken(): string | null {
        return this.accessToken;
    }
}

// Singleton экземпляр
export const apiClient = new ApiClient();
