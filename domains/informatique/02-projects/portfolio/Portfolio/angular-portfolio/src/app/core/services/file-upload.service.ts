import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpProgressEvent } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap, filter } from 'rxjs/operators';

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileUploadResponse {
  id: number;
  filename: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description: string;
  uploaded_at: string;
  uploaded_by: string;
  project_id: number;
  company_id: number;
  contact_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private baseUrl = 'http://localhost:8000/api/files';
  private uploadProgressSubject = new BehaviorSubject<FileUploadProgress>({ loaded: 0, total: 0, percentage: 0 });
  
  public uploadProgress$ = this.uploadProgressSubject.asObservable();

  constructor(private http: HttpClient) {}

  uploadFile(
    file: File, 
    projectId?: number, 
    companyId?: number, 
    contactId?: number, 
    description?: string
  ): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (projectId) formData.append('project_id', projectId.toString());
    if (companyId) formData.append('company_id', companyId.toString());
    if (contactId) formData.append('contact_id', contactId.toString());
    if (description) formData.append('description', description);

    return this.http.post<FileUploadResponse>(`${this.baseUrl}/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<FileUploadResponse>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            if (event.total) {
              const progress: FileUploadProgress = {
                loaded: event.loaded,
                total: event.total,
                percentage: Math.round((event.loaded / event.total) * 100)
              };
              this.uploadProgressSubject.next(progress);
            }
            return null;
          case HttpEventType.Response:
            this.uploadProgressSubject.next({ loaded: 0, total: 0, percentage: 0 });
            return event.body!;
          default:
            return null;
        }
      }),
      filter((result): result is FileUploadResponse => result !== null),
      tap(result => {
        console.log('File uploaded successfully:', result);
      })
    );
  }

  downloadFile(documentId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download/${documentId}`, {
      responseType: 'blob'
    });
  }

  deleteFile(documentId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${documentId}`);
  }

  getFileSizeString(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(fileType: string): string {
    switch (fileType) {
      case 'pdf':
        return '📄';
      case 'document':
        return '📝';
      case 'spreadsheet':
        return '📊';
      case 'presentation':
        return '📽️';
      case 'image':
        return '🖼️';
      case 'archive':
        return '📦';
      default:
        return '📁';
    }
  }

  isImageFile(fileType: string): boolean {
    return fileType === 'image';
  }

  isPdfFile(fileType: string): boolean {
    return fileType === 'pdf';
  }
}
