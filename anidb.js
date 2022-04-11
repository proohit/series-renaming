import fetch from "node-fetch";
import fs from "fs";
import xml from "xml2js";
import gunzip from "gunzip-maybe";
import { findMatchedAnime } from "./media-utils.js";

let anidbDb = null;

async function downloadAnidbDb() {
  const anidbDbArchive = await fetch(
    "http://anidb.net/api/anime-titles.xml.gz"
  );
  if (fs.existsSync("anime-titles.xml")) {
    return fs.readFileSync("anime-titles.xml").toString();
  }
  let string = "";
  return new Promise((resolve, reject) => {
    anidbDbArchive.body
      .pipe(gunzip())
      .pipe(fs.createWriteStream("anime-titles.xml"))
      .on("data", (chunk) => (string += chunk))
      .on("end", () => {
        resolve(string);
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

function loadAnidbDb(aniDbXml) {
  return xml.parseStringPromise(aniDbXml);
}

const getAnimeTitles = (database) => {
  return database.animetitles.anime.map((anime) =>
    anime.title.map((animeTitles) => animeTitles["_"])
  );
};

const findAnimeByTitle = (database, title) => {
  return anidbDb.animetitles.anime.find((anime) =>
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

export async function searchAnime(title) {
  if (!anidbDb) {
    const animeTitles = await downloadAnidbDb();
    anidbDb = await loadAnidbDb(animeTitles);
  }

  const flatTitles = getAnimeTitles(anidbDb)
    .flat()
    .map((flatTitle) => flatTitle.toLowerCase());
  const match = findMatchedAnime(flatTitles, title);
  const matchedAnime = findAnimeByTitle(anidbDb, match);
  console.log(anidbEntryToFriendlyObject(matchedAnime).titles);
}

searchAnime("the rising of the shield");
