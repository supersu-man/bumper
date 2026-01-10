import { execSync } from 'child_process';

export const gitOperations = {
  getStatus: (projectPath: string): number => {
    const status = execSync('git status --porcelain', { cwd: projectPath, encoding: 'utf8' }).trim();
    if (status.length > 0) return 1;

    const st = execSync('git status -uno', { cwd: projectPath, encoding: 'utf8' });
    if (!st.includes('up to date')) return 2;

    const pushOutput = execSync('git push 2>&1', { cwd: projectPath, encoding: 'utf8' });
    if (!pushOutput.includes('Everything up-to-date')) return 3;

    return 5;
  },

  commitTagPush: (projectPath: string, version: string): void => {
    execSync('git add -A', { cwd: projectPath });
    execSync(`git commit -m v${version}`, { cwd: projectPath });
    execSync(`git tag v${version}`, { cwd: projectPath });
    execSync('git push', { cwd: projectPath });
    execSync('git push --tags', { cwd: projectPath });
  },

  revertRelease: (projectPath: string): void => {
    const latestTag = execSync('git describe --tags --abbrev=0', { cwd: projectPath, encoding: 'utf8' });
    const latestCommitMessage = execSync('git log -1 --pretty=%s', { cwd: projectPath, encoding: 'utf8' });

    if (latestTag !== latestCommitMessage) return;

    execSync(`git tag -d ${latestTag}`, { cwd: projectPath, encoding: 'utf8' });
    execSync(`git push origin --delete ${latestTag}`, { cwd: projectPath, encoding: 'utf8' });
    execSync('git reset --hard HEAD~1', { cwd: projectPath, encoding: 'utf8' });
    execSync('git push --force origin', { cwd: projectPath, encoding: 'utf8' });
  },
};
