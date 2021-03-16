import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Application } from '../interfaces/application';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {

  private apiServerUrl = environment.serverManageUrl;

  constructor(private http: HttpClient) { }

  public getAllApplications(): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.apiServerUrl}`)
  }

  public getApplication(id: number): Observable<Application> {
    return this.http.get<Application>(`${this.apiServerUrl}/${id}`)
  }

  public addApplication(application: Application): Observable<Application> {
    return this.http.post<Application>(`${this.apiServerUrl}`, application)
  }

  public updateApplication(application?: Application): Observable<Application> {
    return this.http.put<Application>(`${this.apiServerUrl}`, application)
  }

  public deleteApplication(id?: number): Observable<void> {
    return this.http.delete<void>(`${this.apiServerUrl}/${id}`)
  }
}
