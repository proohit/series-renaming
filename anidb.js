import fs from "fs";
import gunzip from "gunzip-maybe";
import fetch from "node-fetch";
import xml from "xml2js";
import { fileExists, readFile, updateConfig, writeFile } from "./file-utils.js";
import { logger } from "./logger.js";

let anidbDb = null;

async function downloadAnidbDb() {
  const anidbDbArchive = await fetch(
    "http://anidb.net/api/anime-titles.xml.gz"
  );
  let string = "";
  return new Promise((resolve, reject) => {
    anidbDbArchive.body
      .pipe(gunzip())
      .on("data", (chunk) => (string += chunk))
      .on("end", () => {
        resolve(string);
      })
      .on("error", reject);
  });
}
function saveAnidbDb(anidbXml) {
  return writeFile("anime-titles.xml", anidbXml);
}
async function loadLocalAnidbDb() {
  return (await readFile("anime-titles.xml")).toString();
}

function parseAnidbDb(anidbXml) {
  return xml.parseStringPromise(anidbXml);
}

const getAnimeTitles = (database) => {
  return database.animetitles.anime.map((anime) =>
    anime.title.map((animeTitles) => animeTitles["_"])
  );
};

const findAnimeByTitle = (database, title) => {
  return database.animetitles.anime.find((anime) =>
    anime.title
      .map((animeTitles) => animeTitles["_"].toLowerCase())
      .includes(title)
  );
};

/**
 *
 * @param {*} anidbEntry
 * @returns {{aid: string; titles: {title: string; lang: string; type: string;}[]}}
 */
const anidbEntryToFriendlyObject = (anidbEntry) => {
  return {
    aid: anidbEntry["$"].aid,
    titles: anidbEntry.title.map((title) => ({
      title: title["_"],
      lang: title["$"]["xml:lang"],
      type: title["$"].type,
    })),
  };
};

/**
 *
 * @param {Date} latestDownloadTime
 * @returns
 */
async function shouldDownloadAnidbDb(latestDownloadTime) {
  const REDOWNLOAD_THRESHOLD = 1000 * 60 * 60 * 24 * 3; // 3 days
  const localDbExists = await fileExists("anime-titles.xml");
  if (
    !localDbExists ||
    !latestDownloadTime ||
    typeof latestDownloadTime !== "number"
  ) {
    return true;
  }

  const downloadTimeDifference = new Date().getTime() - latestDownloadTime;

  logger.debug(
    `Download date difference: ${downloadTimeDifference}ms. Threshold: ${REDOWNLOAD_THRESHOLD}ms`
  );

  return downloadTimeDifference > REDOWNLOAD_THRESHOLD;
}

export async function searchAnime(title) {
  const matchedAnime = findAnimeByTitle(anidbDb, title);
  console.log(anidbEntryToFriendlyObject(matchedAnime).titles);
}

export async function checkAnidbDb(appConfigFilePath, appConfig) {
  let anidbXml = undefined;
  let updatedConfig = false;
  if (shouldDownloadAnidbDb(appConfig.latestAnidbDownloadTime)) {
    logger.debug("Downloading anidb db");
    anidbXml = await downloadAnidbDb();
    logger.debug("Saving anidb db");
    await saveAnidbDb(anidbXml);
    appConfig.latestAnidbDownloadTime = new Date().getTime();
    logger.debug("Updating config with new latest anidb db download time");
    await updateConfig(appConfigFilePath, appConfig);
    updatedConfig = true;
  } else {
    logger.debug("Loading local anidb db");
    anidbXml = await loadLocalAnidbDb();
  }
  anidbDb = await parseAnidbDb(anidbXml);
  return updatedConfig;
}
