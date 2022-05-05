#!/usr/bin/env node

import { watch } from "chokidar";
import _ from "lodash";
import { checkAnidbDb, searchAnime } from "./anidb.js";
import { loadConfig } from "./config.js";
import {
  buildEpisodeFileName,
  buildMovieFileName,
  copyFile,
  createFolder,
  fileExists,
  getFileExtension,
  getFileNameOfPath,
  getFilesOfDir,
  getParentFolderName,
  isFolderStillLoading,
  removeFile,
} from "./file-utils.js";
import { logger } from "./logger.js";
import {
  createAnidbFile,
  getEpisodeNo,
  getSeasonNo,
  isFolderAnimeMovie,
  isVideo,
} from "./media-utils.js";

const APP_CONFIG_FILE_PATH = process.argv
  .find((arg) => arg.includes("config-file"))
  ?.split("=")[1];

let appConfig = undefined;
const fileJobStatus = new Map();
run();

const getDebouncedByType = (func, wait, options) => {
  const memory = {};

  return (...args) => {
    // use first argument as a key
    // its possible to use all args as a key - e.g JSON.stringify(args) or hash(args)
    const [searchType] = args;

    if (typeof memory[searchType] === "function") {
      return memory[searchType](...args);
    }

    memory[searchType] = _.debounce(func, wait, { ...options, leading: true }); // leading required for return promise
    return memory[searchType](...args);
  };
};

const debouncedHandleFileAdded = getDebouncedByType(handleFileAdded, 3000);

async function run() {
  appConfig = await loadConfig(APP_CONFIG_FILE_PATH);
  const { inputFolder } = appConfig;
  await checkAnidbDb(APP_CONFIG_FILE_PATH, appConfig);
  logger.info(`Watching folder: ${inputFolder}/*/**`);
  watch(`${inputFolder}/*/**`, {
    ignoreInitial: false,
    awaitWriteFinish: true,
  }).on("all", async (eventName, path) => {
    if (eventName === "add" || eventName === "change") {
      const fileName = getFileNameOfPath(path);
      const parentFolder = getParentFolderName(path);
      await debouncedHandleFileAdded(parentFolder, fileName, path);
    }
  });
}

async function handleFileAdded(parentFolderName, fileName, fullSourcePath) {
  logger.debug(`File added: ${fullSourcePath}`);
  const pathOfFile = fullSourcePath.replace(`/${fileName}`, "").trim();
  if (await isFolderStillLoading(pathOfFile)) {
    logger.debug(`${pathOfFile} is still loading. Waiting for it to finish.`);
    return;
  }
  if (isFolderAnimeMovie(parentFolderName)) {
    if (fileName) {
      logger.debug(
        `Attempting to move movie file: ${fileName} from ${fullSourcePath}`
      );
      await moveMovieFile(parentFolderName, fileName, fullSourcePath);
    }
  } else {
    if (fileJobStatus.has(pathOfFile)) {
      logger.debug(`Series ${pathOfFile} is currently being processed`);
      return;
    } else {
      fileJobStatus.set(pathOfFile, true);
      const filesOfSeries = await getFilesOfDir(pathOfFile);
      for (const file of filesOfSeries) {
        logger.debug(
          `Attempting to move episode file: ${fileName} from ${fullSourcePath}`
        );
        await moveEpisodeFile(parentFolderName, getFileNameOfPath(file), file);
      }
      fileJobStatus.delete(pathOfFile);
    }
  }
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

/**
 *
 * @param {string} subDirOfMovie name of the parent folder of the movie
 * @param {string} movieFile name of the movie
 * @param {string} fullSourcePath full source path of the file
 */
async function moveMovieFile(subDirOfMovie, movieFile, fullSourcePath) {
  const movieName = subDirOfMovie.replace("ANIME-MOVIE", "").trim();
  if (isVideo(movieFile)) {
    const fileParts = getFileParts(movieFile);
    const newFileName = buildMovieFileName(movieName, fileParts.extension);
    const outputFolder = appConfig.outputFolderMovies;
    await moveFileWithPreparations(
      outputFolder,
      movieName,
      newFileName,
      fullSourcePath
    );
  } else {
    logger.debug(`Ignoring, not a video`);
  }
}

/**
 *
 * @param {string} parentFolderName name of the parent folder of the file
 * @param {string} fileName name of the file
 * @param {string} fullSourcePath full source path of the file
 */
async function moveEpisodeFile(parentFolderName, fileName, fullSourcePath) {
  if (isVideo(fileName) && !fileJobStatus.has(fullSourcePath)) {
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
      const outputFolder = appConfig.outputFolder;
      await moveFileWithPreparations(
        outputFolder,
        matchedAnimeName,
        newFileName,
        fullSourcePath
      );
    } catch (e) {
      logger.error(e.message);
    }
  } else {
    logger.debug(`Ignoring, not a video or currently in progress`);
  }
}
async function moveFileWithPreparations(
  outputFolder,
  matchedAnimeName,
  newFileName,
  sourcePath
) {
  const newParent = `${outputFolder}/${matchedAnimeName}`;
  if (!(await fileExists(newParent))) {
    await createFolder(newParent);
  }
  const newPath = `${newParent}/${newFileName}`;
  logger.info(`Moving ${sourcePath} to ${newPath}`);
  fileJobStatus.set(sourcePath, true);
  copyFile(sourcePath, newPath);
  removeFile(sourcePath);
  fileJobStatus.delete(sourcePath);
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
