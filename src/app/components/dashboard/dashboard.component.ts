import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { SystemCpu } from 'src/app/interfaces/system-cpu';
import { SystemHealth } from 'src/app/interfaces/system-health';
import { AdminDashboardService } from 'src/app/services/admin-dashboard.service';
import * as Chart from 'chart.js';
import { ChartType } from 'src/app/enums/chart-type';

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

  constructor(private dashboardService: AdminDashboardService) { }

  ngOnInit(): void {
    this.getCpuUsage();
    this.getSystemHealth();
    this.getProcessUpTime(true);
    this.getTraces();
  }

  private initializePieChart() {
    const canvas = document.querySelector('#pieChart') as HTMLCanvasElement;
    return new Chart(canvas, {
      type: ChartType.Pie,
      data: {
        labels: ['200', '400', '404', '500'],
        datasets: [{ data: [this.http200Traces.length, this.http400Traces.length, this.http404Traces.length, this.http500Traces.length],
        backgroundColor: ['rgb(40,167,69)', 'rgb(0,123,255)', 'rgb(253,126,20)', 'rgb(220,53,69)'],
        borderColor: ['rgb(40,167,69)', 'rgb(0,123,255)', 'rgb(253,126,20)', 'rgb(220,53,69)'],
        borderWidth: 3
        }]
      },
      options: {
        title: {display: true, text: [`Last 100 Requests as of ${this.formatDate(new Date())}`] },
        legend: {display: true},
      }
    });
  }

  private initializeBarChart() {
    const canvas = document.querySelector('#barChart') as HTMLCanvasElement;
    return new Chart(canvas, {
      type: ChartType.Bar,
      data: {
        labels: ['200', '404', '400', '500'],
        datasets: [{ data: [this.http200Traces.length, this.http404Traces.length, this.http400Traces.length, this.http500Traces.length],
        backgroundColor: ['rgb(40,167,69)', 'rgb(0,123,255)', 'rgb(253,126,20)', 'rgb(220,53,69)'],
        borderColor: ['rgb(40,167,69)', 'rgb(0,123,255)', 'rgb(253,126,20)', 'rgb(220,53,69)'],
        borderWidth: 3
        }]
      },
      options: {
        title: {display: true, text: [`Last 100 Requests as of ${this.formatDate(new Date())}`] },
        legend: {display: false},
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
    this.getTraces();
    this.getSystemHealth();
    this.getCpuUsage();
    this.getProcessUpTime(false);
  }

  private getProcessUpTime(isUpdateTime: boolean) {
    this.dashboardService.getProcessUpTime().subscribe(
      (response: any) => {
        this.upTimestamp = Math.round(response?.measurements[0].value);
        this.processUpTime = this.formateUptime(this.upTimestamp);
        if(isUpdateTime) {
          this.updateTime();
        }
      },
      (error: HttpErrorResponse) => {
        this.errorMessage = error.message;
      }
    )
  }

  private updateTime(): void {
    setInterval(() => {
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

  private getSystemHealth() {
    this.dashboardService.getSystemHealth().subscribe(
      (response: SystemHealth) => {
        this.systemHealth = response;
        this.freeDiskSpace = this.formatBytes(this.systemHealth?.components!.diskSpace!.details!.free);
      },
      (error: HttpErrorResponse) => {
        this.errorMessage = error.message;
      }
    )
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
    this.dashboardService.getSystemCPU().subscribe(
      (response: SystemCpu) => {
        this.processors = response?.measurements[0]?.value;
      },
      (error: HttpErrorResponse) => {
        this.errorMessage = error.message;
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
      switch (trace.response.status) {
        case 200:
          this.http200Traces.push(trace);
          break;
        case 400:
          this.http400Traces.push(trace);
          break;
        case 404:
          this.http404Traces.push(trace);
          break;
        case 500:
          this.http500Traces.push(trace);
          break;
        default:
          this.httpDefaultTraces.push(trace);
      }
    })
  }

  private getTraces() {
    this.dashboardService.getHttpTraces().subscribe(
      (response: any) => {
        this.processTraces(response.traces);
        this.initializeBarChart();
        this.initializePieChart();
      },
      (error: HttpErrorResponse) => {
        this.errorMessage = error.message;
      }
    )
  }
}
