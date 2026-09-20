import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, switchMap } from 'rxjs';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import {
  createHttpErrorFeedbackContext,
  HttpErrorFeedback,
} from '@core/models/errors/http-error-feedback';

export interface UploadResponse {
  url: string;
  key: string;
}

export interface PrivateUploadResponse {
  key: string;
}

interface SignedUploadResponse {
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
  uploadFile(
    file: File,
    folder: string,
    errorFeedback: HttpErrorFeedback = 'global',
  ): Observable<UploadResponse> {
    const requestUrl = `${this.apiUrl}?folder=${folder}`;

    return this.uploadToSignedUrl(file, requestUrl, errorFeedback).pipe(
      map(response => ({
        key: response.key,
        url: `${this.storageFirebaseUrl}/${response.key}`
      }))
    );
  }

  /** Removes a previously uploaded file, primarily for draft rollback. */
  deleteFile(
    key: string,
    errorFeedback: HttpErrorFeedback = 'none',
  ): Observable<void> {
    return this.http.delete<void>(
      `${API_ENDPOINTS.FILES.BASE}/${encodeURIComponent(key)}`,
      { context: this.createErrorContext(errorFeedback) },
    );
  }

  /** Uploads a file without creating or exposing a public storage URL. */
  uploadPrivateFile(
    file: File,
    requestUrl: string,
    errorFeedback: HttpErrorFeedback = 'global',
  ): Observable<PrivateUploadResponse> {
    return this.uploadToSignedUrl(file, requestUrl, errorFeedback);
  }

  private uploadToSignedUrl(
    file: File,
    requestUrl: string,
    errorFeedback: HttpErrorFeedback = 'global',
  ): Observable<PrivateUploadResponse> {
    const contentType = this.getContentType(file);
    const body = { filename: file.name, contentType };
    const context = this.createErrorContext(errorFeedback);

    return this.http.post<SignedUploadResponse>(requestUrl, body, { context }).pipe(
      switchMap(response => this.http.put(response.url, file, {
        context,
        headers: { 'Content-Type': contentType }
      }).pipe(
        map(() => ({ key: response.key }))
      ))
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

  private createErrorContext(feedback: HttpErrorFeedback) {
    return createHttpErrorFeedbackContext(
      feedback,
      {
        expectedStatuses: feedback === 'none' ? [404] : feedback === 'local' ? [400, 422] : [],
      },
    );
  }
}
