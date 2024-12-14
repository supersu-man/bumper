import { Component } from '@angular/core';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageService } from 'primeng/api';
import { BumpType, FileType } from '../constants/enums';
import { VersionType, FileObject } from '../constants/interfaces';
import { versionCodeGradle, versionCodeKotlin, versionNameGradle, versionNameKotlin, versionRegex } from '../constants/regex';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DropdownModule, ButtonModule, FormsModule, SelectButtonModule],
  templateUrl: './home.component.html',
  styles: ``
})
export class HomeComponent {

  projectPaths: string[] = []
  selectedPath: string = ""

  versionCode: VersionType | undefined
  versionName: VersionType | undefined
  version: VersionType | undefined

  fileObjects: FileObject[] = []

  htmlTypes = {
    FileType: FileType,
    BumpType: BumpType
  }

  window = window as any

  bumpOptions = [
    { label: 'Major', value: BumpType.Major },
    { label: 'Minor', value: BumpType.Minor },
    { label: 'Patch', value: BumpType.Patch }
  ]
  bump_type = BumpType.Minor


  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    this.getProjectPaths();
  }

  getProjectPaths = async () => {
    this.projectPaths = await this.window.api.getPaths()
    console.log(this.projectPaths)
  }

  deleteProjectPath = async () => {
    await this.window.api.deletePath(this.selectedPath)
    this.selectedPath = ''
    this.getProjectPaths()
  }

  openProjectDialog = async () => {
    const result = await this.window.api.addPath()
    if(result != "success") 
      this.messageService.add({ severity: 'error', summary: 'Error', detail: result });
    console.log(result)
    this.getProjectPaths()
  }

  onPathChange = async () => {
    if(!this.selectedPath) return

    this.fileObjects = await this.window.api.getVersionFileObj(this.selectedPath)
    
    if(this.fileObjects.length==0) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: "Supported files not found in project" });
    }

    if(this.fileObjects[0].type == FileType.Gradle) {
      const currentVersionName = versionNameGradle.exec(this.fileObjects[0].content)?.[0] as string
      const currentVersionCode = versionCodeGradle.exec(this.fileObjects[0].content)?.[0] as string
      this.versionCode = { currentVersion: currentVersionCode, newVersion: Number(currentVersionCode)+1+'' }
      this.versionName = { currentVersion: currentVersionName, newVersion: this.bumpversion(currentVersionName, this.bump_type) }
    }

    if(this.fileObjects[0].type == FileType.GradleKotlin) {
      const currentVersionName = versionNameKotlin.exec(this.fileObjects[0].content)?.[0] as string
      const currentVersionCode = versionCodeKotlin.exec(this.fileObjects[0].content)?.[0] as string
      this.versionCode = { currentVersion: currentVersionCode, newVersion: Number(currentVersionCode)+1+'' }
      this.versionName = { currentVersion: currentVersionName, newVersion: this.bumpversion(currentVersionName, this.bump_type) }
    }

    if(this.fileObjects[0].type == FileType.Package && this.fileObjects[1].type == FileType.PackageLock) {
      const currentVersion = versionRegex.exec(this.fileObjects[0].content)?.[0] as string
      this.version = { currentVersion: currentVersion, newVersion: this.bumpversion(currentVersion, this.bump_type) }
    }
    
    console.log(this.fileObjects)
  }

  checkStatus = async () => {
    const status = await (window as any).api.checkStatus(this.selectedPath)
    console.log(status)
  }

  bumpversion = (version: string, bumpType: BumpType) => {
    const ar = version.split('.')
    if (ar.length == 3) {
      if (bumpType == BumpType.Major) return (Number(ar[0])+1)+'.0.0'
      if (bumpType == BumpType.Minor) return ar[0]+'.'+(Number.parseInt(ar[1])+1)+'.0'
      if (bumpType == BumpType.Patch) return ar[0]+'.'+ar[1]+'.'+(Number.parseInt(ar[2])+1)
    } else if(ar.length == 2) {
      if (bumpType == BumpType.Major) return (Number.parseInt(ar[0])+1)+'.0'
      if (bumpType == BumpType.Minor || bumpType == BumpType.Patch) return ar[0]+'.'+(Number.parseInt(ar[1])+1)
    }
    return ''
  }

  bumpProject = async () => {
    if(this.fileObjects[0].type == FileType.Gradle && this.versionName && this.versionCode) {
      let newContent = this.fileObjects[0].content.replace(versionNameGradle, this.versionName.newVersion)
      newContent = newContent.replace(versionCodeGradle, this.versionCode.newVersion)
      await this.window.api.writeVersionFileContent(this.selectedPath, [newContent])
      await this.window.api.commitTagPush(this.selectedPath, this.versionName.newVersion)
    }

    if(this.fileObjects[0].type == FileType.GradleKotlin && this.versionName && this.versionCode) {
      let newContent = this.fileObjects[0].content.replace(versionNameKotlin, this.versionName.newVersion)
      newContent = newContent.replace(versionCodeKotlin, this.versionCode.newVersion)
      await this.window.api.writeVersionFileContent(this.selectedPath, [newContent])
      await this.window.api.commitTagPush(this.selectedPath, this.versionName.newVersion)
    }

    if(this.fileObjects[0].type == FileType.Package && this.version) {
      let newContent = this.fileObjects[0].content.replace(versionRegex, this.version.newVersion)
      let newContentPackageLock = this.fileObjects[1].content.replace(versionRegex, this.version.newVersion)
      await this.window.api.writeVersionFileContent(this.selectedPath, [newContent, newContentPackageLock])
      await this.window.api.commitTagPush(this.selectedPath, this.version.newVersion)
    }

    await this.onPathChange()
  }
}
