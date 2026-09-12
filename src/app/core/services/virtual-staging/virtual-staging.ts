import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, switchMap, tap, throwError } from 'rxjs';
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
        this.replaceOriginalImage(file);

        return this.uploadService.uploadPrivateFile(file, API_ENDPOINTS.AI.VIRTUAL_STAGING_UPLOAD).pipe(
            switchMap(uploadResponse => {
                const requestBody: VirtualStagingRequest = {
                    gcsStorageKey: uploadResponse.key,
                    productId,
                    preferredStyle: 'modern',
                };

                return this.http.post<VirtualStagingResponse>(`${API_ENDPOINTS.AI.VIRTUAL_STAGING}`, requestBody);
            }),
            tap(response => {
                this._currentResult.set(response);
                this._quota.set(response.quota);
            }),
            catchError(error => {
                this.clearOriginalImage();
                return throwError(() => error);
            }),
        );
    }

    /**
     * Clears the current state.
     */
    clearState(): void {
        this._currentResult.set(null);
        this.clearOriginalImage();
    }

    private replaceOriginalImage(file: File): void {
        this.clearOriginalImage();
        this._originalImageUrl.set(URL.createObjectURL(file));
    }

    private clearOriginalImage(): void {
        const currentUrl = this._originalImageUrl();
        if (currentUrl) {
            URL.revokeObjectURL(currentUrl);
        }
        this._originalImageUrl.set(null);
    }
}
