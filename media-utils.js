import stringSimilarity from "string-similarity";
import { pad } from "./file-utils.js";
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

function createAnidbFile(dir, anidbid, preview) {
  logger.info(
    `${preview ? "PREVIEW" : ""}Writing anidb.id file with id ${anidbid}`
  );
  if (!preview) {
    fs.writeFileSync(`${dir}/anidb.id`, anidbid);
  }
}
