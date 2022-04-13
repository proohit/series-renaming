#!/usr/bin/env node

import { watch } from "chokidar";
import {
  buildFileName,
  createFolder,
  fileExists,
  getFileExtension,
  loadAndParseJson,
  moveFile,
} from "./file-utils.js";
import { logger } from "./logger.js";
import { getEpisodeNo, getSeasonNo, isVideo } from "./media-utils.js";

run();

async function run() {
  const { appConfigFile, aniConfigFile } = await loadConfig();
  const { inputFolder, outputFolder } = appConfigFile;
  const animes = aniConfigFile.anime.map((anime) => anime.name);
  logger.info(`Loaded animes: ${animes}`);
  logger.info(`Watching folder: ${inputFolder}`);
  watch(`${inputFolder}/*/**`, {
    ignoreInitial: false,
    awaitWriteFinish: true,
  }).on("add", (path) => handleFileAdded(path, outputFolder, animes));
}

function getFileParts(fileName) {
  const episode = getEpisodeNo(fileName);
  const season = getSeasonNo(fileName);
  const extension = getFileExtension(fileName);
  return { episode, season, extension };
}

async function handleFileAdded(path, outputFolder, animes) {
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
      await moveFile(path, newPath);
      // createAnidbFile(dir, anidbid, preview);
    } catch (e) {
      logger.error(e.message);
    }
  } else {
    logger.debug(`Ignoring, not a video`);
  }
}

async function loadConfig() {
  const appConfigFilePath = "config.json";
  const appConfigExists = await fileExists(appConfigFilePath);
  if (appConfigExists) {
    const appConfigFile = await loadAndParseJson(appConfigFilePath);
    const aniConfigFilePath = appConfigFile.aniConfigFile;
    const aniConfigExists = await fileExists(aniConfigFilePath);
    if (aniConfigExists) {
      const aniConfigFile = await loadAndParseJson(aniConfigFilePath);
      return { appConfigFile, aniConfigFile };
    } else {
      throw new Error(`Ani config file not found: ${aniConfigFilePath}`);
    }
  } else {
    throw new Error(`Config file not found: ${appConfigFilePath}`);
  }
}
