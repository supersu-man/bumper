import { Component, OnInit, signal } from '@angular/core';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-update-window',
  imports: [ProgressBarModule],
  templateUrl: './update-window.component.html',
  styles: ``
})
export class UpdateWindowComponent implements OnInit {

  progress = signal(0);

  constructor() { }

  ngOnInit(): void {
    (window as any).api.onUpdateProgress((progress: number) => {
      this.progress.set(parseFloat(progress.toFixed(2)));
    })
  }


}
