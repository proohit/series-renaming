#!/usr/bin/env node

import { watch } from "chokidar";
import { checkAnidbDb, searchAnime } from "./anidb.js";
import {
  buildEpisodeFileName,
  createFolder,
  fileExists,
  getFileExtension,
  copyFile,
  removeFile,
  getSubDirs,
  getFilesOfDir,
  buildMovieFileName,
} from "./file-utils.js";
import { logger } from "./logger.js";
import { loadConfig } from "./config.js";
import {
  createAnidbFile,
  getEpisodeNo,
  getMovieOfFolder,
  getSeasonNo,
  isFolderAnimeMovie,
  isVideo,
} from "./media-utils.js";

import debounce from "lodash/debounce.js";

const APP_CONFIG_FILE_PATH = process.argv
  .find((arg) => arg.includes("config-file"))
  ?.split("=")[1];

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
  }).on("add", debounce(moveAllFiles, 3000));
}

function getFileParts(fileName) {
  const episode = getEpisodeNo(fileName);
  let season = undefined;
  if (!appConfig.disableSeasons) {
    season = getSeasonNo(fileName);
  }
  const extension = getFileExtension(fileName);
  return { episode, season, extension };
}

async function moveAllFiles() {
  const { inputFolder } = appConfig;
  const subDirs = await getSubDirs(inputFolder);
  for (const subDir of subDirs) {
    const subDirName = subDir.split("/")[subDir.split("/").length - 1];
    if (isFolderAnimeMovie(subDirName)) {
      const movieFile = await getMovieOfFolder(subDir);
      if (movieFile) {
        logger.info(
          `Attempting to move movie file: ${movieFile} from ${subDir}`
        );
        await moveMovieFile(subDir, movieFile);
      }
    } else {
      const files = await getFilesOfDir(subDir);
      for (const file of files) {
        logger.info(`Attempting to move ${file} from ${subDir}`);
        await moveEpisodeFile(file);
      }
    }
  }
}

async function moveMovieFile(subDir, movieFile) {
  const splitPath = subDir.split("/");
  const movieName = splitPath[splitPath.length - 1]
    .replace("ANIME-MOVIE", "")
    .trim();
  if (isVideo(movieFile)) {
    const fileParts = getFileParts(movieFile);
    const newFileName = buildMovieFileName(movieName, fileParts.extension);
    await moveFileWithPreparations(movieName, newFileName, movieFile);
  } else {
    logger.debug(`Ignoring, not a video`);
  }
}

async function moveEpisodeFile(path) {
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
      const newFileName = buildEpisodeFileName(
        matchedAnimeName,
        season,
        episode,
        extension
      );
      await moveFileWithPreparations(matchedAnimeName, newFileName, path);
    } catch (e) {
      logger.error(e.message);
    }
  } else {
    logger.debug(`Ignoring, not a video`);
  }
}
async function moveFileWithPreparations(
  matchedAnimeName,
  newFileName,
  sourcePath
) {
  const outputFolder = appConfig.outputFolder;
  const newParent = `${outputFolder}/${matchedAnimeName}`;
  if (!(await fileExists(newParent))) {
    await createFolder(newParent);
  }
  const newPath = `${newParent}/${newFileName}`;
  logger.info(`Moving ${sourcePath} to ${newPath}`);
  await copyFile(sourcePath, newPath);
  await removeFile(sourcePath);
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
}
