const FILE_EXTENSIONS = [".mkv", ".avi", ".mp4"];
const FILE_EXTENSIONS_REG = new RegExp(FILE_EXTENSIONS.join("|"));

export function buildFileName(name, season, episode, fileEnding) {
  let fileName = `${name} `;
  if (season && season !== 0) {
    fileName = `${fileName}S${season}`;
  }
  if (episode && episode !== 0) {
    fileName = `${fileName}E${episode}`;
  }
  fileName = `${fileName}${fileEnding}`;
  return fileName;
}

export function pad(n, width, z) {
  z = z || "0";
  n = n + "";
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

export function getFileExtension(fileName) {
  const match = FILE_EXTENSIONS_REG.exec(fileName);
  if (match && match.length > 0) {
    return match[0];
  }
}
