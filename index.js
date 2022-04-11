#!/usr/bin/env node

import fs from "fs";
import { watch } from "chokidar";
import { buildFileName, getFileExtension, pad } from "./file-utils";
import { getEpisodeNo, isVideo, findMatchedAnime } from "./media-utils";
import { logger } from "./logger";

run();

async function run() {
  const { appConfigFile, aniConfigFile } = loadConfig();
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
      const episode = pad(episodeRaw, 2);
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

function loadConfig() {
  const appConfigFile = JSON.parse(fs.readFileSync("config.json"));
  const aniConfigFile = JSON.parse(
    fs.readFileSync(appConfigFile.aniConfigFile)
  );
  return { appConfigFile, aniConfigFile };
}
