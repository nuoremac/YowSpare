/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StoredFile } from '../models/StoredFile';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FilesService {
    /**
     * Uploader un fichier
     * Stocke un fichier et retourne ses métadonnées. Le fichier est automatiquement associé à l'organisation de l'utilisateur (via X-Tenant-ID).
     * @param formData
     * @returns StoredFile Fichier uploadé avec succès
     * @throws ApiError
     */
    public static uploadFile(
        formData?: Record<string, any>,
    ): CancelablePromise<StoredFile> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/files',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Télécharger ou afficher un fichier
     * Récupère le contenu binaire d'un fichier stocké par son ID.
     * @param id
     * @returns any Contenu du fichier
     * @throws ApiError
     */
    public static downloadFile(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/files/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Fichier non trouvé`,
            },
        });
    }
}
