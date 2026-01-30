import { Injectable, inject } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { UploadFileService } from '../uploadFile/upload-file';

export interface StagingResult {
    originalUrl: string;
    decoratedUrl: string;
    products: SuggestedProduct[];
}

export interface SuggestedProduct {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
}

@Injectable({
    providedIn: 'root'
})
export class VirtualStagingService {
    private readonly uploadService = inject(UploadFileService);

    // Mock data for development
    private readonly MOCK_RESULT: StagingResult = {
        originalUrl: 'assets/mock/original-room.jpg',
        decoratedUrl: 'https://storage.googleapis.com/itera-484104.firebasestorage.app/products/mock-decorated.jpg',
        products: [
            {
                id: '1',
                name: 'Sillón Nórdico',
                price: 1299,
                imageUrl: 'https://storage.googleapis.com/itera-484104.firebasestorage.app/products/chair.jpg'
            },
            {
                id: '2',
                name: 'Lámpara de Pie',
                price: 450,
                imageUrl: 'https://storage.googleapis.com/itera-484104.firebasestorage.app/products/lamp.jpg'
            },
            {
                id: '3',
                name: 'Mesa de Centro',
                price: 890,
                imageUrl: 'https://storage.googleapis.com/itera-484104.firebasestorage.app/products/table.jpg'
            }
        ]
    };

    /**
     * Uploads an image and triggers the staging process.
     * @param file The file to upload
     */
    uploadAndStage(file: File): Observable<{ key: string, url: string }> {
        return this.uploadService.uploadFile(file, 'virtual-staging/uploads');
    }

    /**
     * Gets the staging result.
     * @param key The key returned from upload
     */
    getStagingResult(key: string): Observable<StagingResult> {
        return of({
            ...this.MOCK_RESULT,
            originalUrl: `https://storage.googleapis.com/itera-484104.firebasestorage.app/${key}`
        }).pipe(delay(3000));
    }
}
