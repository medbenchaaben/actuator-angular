import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { SystemHealth } from '../interfaces/system-health';
import { SystemCpu } from '../interfaces/system-cpu';
import { MemoryMax, MemoryUsed } from '../interfaces/memory-management';

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {

  constructor(private http: HttpClient) { }

  public getHttpTraces(monitoringUrl: string): Observable<any> {
    return this.http.get<any>(`${monitoringUrl}/httptrace`)
  }

  public getSystemHealth(monitoringUrl: string): Observable<SystemHealth> {
    return this.http.get<SystemHealth>(`${monitoringUrl}/health`)
  }

  public getSystemCPU(monitoringUrl: string): Observable<SystemCpu> {
    return this.http.get<SystemCpu>(`${monitoringUrl}/metrics/system.cpu.count`)
  }

  public getProcessUpTime(monitoringUrl: string): Observable<any> {
    return this.http.get<any>(`${monitoringUrl}/metrics/process.uptime`)
  }

  public getMemoryUsed(monitoringUrl: string): Observable<MemoryUsed> {
    return this.http.get<MemoryUsed>(`${monitoringUrl}/metrics/jvm.memory.used`)
  }

  public getMemoryMax(monitoringUrl: string): Observable<MemoryMax> {
    return this.http.get<MemoryMax>(`${monitoringUrl}/metrics/jvm.memory.max`)
  }
}
