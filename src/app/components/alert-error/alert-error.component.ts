import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-alert-error',
  templateUrl: './alert-error.component.html',
  styleUrls: ['./alert-error.component.css']
})
export class AlertErrorComponent implements OnInit {

  @Input()
  errorMessage: string | undefined = '';
  constructor() {}

  ngOnInit(): void {
  }

}
