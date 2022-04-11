import stringSimilarity from "string-similarity";

const EP_REG_FULL = RegExp(/[e|E]?[p|P]?(?<episode>\d{1,})/);
const SEASON_REG_FULL = RegExp(/[s|S]?(?<season>\d{1,})/);
const EP_REG_ANY = new RegExp(["DTS", "bluray"].join("|"));
const EP_REGS = [EP_REG_FULL];

export function isVideo(fileName) {
  for (const reg of EP_REGS) {
    if (
      (reg.test(fileName) || EP_REG_ANY.test(fileName)) &&
      FILE_EXTENSIONS_REG.test(fileName)
    ) {
      return true;
    }
  }
  return false;
}

export function getEpisodeNo(fileName) {
  for (const reg of EP_REGS) {
    let match = reg.exec(fileName);
    if (match && match.length > 0 && match.groups) {
      return match.groups.episode;
    }
  }
  throw new Error(`Could not find episode number in file: ${fileName}`);
}

/**
 *
 * @param {string[]} animes
 * @param {string} fileName
 * @returns {string}
 */
export function findMatchedAnime(animes, fileName) {
  const animesLowerCase = animes.map((anime) => anime.toLowerCase());
  const fileNameLowerCase = fileName.toLowerCase();
  const result = stringSimilarity.findBestMatch(
    fileNameLowerCase,
    animesLowerCase
  );

  const foundIndex = animesLowerCase.findIndex(
    (anime) => anime === result.bestMatch.target
  );
  if (foundIndex !== -1) {
    return animes[foundIndex];
  }
}

function createAnidbFile(dir, anidbid, preview) {
  logger.info(
    `${preview ? "PREVIEW" : ""}Writing anidb.id file with id ${anidbid}`
  );
  if (!preview) {
    fs.writeFileSync(`${dir}/anidb.id`, anidbid);
  }
}
