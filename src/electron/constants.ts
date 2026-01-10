export const WINDOW_CONFIG = {
  MAIN: {
    height: 600,
    width: 1000,
    title: "Bumper",
  },
  UPDATE: {
    height: 180,
    width: 500,
    title: "Update found",
    resizable: false,
    closable: false,
  },
};

export const GIT_MESSAGES = {
  NO_GRADLE: 'Could not find build.gradle | build.gradle.kts | package.json | package_lock.json',
  PATH_EXISTS: 'Path already exists',
  NO_FOLDER_SELECTED: 'No folder selected',
};

export const GIT_STATUS_CODES = {
  UNCOMMITTED_CHANGES: 1,
  UNPULLED_COMMITS: 2,
  UNPUSHED_COMMITS: 3,
  UP_TO_DATE: 5,
};
