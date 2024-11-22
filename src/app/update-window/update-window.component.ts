import { Component, NgZone, OnInit } from '@angular/core';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-update-window',
  standalone: true,
  imports: [ ProgressBarModule ],
  templateUrl: './update-window.component.html',
  styles: ``
})
export class UpdateWindowComponent implements OnInit {

  progress = 0

  constructor(private zone: NgZone) { }

  ngOnInit(): void {
    (window as any).api.onUpdateProgress((progress: number) => {
      this.zone.run(() => {
        this.progress = parseFloat(progress.toFixed(2))
      })
    })
  }


}
