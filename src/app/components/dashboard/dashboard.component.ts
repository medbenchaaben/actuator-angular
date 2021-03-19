import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, NgZone } from '@angular/core';
import { SystemCpu } from 'src/app/interfaces/system-cpu';
import { SystemHealth } from 'src/app/interfaces/system-health';
import { AdminDashboardService } from 'src/app/services/admin-dashboard.service';
import * as Chart from 'chart.js';
import { ChartType } from 'src/app/enums/chart-type';
import { HealthStatus } from 'src/app/enums/health-status';
import { MemoryManagement, MemoryMax, MemoryUsed } from 'src/app/interfaces/memory-management';
import { Application } from 'src/app/interfaces/application';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  traceList: any[] = [];
  selectedTrace: any;
  systemHealth: SystemHealth | undefined = undefined;
  processUpTime: string = '';
  http200Traces: any[] = [];
  http400Traces: any[] = [];
  http404Traces: any[] = [];
  http500Traces: any[] = [];
  httpDefaultTraces: any[] = [];
  errorMessage: string | undefined = undefined;
  processors: number = 0;
  freeDiskSpace: string = '';
  upTimestamp: number = 0;
  pageSize: number = 10;
  page: number = 1;
  upTimeInterval: any  = undefined;
  isIntervalStopped: boolean = false;
  memoryManagement: MemoryManagement | undefined = undefined;
  application: Application = history.state.data;

  constructor(private dashboardService: AdminDashboardService,
              private router: Router,
              private ngZone: NgZone) { }

  ngOnInit(): void {
    this.getCpuUsage();
    this.getSystemHealthInit();
    this.getMemoryManagement();
    this.getTraces();
  }

  private getMemoryManagement() {
    this.dashboardService.getMemoryUsed(this.application.monitoringUrl).subscribe(
      (responseUsed: MemoryUsed) => {
        this.dashboardService.getMemoryMax(this.application.monitoringUrl).subscribe(
          (responseMax: MemoryMax) => {
            this.clearErrorMessage();
            this.memoryManagement = {memoryUsed: responseUsed, memoryMax: responseMax}
            this.initializeMemoryBarChart();
          }
        )
      },
      (error: HttpErrorResponse) => {
        this.setErrorMessage(error);
      }
    )
  }

  private initializeDoughnutChart() {
    const canvas = document.querySelector('#doughnutChart') as HTMLCanvasElement;
    return new Chart(canvas, {
      type: ChartType.DOUGHNUT,
      data: {
        labels: ['Disk Used', 'Free disk', 'Treshold'],
        datasets: [{data: [this.convertBytesToGigaBytes((this.systemHealth!.components!.diskSpace.details.total - this.systemHealth!.components!.diskSpace.details.free)),
                            this.convertBytesToGigaBytes(this.systemHealth!.components!.diskSpace.details.free),
                            this.convertBytesToGigaBytes(this.systemHealth!.components!.diskSpace.details.threshold)],
                            backgroundColor: ['rgb(253,126,20)', 'rgb(40,167,69)', 'rgb(220,53,69)'],
                            borderColor: ['rgb(253,126,20)', 'rgb(40,167,69)', 'rgb(220,53,69)'],
                          }]
      },
      options: {
        title: { display: true, text: [`Disk Details in GB`] },
        legend: { display: true },
      }
    })
  }

  private initializeMemoryBarChart() {
    const canvas = document.querySelector('#horizontalBarChart') as HTMLCanvasElement;
    return new Chart(canvas, {
      type: ChartType.HORIZONTAL_BAR,
      data: {
        labels: ['Memory Max', 'Memory Used'],
        datasets:[{data: [this.convertBytesToGigaBytes(this.memoryManagement!.memoryMax.measurements[0].value),
                          this.convertBytesToGigaBytes(this.memoryManagement!.memoryUsed.measurements[0].value)],
                          backgroundColor: ['rgb(253,126,20)', 'rgb(40,167,69)'],
                          borderColor: ['rgb(253,126,20)', 'rgb(40,167,69)'],
                        }]
      },
      options: {
        title: { display: true, text: [`Memory in GB`] },
        legend: { display: false }
      }
    })
  }

  private initializePieChart() {
    const canvas = document.querySelector('#pieChart') as HTMLCanvasElement;
    return new Chart(canvas, {
      type: ChartType.PIE,
      data: {
        labels: ['2XX', '404', '4XX', '5XX'],
        datasets: [{ data: [this.http200Traces.length, this.http404Traces.length, this.http400Traces.length, this.http500Traces.length],
        backgroundColor: ['rgb(40,167,69)', 'rgb(0,123,255)', 'rgb(253,126,20)', 'rgb(220,53,69)'],
        borderColor: ['rgb(40,167,69)', 'rgb(0,123,255)', 'rgb(253,126,20)', 'rgb(220,53,69)'],
        borderWidth: 3
        }]
      },
      options: {
        title: { display: true, text: [`Last 100 Requests as of ${this.formatDate(new Date())}`] },
        legend: { display: true },
      }
    });
  }

  private initializeBarChart() {
    const canvas = document.querySelector('#barChart') as HTMLCanvasElement;
    return new Chart(canvas, {
      type: ChartType.BAR,
      data: {
        labels: ['2XX', '404', '4XX', '5XX'],
        datasets: [{ data: [this.http200Traces.length, this.http404Traces.length, this.http400Traces.length, this.http500Traces.length],
        backgroundColor: ['rgb(40,167,69)', 'rgb(0,123,255)', 'rgb(253,126,20)', 'rgb(220,53,69)'],
        borderColor: ['rgb(40,167,69)', 'rgb(0,123,255)', 'rgb(253,126,20)', 'rgb(220,53,69)'],
        borderWidth: 3
        }]
      },
      options: {
        title: { display: true, text: [`Last 100 Requests as of ${this.formatDate(new Date())}`] },
        legend: { display: false },
        scales: {
          yAxes: [{ticks: {beginAtZero: true}}]
        }
      }
    })
  }

  exportTableToExcel() {
    const downloadLink = document.createElement('a');
    const dataType = 'application/vnd.ms-excel';
    const table = document.querySelector('#httptrace-table') as HTMLTableElement;
    const tableHtml = table.outerHTML.replace(/ /g,'%20');
    document.body.appendChild(downloadLink);
    downloadLink.href = `data:${dataType} ${tableHtml}`;
    downloadLink.download = 'httptrace.xls';
    downloadLink.click();
  }

  private formatDate(date: Date): string {
    const dd = date.getDate();
    const mm = date.getMonth() + 1;
    const year = date.getFullYear();
    if (dd < 10) {
      const day = `0${dd}`;
    }
    if (mm < 10) {
      const month = `0${mm}`;
    }
    return `${dd}/${mm}/${year}`;
  }

  public onRefreshData(): void {
    this.http200Traces = [];
    this.http400Traces = [];
    this.http404Traces = [];
    this.http500Traces = [];
    this.getCpuUsage();
    this.getSystemHealthRefresh();
    this.getMemoryManagement();
    this.getTraces();
  }

  private getProcessUpTime(isUpdateTime: boolean) {
    this.dashboardService.getProcessUpTime(this.application.monitoringUrl).subscribe(
      (response: any) => {
        this.clearErrorMessage();
        this.upTimestamp = Math.round(response?.measurements[0].value);
        this.processUpTime = this.formateUptime(this.upTimestamp);
        if(isUpdateTime) {
          this.updateTime();
        }
      },
      (error: HttpErrorResponse) => {
        this.setErrorMessage(error);
      }
    )
  }

  private updateTime(): void {
    this.upTimeInterval =  setInterval(() => {
      this.processUpTime = this.formateUptime(this.upTimestamp + 1);
      this.upTimestamp++;
    }, 1000);
  }

  private formateUptime(timestamp: number): string {
    const hours = Math.floor(timestamp / 60 / 60);
    const minutes = Math.floor(timestamp / 60) - (hours * 60);
    const seconds = timestamp % 60;
    return hours.toString().padStart(2, '0') + 'h' +
    minutes.toString().padStart(2, '0') + 'm' + seconds.toString().padStart(2, '0') + 's';
  }

  private getSystemHealthInit() {
    this.dashboardService.getSystemHealth(this.application.monitoringUrl).subscribe(
      (response: SystemHealth) => {
        this.clearErrorMessage();
        this.systemHealth = response;
        if(this.systemHealth?.status !== HealthStatus.UP) {
          this.processUpTime = '';
        } else {
          this.getProcessUpTime(true);
        }
        this.setFreeDiskSpace();
        this.initializeDoughnutChart();
      },
      (error: HttpErrorResponse) => {
        this.systemHealth = error.error;
        this.setFreeDiskSpace();
        this.stopInterval();
        this.setErrorMessage(error);
      }
    )
  }

  private getSystemHealthRefresh() {
    this.dashboardService.getSystemHealth(this.application.monitoringUrl).subscribe(
      (response: SystemHealth) => {
        this.clearErrorMessage();
        this.systemHealth = response;
        if(this.isIntervalStopped && this.systemHealth?.status !== HealthStatus.UP ) {
          this.processUpTime = '';
        } else if(this.isIntervalStopped) {
          this.getProcessUpTime(true);
          this.isIntervalStopped = false;
        } else {
          this.getProcessUpTime(false);
        }
        this.setFreeDiskSpace();
        this.initializeDoughnutChart();
      },
      (error: HttpErrorResponse) => {
        this.systemHealth = error.error;
        this.setFreeDiskSpace();
        this.stopInterval();
        this.setErrorMessage(error);
      }
    )
  }

  private setFreeDiskSpace() {
    this.freeDiskSpace = this.formatBytes(this.systemHealth!.components!.diskSpace.details.free);
  }

  private convertBytesToGigaBytes(bytes: number): number {
    if(bytes) {
      return Number((((bytes / 1024) / 1024) / 1024).toFixed(3))
    }
    return 0;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const dm = 2 < 0 ? 0 : 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  private getCpuUsage() {
    this.dashboardService.getSystemCPU(this.application.monitoringUrl).subscribe(
      (response: SystemCpu) => {
        this.clearErrorMessage();
        this.processors = response?.measurements[0]?.value;
      },
      (error: HttpErrorResponse) => {
        this.setErrorMessage(error);
      }
    )
  }

  onSelectTrace(trace: any) {
    this.selectedTrace = trace;
    const button = document.querySelector('#trace-modal') as HTMLButtonElement;
    button.click();
  }

  private processTraces(traces: any) {
    this.traceList = traces.filter((trace: any) => {
      return !trace.request.uri.includes('admin-monitor')
    });
    this.traceList.forEach(trace => {
      const status = trace.response.status;
      switch (true) {
        case (status >= 200 && status <= 299):
          this.http200Traces.push(trace);
          break;
        case (status !== 404 && (status >= 400 && status <= 499)):
          this.http400Traces.push(trace);
          break;
        case (status === 404):
          this.http404Traces.push(trace);
          break;
        case (status >= 500 && status <= 599):
          this.http500Traces.push(trace);
          break;
        default:
          this.httpDefaultTraces.push(trace);
      }
    })
  }

  private getTraces() {
    this.dashboardService.getHttpTraces(this.application.monitoringUrl).subscribe(
      (response: any) => {
        this.clearErrorMessage();
        this.processTraces(response.traces);
        this.initializeBarChart();
        this.initializePieChart();
      },
      (error: HttpErrorResponse) => {
        this.resetFields();
        this.setErrorMessage(error);
      }
    )
  }

  gotoHome() {
    this.router.navigate(['']);
  }

  private resetFields() {
    this.processUpTime = '';
    this.processors = 0;
    this.freeDiskSpace = '';
    this.systemHealth = undefined;
    this.stopInterval();
  }

  private stopInterval() {
    clearInterval(Number(this.upTimeInterval));
    this.isIntervalStopped = true;
  }

  isErrorMessage() {
    if(this.errorMessage) {
      return true;
    }
    return false;
  }

  private setErrorMessage(error: HttpErrorResponse) {
    if(error.status !== 503) {
      this.errorMessage = error.message;
    }
  }

  private clearErrorMessage() {
    this.errorMessage = undefined;
  }
}
