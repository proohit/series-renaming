import { getFilesOfDir, pad, writeFile } from "./file-utils.js";
import { logger } from "./logger.js";

const SEPARATOR = "\\.|\\_";

const EPISODE_NUMBER = "(?<episode>([0-9]{1,2}))";

const regExps = {
  get season() {
    return RegExp(
      `([sS](eason|taffel)?)[${SEPARATOR}]?(?<season>([0-9]{1,2}))`,
      "g"
    );
  },
  get episode() {
    return RegExp(
      `([fF]olge|[Ee][Pp](isode)?|e|E|f|F)[${SEPARATOR}]?${EPISODE_NUMBER}`,
      "g"
    );
  },
  get episodeFree() {
    return RegExp(`[${SEPARATOR}]${EPISODE_NUMBER}[${SEPARATOR}]`, "g");
  },
  get extension() {
    return RegExp(`\\.(?<extension>((avi|mkv|mp4)))`);
  },
};

export function isVideo(fileName) {
  const match = regExps.extension.exec(fileName);
  if (match && match.length > 0) {
    return true;
  }
  return false;
}

export function isFolderAnimeMovie(fileName) {
  return fileName.includes("ANIME-MOVIE");
}

export async function getMovieOfFolder(fileName) {
  const files = await getFilesOfDir(fileName);
  return files.find((file) => isVideo(file));
}

export function getEpisodeNo(fileName) {
  const match = regExps.episode.exec(fileName);
  if (match && match.groups && match.groups.episode) {
    return pad(match.groups.episode, 2);
  }

  const matchFree = regExps.episodeFree.exec(fileName);
  if (matchFree && matchFree.groups && matchFree.groups.episode) {
    return pad(matchFree.groups.episode, 2);
  }

  return undefined;
}

export function getSeasonNo(fileName) {
  const match = regExps.season.exec(fileName);
  if (match && match.groups && match.groups.season) {
    return pad(match.groups.season, 2);
  }
  return undefined;
}

export async function createAnidbFile(dir, anidbid) {
  logger.info(`Writing anidb.id file with id ${anidbid} to ${dir}/anidb.id`);
  await writeFile(`${dir}/anidb.id`, anidbid);
}
