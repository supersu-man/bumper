import { Component } from '@angular/core';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageService } from 'primeng/api';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DropdownModule, ButtonModule, FormsModule, SelectButtonModule],
  templateUrl: './home.component.html',
  styles: ``
})
export class HomeComponent {
  projectPaths = []
  selectedPath = ''

  currentVersionCode = ''
  currentVersionName = ''
  newVersionCode = ''
  newVersionName = ''

  bumpOptions = [
    { label: 'Major', value: 'major'},
    { label: 'Minor', value: 'minor'},
    { label: 'Patch', value: 'patch'}
  ]
  selectedBumpOption: 'major'|'minor'|'patch' = 'patch'

  content = ''

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    this.getProjectPaths();
  }

  getProjectPaths = async () => {
    this.projectPaths = await (window as any).api.getPaths()
    console.log(this.projectPaths)
  }

  deleteProjectPath = async () => {
    await (window as any).api.deletePath(this.selectedPath)
    this.selectedPath = ''
    this.getProjectPaths()
  }

  openProjectDialog = async () => {
    const result = await (window as any).api.addPath()
    if(result != "success") 
      this.messageService.add({ severity: 'error', summary: 'Error', detail: result });
    console.log(result)
    this.getProjectPaths()
  }

  versionCodeRegex = /((?<=versionCode = )|(?<=versionCode ))[0-9]+/
  versionNameRegex = /((?<=versionName = ")|(?<=versionName "))[0-9](\.[0-9]){1,2}(?=")/

  onPathChange = async () => {
    if(!this.selectedPath) return
    this.content = await (window as any).api.getGradleContent(this.selectedPath)
    this.currentVersionCode = this.versionCodeRegex.exec(this.content)?.[0] as string
    this.currentVersionName = this.versionNameRegex.exec(this.content)?.[0] as string
    this.bumpversions()
  }

  checkStatus = async () => {
    const status = await (window as any).api.checkStatus(this.selectedPath)
    console.log(status)
  }

  bumpversions = () => {
    const ar = this.currentVersionName.split('.')
    if (ar.length == 3) {
      if (this.selectedBumpOption=='major') {
        this.newVersionName = (Number(ar[0])+1) + '.0.0'
      }
      if (this.selectedBumpOption=='minor') {
        this.newVersionName = ar[0] + '.' + (Number.parseInt(ar[1])+1) + '.0'
      }
      if (this.selectedBumpOption=='patch') {
        this.newVersionName = ar[0] + '.' + ar[1] + '.' + (Number.parseInt(ar[2])+1)
      }
    } else if(ar.length == 2) {
      if (this.selectedBumpOption=='major') {
        this.newVersionName = (Number.parseInt(ar[0])+1) + '.0'
      }
      if (this.selectedBumpOption=='minor' || this.selectedBumpOption=='patch') {
        this.newVersionName = ar[0] + '.' + (Number.parseInt(ar[1])+1)
      }
    }

    this.newVersionCode = (Number.parseInt(this.currentVersionCode) + 1) + ''
  }

  bumpProject = async () => {
    const newContent = this.content.replace(this.versionCodeRegex, this.newVersionCode).replace(this.versionNameRegex, this.newVersionName)
    await (window as any).api.writeGradleContent(this.selectedPath, newContent, this.newVersionName)
    await this.onPathChange()
  }
}
