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

  private SERVER_URL = environment.serverUrl;
  private CONTEXT_MONITOR = environment.contextMonitor;

  constructor(private http: HttpClient) { }

  public getHttpTraces(contextApp?: string): Observable<any> {
    return this.http.get<any>(`${this.SERVER_URL}${contextApp}${this.CONTEXT_MONITOR}/httptrace`)
  }

  public getSystemHealth(contextApp?: string): Observable<SystemHealth> {
    return this.http.get<SystemHealth>(`${this.SERVER_URL}${contextApp}${this.CONTEXT_MONITOR}/health`)
  }

  public getSystemCPU(contextApp?: string): Observable<SystemCpu> {
    return this.http.get<SystemCpu>(`${this.SERVER_URL}${contextApp}${this.CONTEXT_MONITOR}/metrics/system.cpu.count`)
  }

  public getProcessUpTime(contextApp?: string): Observable<any> {
    return this.http.get<any>(`${this.SERVER_URL}${contextApp}${this.CONTEXT_MONITOR}/metrics/process.uptime`)
  }

  public getMemoryUsed(contextApp?: string): Observable<MemoryUsed> {
    return this.http.get<MemoryUsed>(`${this.SERVER_URL}${contextApp}${this.CONTEXT_MONITOR}/metrics/jvm.memory.used`)
  }

  public getMemoryMax(contextApp?: string): Observable<MemoryMax> {
    return this.http.get<MemoryMax>(`${this.SERVER_URL}${contextApp}${this.CONTEXT_MONITOR}/metrics/jvm.memory.max`)
  }
}
