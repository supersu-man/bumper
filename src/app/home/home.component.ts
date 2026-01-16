import { Component, signal } from '@angular/core';
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageService } from 'primeng/api';
import { BumpType, FileType, ProjectType } from '../../electron/enums';
import { Regex } from '../constants/regex';
import { FolderPath, Version, VersionFile } from '../../electron/interfaces';

@Component({
  selector: 'app-home',
  imports: [AutoCompleteModule, ButtonModule, FormsModule, SelectButtonModule],
  templateUrl: './home.component.html',
  styles: ``
})
export class HomeComponent {

  folderPaths = signal<FolderPath[]>([]);
  selectedFolderPath = signal<FolderPath | undefined>(undefined);
  versionFiles = signal<VersionFile[]>([]);

  versionCode = signal<Version | undefined>(undefined);
  versionName = signal<Version | undefined>(undefined);
  version = signal<Version | undefined>(undefined);


  htmlTypes = {
    FileType: FileType,
    BumpType: BumpType
  }

  bumpOptions = [
    { label: 'Major', value: BumpType.Major },
    { label: 'Minor', value: BumpType.Minor },
    { label: 'Patch', value: BumpType.Patch }
  ]
  selectedBumpOption = signal(BumpType.Minor);

  repoStatus = signal(0);

  constructor(private messageService: MessageService) { }

  ngOnInit(): void {
    this.getProjectPaths();
  }

  getProjectPaths = async () => {
    const paths = await window.api.getPaths()
    this.folderPaths.set(paths);
    console.log(paths)
  }

  deleteProjectPath = async () => {
    if (!this.selectedFolderPath()) return
    await window.api.deletePath(this.selectedFolderPath()!.path)
    this.selectedFolderPath.set(undefined);
    this.versionCode.set(undefined);
    this.versionName.set(undefined);
    this.version.set(undefined);
    this.versionFiles.set([]);
    this.getProjectPaths()
  }

  openProjectDialog = async () => {
    const result = await window.api.addPath()
    if (result.error) {
      return this.messageService.add({ severity: 'error', summary: 'Error', detail: result.message });
    }
    else {
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Folder added' });
    }
    await this.getProjectPaths()
    this.selectedFolderPath.set(result.folderPath);
    this.onPathChange()
  }

  onPathChange = async (checkStatus: boolean = true) => {
    if (!this.selectedFolderPath()) return

    const versionFiles = await window.api.getVersionFiles(this.selectedFolderPath()!)
    if (!versionFiles || versionFiles.length == 0) {
      return this.messageService.add({ severity: 'error', summary: 'Error', detail: "Supported files not found in project" });
    }

    if (checkStatus) {
      const gitStatus = await window.api.gitStatus(this.selectedFolderPath()?.path!)
      this.repoStatus.set(gitStatus);
    }

    this.versionFiles.set(versionFiles);

    if (this.versionFiles()[0].type == FileType.Gradle) {
      const currentVersionName = Regex.VersionNameGradle.exec(this.versionFiles()[0].content)?.[0] as string
      const currentVersionCode = Regex.VersionCodeGradle.exec(this.versionFiles()[0].content)?.[0] as string
      this.versionCode.set({ current: currentVersionCode, new: Number(currentVersionCode) + 1 + '' });
      this.versionName.set({ current: currentVersionName, new: this.bumpversion(currentVersionName, this.selectedBumpOption()) });
    }

    if (this.versionFiles()[0].type == FileType.GradleKotlin) {
      const currentVersionName = Regex.VersionNameKotlin.exec(this.versionFiles()[0].content)?.[0] as string
      const currentVersionCode = Regex.VersionCodeKotlin.exec(this.versionFiles()[0].content)?.[0] as string
      this.versionCode.set({ current: currentVersionCode, new: Number(currentVersionCode) + 1 + '' });
      this.versionName.set({ current: currentVersionName, new: this.bumpversion(currentVersionName, this.selectedBumpOption()) });
    }

    if (this.versionFiles()[0].type == FileType.Package && this.versionFiles()[1].type == FileType.PackageLock) {
      const currentVersion = Regex.VersionRegex.exec(this.versionFiles()[0].content)?.[0] as string
      this.version.set({ current: currentVersion, new: this.bumpversion(currentVersion, this.selectedBumpOption()) });
    }
  }

  revert = async () => {
    if (!this.selectedFolderPath()) return
    await window.api.revertRelease(this.selectedFolderPath()!.path)
  }

  bumpversion = (version: string, bumpType: BumpType) => {
    const ar = version.split('.')
    if (ar.length == 3) {
      if (bumpType == BumpType.Major) return (Number(ar[0]) + 1) + '.0.0'
      if (bumpType == BumpType.Minor) return ar[0] + '.' + (Number.parseInt(ar[1]) + 1) + '.0'
      if (bumpType == BumpType.Patch) return ar[0] + '.' + ar[1] + '.' + (Number.parseInt(ar[2]) + 1)
    } else if (ar.length == 2) {
      if (bumpType == BumpType.Major) return (Number.parseInt(ar[0]) + 1) + '.0'
      if (bumpType == BumpType.Minor || bumpType == BumpType.Patch) return ar[0] + '.' + (Number.parseInt(ar[1]) + 1)
    }
    return ''
  }

  bumpProject = async () => {
    if (!this.selectedFolderPath()) return
    if (this.versionFiles()[0].type == FileType.Gradle && this.versionName() && this.versionCode()) {
      let newContent = this.versionFiles()[0].content.replace(Regex.VersionNameGradle, this.versionName()!.new)
      newContent = newContent.replace(Regex.VersionCodeGradle, this.versionCode()!.new)
      await window.api.writeFile(this.versionFiles()[0].path, newContent)
      await window.api.commitTagPush(this.selectedFolderPath()!.path, this.versionName()!.new)
    }

    if (this.versionFiles()[0].type == FileType.GradleKotlin && this.versionName() && this.versionCode()) {
      let newContent = this.versionFiles()[0].content.replace(Regex.VersionNameKotlin, this.versionName()!.new)
      newContent = newContent.replace(Regex.VersionCodeKotlin, this.versionCode()!.new)
      await window.api.writeFile(this.versionFiles()[0].path, newContent)
      await window.api.commitTagPush(this.selectedFolderPath()!.path, this.versionName()!.new)
    }

    if (this.versionFiles()[0].type == FileType.Package && this.versionFiles()[1].type == FileType.PackageLock && this.version()) {
      const newContent = this.versionFiles()[0].content.replace(Regex.VersionRegex, this.version()!.new)

      const parts = this.versionFiles()[1].content.split('"packages"');
      parts[0] = parts[0].replace(Regex.VersionRegex, this.version()!.new)
      parts[1] = parts[1].replace(Regex.VersionRegex, this.version()!.new)
      const newContentPackageLock = parts.join('"packages"')

      await window.api.writeFile(this.versionFiles()[0].path, newContent)
      await window.api.writeFile(this.versionFiles()[1].path, newContentPackageLock)

      await window.api.commitTagPush(this.selectedFolderPath()!.path, this.version()!.new)
    }

    await this.onPathChange(false)
  }
}
