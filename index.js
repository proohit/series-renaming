#!/usr/bin/env node

import { watch } from "chokidar";
import {
  buildFileName,
  getFileExtension,
  pad,
  fileExists,
  loadAndParseJson,
} from "./file-utils.js";
import { getEpisodeNo, isVideo, findMatchedAnime } from "./media-utils.js";
import { logger } from "./logger.js";

run();

async function run() {
  const { appConfigFile, aniConfigFile } = await loadConfig();
  const { inputFolder, outputFolder } = appConfigFile;
  const animes = aniConfigFile.anime.map((anime) => anime.name);
  logger.info(`Loaded animes: ${animes}`);
  logger.info("Watching folder: ", inputFolder);
  watch(inputFolder, {
    ignoreInitial: true,
    awaitWriteFinish: true,
  }).on("add", (path) => moveFile(path, outputFolder, animes));
}

async function moveFile(path, outputFolder, animes) {
  logger.debug(`File added: ${path}`);
  const fileName = path.split("/").pop();
  if (isVideo(fileName)) {
    try {
      const matchedAnimeName = findMatchedAnime(animes, fileName);
      const episodeRaw = getEpisodeNo(fileName);
      let episode = undefined;
      if (episodeRaw) {
        // might be a series
        episode = pad(episodeRaw, 2);
      }
      const extension = getFileExtension(fileName);
      const newFileName = buildFileName(
        matchedAnimeName,
        undefined,
        episode,
        extension
      );
      logger.info(`Matched anime: ${matchedAnimeName}`);
      const newPath = `${outputFolder}/${newFileName}`;
      logger.info(`Moving ${path} to ${newPath}`);
      // fs.renameSync(path, newPath);
      // createAnidbFile(dir, anidbid, preview);
    } catch (e) {
      logger.error(e);
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
