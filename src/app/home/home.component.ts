import { Component } from '@angular/core';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageService } from 'primeng/api';
import { BumpType, FileType, ProjectType } from '../constants/enums';
import { Regex } from '../constants/regex';
import { FolderPath, Version, VersionFile } from '../constants/interfaces';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DropdownModule, ButtonModule, FormsModule, SelectButtonModule],
  templateUrl: './home.component.html',
  styles: ``
})
export class HomeComponent {

  folderPaths: FolderPath[] = []
  selectedFolderPath: FolderPath | undefined
  versionFiles: VersionFile[] = []

  versionCode: Version | undefined
  versionName: Version | undefined
  version: Version | undefined


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
  selectedBumpOption = BumpType.Minor


  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    this.getProjectPaths();
  }

  getProjectPaths = async () => {
    this.folderPaths = await this.window.api.getPaths()
    console.log(this.folderPaths)
  }

  deleteProjectPath = async () => {
    await this.window.api.deletePath(this.selectedFolderPath?.path)
    this.selectedFolderPath = undefined
    this.getProjectPaths()
  }

  openProjectDialog = async () => {
    const result = await this.window.api.addPath()
    if(result != "success") 
      this.messageService.add({ severity: 'error', summary: 'Error', detail: result });
    this.getProjectPaths()
  }

  onPathChange = async () => {
    if(!this.selectedFolderPath) return

    console.log(this.selectedFolderPath)
    this.versionFiles = await this.window.api.getVersionFiles(this.selectedFolderPath)
    
    if(this.versionFiles.length==0) {
      return this.messageService.add({ severity: 'error', summary: 'Error', detail: "Supported files not found in project" });
    }

    if(this.versionFiles[0].type == FileType.Gradle) {
      const currentVersionName = Regex.VersionNameGradle.exec(this.versionFiles[0].content)?.[0] as string
      const currentVersionCode = Regex.VersionCodeGradle.exec(this.versionFiles[0].content)?.[0] as string
      this.versionCode = { current: currentVersionCode, new: Number(currentVersionCode)+1+'' }
      this.versionName = { current: currentVersionName, new: this.bumpversion(currentVersionName, this.selectedBumpOption) }
    }

    if(this.versionFiles[0].type == FileType.GradleKotlin) {
      const currentVersionName = Regex.VersionNameKotlin.exec(this.versionFiles[0].content)?.[0] as string
      const currentVersionCode = Regex.VersionCodeKotlin.exec(this.versionFiles[0].content)?.[0] as string
      this.versionCode = { current: currentVersionCode, new: Number(currentVersionCode)+1+'' }
      this.versionName = { current: currentVersionName, new: this.bumpversion(currentVersionName, this.selectedBumpOption) }
    }

    if(this.versionFiles[0].type == FileType.Package && this.versionFiles[1].type == FileType.PackageLock) {
      const currentVersion = Regex.VersionRegex.exec(this.versionFiles[0].content)?.[0] as string
      this.version = { current: currentVersion, new: this.bumpversion(currentVersion, this.selectedBumpOption) }
    }
    
    console.log(this.versionFiles)
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
    if(this.versionFiles[0].type == FileType.Gradle && this.versionName && this.versionCode) {
      let newContent = this.versionFiles[0].content.replace(Regex.VersionNameGradle, this.versionName.new)
      newContent = newContent.replace(Regex.VersionCodeGradle, this.versionCode.new)
      await this.window.api.writeFile(this.versionFiles[0].path, newContent)
      await this.window.api.commitTagPush(this.selectedFolderPath?.path, this.versionName.new)
    }

    if(this.versionFiles[0].type == FileType.GradleKotlin && this.versionName && this.versionCode) {
      let newContent = this.versionFiles[0].content.replace(Regex.VersionNameKotlin, this.versionName.new)
      newContent = newContent.replace(Regex.VersionCodeKotlin, this.versionCode.new)
      await this.window.api.writeFile(this.versionFiles[0].path, newContent)
      await this.window.api.commitTagPush(this.selectedFolderPath?.path, this.versionName.new)
    }

    if(this.versionFiles[0].type == FileType.Package && this.versionFiles[1].type == FileType.PackageLock && this.version) {
      let newContent = this.versionFiles[0].content.replace(Regex.VersionRegex, this.version.new)
      let newContentPackageLock = this.versionFiles[1].content.replace(Regex.VersionRegex, this.version.new)
      await this.window.api.writeFile(this.versionFiles[0].path, newContent)
      await this.window.api.writeFile(this.versionFiles[1].path, newContentPackageLock)
      await this.window.api.commitTagPush(this.selectedFolderPath?.path, this.version.new)
    }

    await this.onPathChange()
  }
}
