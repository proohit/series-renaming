#!/usr/bin/env node

import { watch } from "chokidar";
import { checkAnidbDb, searchAnime } from "./anidb.js";
import {
  buildFileName,
  createFolder,
  fileExists,
  getFileExtension,
  moveFile,
  loadConfig,
  copyFile,
  removeFile,
} from "./file-utils.js";
import { logger } from "./logger.js";
import {
  createAnidbFile,
  getEpisodeNo,
  getSeasonNo,
  isVideo,
} from "./media-utils.js";
const APP_CONFIG_FILE_PATH = "/config/config.json";
let appConfig = undefined;
run();

async function run() {
  appConfig = await loadConfig(APP_CONFIG_FILE_PATH);
  const { inputFolder } = appConfig;
  await checkAnidbDb(APP_CONFIG_FILE_PATH, appConfig);
  logger.info(`Watching folder: ${inputFolder}/*/**`);
  watch(`${inputFolder}/*/**`, {
    ignoreInitial: false,
    awaitWriteFinish: true,
  }).on("add", (path) => handleFileAdded(path));
}

function getFileParts(fileName) {
  const episode = getEpisodeNo(fileName);
  const season = getSeasonNo(fileName);
  const extension = getFileExtension(fileName);
  return { episode, season, extension };
}

async function handleFileAdded(path) {
  const outputFolder = appConfig.outputFolder;
  logger.debug(`File added: ${path}`);
  const splitPath = path.split("/");
  const fileName = splitPath[splitPath.length - 1];
  let parentFolderName = "";
  if (splitPath.length > 1) {
    parentFolderName = splitPath[splitPath.length - 2];
  }
  if (isVideo(fileName)) {
    try {
      const matchedAnimeName = parentFolderName;
      const { episode, season, extension } = getFileParts(fileName);
      if (!episode) {
        // episode not found, might be a movie or episode could not be found
        throw new Error(`Episode not found in file name: ${fileName}`);
      }
      const newFileName = buildFileName(
        matchedAnimeName,
        season,
        episode,
        extension
      );
      const newParent = `${outputFolder}/${matchedAnimeName}`;
      if (!(await fileExists(newParent))) {
        await createFolder(newParent);
      }
      const newPath = `${newParent}/${newFileName}`;
      logger.info(`Moving ${path} to ${newPath}`);
      await copyFile(path, newPath);
      await removeFile(path);
      const shouldReloadConfig = await checkAnidbDb(
        APP_CONFIG_FILE_PATH,
        appConfig
      );
      if (shouldReloadConfig) {
        logger.info("Reloading config due to anidb download");
        appConfig = await loadConfig(APP_CONFIG_FILE_PATH);
      }
      const { aid } = searchAnime(matchedAnimeName);
      await createAnidbFile(newParent, aid);
    } catch (e) {
      logger.error(e.message);
    }
  } else {
    logger.debug(`Ignoring, not a video`);
  }
}
