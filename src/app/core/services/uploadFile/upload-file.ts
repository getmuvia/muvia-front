import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable, switchMap } from 'rxjs';
import { Auth } from '@core/auth/services/auth';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';

export interface UploadResponse {
  url: string;
  key: string;
}

@Injectable({
  providedIn: 'root',
})
export class UploadFile {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);

  private readonly apiUrl = API_ENDPOINTS.FILES.UPLOAD;
  private readonly storageFirebaseUrl = API_ENDPOINTS.STORAGE.GOOGLE_CLOUD_BASE_URL;

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

    const body = {
      filename: file.name,
      contentType: file.type
    };

    const requestUrl = `${this.apiUrl}?folder=${folder}`;

    return this.http.post<UploadResponse>(requestUrl, body, {
      headers: this.getAuthHeaders()
    }).pipe(
      switchMap(response => {

        return this.http.put(response.url, file, {
          headers: {
            'Content-Type': file.type
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
}
