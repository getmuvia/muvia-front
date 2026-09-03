import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, tap } from 'rxjs';
import { UploadFileService } from '../uploadFile/upload-file';
import {
    VirtualStagingQuota,
    VirtualStagingRequest,
    VirtualStagingResponse,
} from '../../models/ai/virtual-staging.models';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';

@Injectable({
    providedIn: 'root'
})
export class VirtualStagingService {
    private readonly http = inject(HttpClient);
    private readonly uploadService = inject(UploadFileService);

    private readonly _currentResult = signal<VirtualStagingResponse | null>(null);
    readonly currentResult = this._currentResult.asReadonly();

    private readonly _originalImageUrl = signal<string | null>(null);
    readonly originalImageUrl = this._originalImageUrl.asReadonly();

    private readonly _quota = signal<VirtualStagingQuota | null>(null);
    readonly quota = this._quota.asReadonly();

    getQuota(): Observable<VirtualStagingQuota> {
        return this.http
            .get<VirtualStagingQuota>(`${API_ENDPOINTS.AI.VIRTUAL_STAGING}/quota`)
            .pipe(tap(quota => this._quota.set(quota)));
    }

    /**
     * Uploads the room image and triggers the AI analysis.
     * @param file The room image file
     */
    generateStagedRoom(file: File, productId: string): Observable<VirtualStagingResponse> {
        const uploadFolder = 'virtual-staging/uploads';

        return this.uploadService.uploadFile(file, uploadFolder).pipe(
            tap(uploadResponse => {
                this._originalImageUrl.set(uploadResponse.url);
            }),
            switchMap(uploadResponse => {
                const requestBody: VirtualStagingRequest = {
                    imageKey: uploadResponse.key,
                    productId,
                    preferredStyle: 'modern',
                };

                return this.http.post<VirtualStagingResponse>(`${API_ENDPOINTS.AI.VIRTUAL_STAGING}`, requestBody);
            }),
            tap(response => {
                this._currentResult.set(response);
                this._quota.set(response.quota);
            })
        );
    }

    /**
     * Clears the current state.
     */
    clearState(): void {
        this._currentResult.set(null);
        this._originalImageUrl.set(null);
    }
}
