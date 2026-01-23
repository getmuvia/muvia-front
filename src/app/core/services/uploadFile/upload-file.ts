import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, switchMap } from 'rxjs';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';

export interface UploadResponse {
  url: string;
  key: string;
}

/**
 * MIME type map for files that browsers don't natively recognize.
 * Includes 3D model formats used for AR/VR.
 */
const MIME_TYPE_MAP: Record<string, string> = {
  'glb': 'model/gltf-binary',
  'gltf': 'model/gltf+json',
  'usdz': 'model/vnd.usdz+zip',
};

@Injectable({
  providedIn: 'root',
})
export class UploadFileService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = API_ENDPOINTS.FILES.UPLOAD;
  private readonly storageFirebaseUrl = API_ENDPOINTS.STORAGE.GOOGLE_CLOUD_BASE_URL;

  /**
   * Upload a file to the server.
   * @param file The file to upload
   * @param folder The folder path (e.g. 'products/{userId}')
   */
  uploadFile(file: File, folder: string): Observable<UploadResponse> {
    const contentType = this.getContentType(file);

    const body = {
      filename: file.name,
      contentType
    };

    const requestUrl = `${this.apiUrl}?folder=${folder}`;

    return this.http.post<UploadResponse>(requestUrl, body).pipe(
      switchMap(response => {

        return this.http.put(response.url, file, {
          headers: {
            'Content-Type': contentType
          }
        }
        ).pipe(
          map(() => {
            return {
              key: response.key,
              url: `${this.storageFirebaseUrl}/${response.key}`
            };
          })
        );
      })
    );
  }

  /**
   * Gets the content-type for a file.
   * If the browser doesn't recognize the type (file.type is empty), 
   * it detects it by file extension.
   */
  private getContentType(file: File): string {
    if (file.type) {
      return file.type;
    }

    const ext = file.name.toLowerCase().split('.').pop() || '';
    return MIME_TYPE_MAP[ext] || 'application/octet-stream';
  }
}
