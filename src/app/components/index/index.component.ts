import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HealthStatus } from 'src/app/enums/health-status';
import { Application } from 'src/app/interfaces/application';
import { SystemHealth } from 'src/app/interfaces/system-health';
import { AdminDashboardService } from 'src/app/services/admin-dashboard.service';
import { ApplicationService } from 'src/app/services/application.service';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css']
})
export class IndexComponent implements OnInit {

  applications: Application[] = [];
  editApplication: Application | undefined;
  deleteApplication: Application | undefined;
  errorMessage: string | undefined = undefined;
  healthStatus = HealthStatus;
  updatedAt: Date | undefined = undefined;

  constructor(private applicationService: ApplicationService,
              private adminDashboardService: AdminDashboardService) { }

  ngOnInit(): void {
    this.getAllApplications();
  }

  onRefreshData() {
    this.getAllApplications();
  }

  public onAddApplication(addForm: NgForm) {
    this.applicationService.addApplication(addForm.value).subscribe(
      (response: Application) => {
        const close = document.querySelector('#add-application-form') as HTMLButtonElement;
        close.click();
        this.getAllApplications();
        addForm.reset();
      },
      (error: HttpErrorResponse) => alert(error.message)
    )
  }

  async getAllApplications() {
    const applications: Application[] | undefined = await this.applicationService
      .getAllApplications()
      .toPromise()
      .then((response) => {
        this.errorMessage = undefined;
        return response;
      }).catch(error => {
        this.errorMessage = error.message
        return undefined;
      });

    if(applications) {
      const applicationsHealth = applications.map(async (app: Application) => {
        const health: SystemHealth = await this.adminDashboardService
          .getSystemHealth(app.monitoringUrl)
          .toPromise()
          .then((response) => {
            this.errorMessage = undefined;
            return response;
          }).catch(error => {
            const healthDown: SystemHealth = { status: HealthStatus.DOWN }
            return healthDown;
          });
        app.systemHealth = health;
        return app;
      });
      await Promise.all(applicationsHealth).then(healths => this.applications = healths)
      this.updatedAt = new Date();
    }
  }

  public onUpdateApplication(application?: Application) {
    // this.employeeService.updateEmployee(employee).subscribe(
    //   (response: Employee) => {
    //     const close = document.querySelector('#edit-employee-form') as HTMLButtonElement;
    //     close.click();
    //     this.getAllEmployees();
    //   },
    //   (error: HttpErrorResponse) => alert(error.message)
    // );
  }

  public onDeleteApplication(id?: number) {
    // this.employeeService.deleteEmployee(id).subscribe(
    //   (response: void) => {
    //     const close = document.querySelector('#delete-employee-form') as HTMLButtonElement;
    //     close.click();
    //     this.getAllEmployees();
    //   },
    //   (error: HttpErrorResponse) => alert(error.message)
    // );
  }

  public onOpenModal(mode: string, application?: Application) {
    const container = document.querySelector('#main-container');
    const button = document.createElement('button');
    button.type = 'button';
    button.style.display = 'none';
    button.setAttribute('data-toggle', 'modal');

    if(mode === 'add') {
      button.setAttribute('data-target', '#addApplicationModal')
    }
    if(mode === 'edit') {
      this.editApplication = application;
      button.setAttribute('data-target', '#updateApplicationModal')
    }
    if(mode === 'delete') {
      this.deleteApplication = application;
      button.setAttribute('data-target', '#deleteApplicationModal')
    }

    container?.appendChild(button);
    button.click();
  }

  isErrorMessage() {
    if(this.errorMessage) {
      return true;
    }
    return false;
  }

  getHealthStatus() {
    return this.healthStatus;
  }
}
