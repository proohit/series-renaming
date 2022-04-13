import { pad, writeFile } from "./file-utils.js";
import { logger } from "./logger.js";

const SEPARATOR = "\\.|\\_";

const regExps = {
  season: RegExp(
    `([sS](eason|taffel)?)[${SEPARATOR}]?(?<season>([0-9]{1,2}))`,
    "g"
  ),
  episode: RegExp(
    `([fF]olge|[Ee][Pp](isode)?|e|E|f|F)[${SEPARATOR}]?(?<episode>([0-9]{1,2}))`,
    "g"
  ),
  extension: RegExp(`\\.(?<extension>((avi|mkv|mp4)))`),
};

export function isVideo(fileName) {
  return regExps.extension.test(fileName);
}

export function getEpisodeNo(fileName) {
  const match = regExps.episode.exec(fileName);
  if (match && match.groups && match.groups.episode) {
    return pad(match.groups.episode, 2);
  } else {
    return undefined;
  }
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
