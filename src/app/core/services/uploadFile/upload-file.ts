import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Auth } from '@core/auth/services/auth';

export interface UploadResponse {
  url: string;
  key: string;
  size: number;
  contentType: string;
  metadata: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root',
})
export class UploadFile {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  // Assuming the upload endpoint is under /files/upload based on the curl example
  private readonly apiUrl = `${environment.apiUrl.replace('/api', '')}/files/upload`;

  private getAuthHeaders(): HttpHeaders {
    const token = this.auth.getAccessToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Upload a file to the server.
   * @param file The file to upload
   * @param folder The folder path (e.g. 'products/{userId}')
   */
  uploadFile(file: File, folder: string): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // Append folder as query param as requested
    const url = `${this.apiUrl}?folder=${folder}`;

    return this.http.post<UploadResponse>(url, formData, {
      headers: this.getAuthHeaders()
    });
  }
}
