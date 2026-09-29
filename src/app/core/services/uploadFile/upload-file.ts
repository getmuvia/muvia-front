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

export type PublicUploadPurpose =
  | 'profile_image'
  | 'product_image'
  | 'product_model';

interface SignedUploadResponse {
  url: string;
  key: string;
}

interface SignedPostPolicyResponse extends SignedUploadResponse {
  fields: Record<string, string>;
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

  /** Requests an owner-scoped URL and uploads directly to Cloud Storage. */
  uploadFile(
    file: File,
    purpose: PublicUploadPurpose,
    errorFeedback: HttpErrorFeedback = 'global',
  ): Observable<UploadResponse> {
    const contentType = this.getContentType(file);
    const context = this.createErrorContext(errorFeedback);
    return this.http.post<SignedPostPolicyResponse>(
      this.apiUrl,
      { purpose, contentType, fileSize: file.size },
      { context },
    ).pipe(
      switchMap(policy => {
        const form = new FormData();
        Object.entries(policy.fields).forEach(([name, value]) => form.append(name, value));
        form.append('file', file, file.name);
        return this.http.post(policy.url, form, { context, responseType: 'text' }).pipe(
          map(() => policy.key),
        );
      }),
      switchMap(key => this.http.post<UploadResponse>(
        `${API_ENDPOINTS.FILES.BASE}/finalize`,
        { key },
        { context },
      )),
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
    return this.uploadToSignedUrl(
      file,
      requestUrl,
      { filename: file.name, contentType: this.getContentType(file) },
      errorFeedback,
    );
  }

  private uploadToSignedUrl(
    file: File,
    requestUrl: string,
    body: { contentType: string; filename: string } | {
      contentType: string;
      purpose: PublicUploadPurpose;
      fileSize: number;
    },
    errorFeedback: HttpErrorFeedback = 'global',
  ): Observable<PrivateUploadResponse> {
    const context = this.createErrorContext(errorFeedback);

    return this.http.post<SignedUploadResponse>(requestUrl, body, { context }).pipe(
      switchMap(response => this.http.put(response.url, file, {
        context,
        headers: { 'Content-Type': body.contentType }
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
    const ext = file.name.toLowerCase().split('.').pop() || '';
    if (MIME_TYPE_MAP[ext]) {
      return MIME_TYPE_MAP[ext];
    }
    if (file.type) {
      return file.type;
    }

    return 'application/octet-stream';
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
