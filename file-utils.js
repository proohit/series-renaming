import fs from "fs";
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

export function fileExists(filePath) {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

export function createFolder(folderPath) {
  return new Promise((resolve, reject) => {
    fs.mkdir(folderPath, { recursive: true }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function moveFile(source, destination) {
  return new Promise((resolve, reject) => {
    fs.rename(source, destination, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function copyFile(source, destination) {
  return new Promise((resolve, reject) => {
    fs.copyFile(source, destination, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function removeFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function writeFile(filePath, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, content, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

export function loadAndParseJson(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
}

export async function getSubDirs(dirPath) {
  const subFiles = await new Promise((resolve, reject) => {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
  const subDirs = await Promise.all(
    subFiles.map((file) => {
      return new Promise((resolve, reject) => {
        const filePath = `${dirPath}/${file}`;
        fs.stat(filePath, (err, stats) => {
          if (err) {
            reject(err);
          } else {
            resolve({ path: filePath, stats });
          }
        });
      });
    })
  );
  return subDirs
    .filter(({ stats }) => stats.isDirectory())
    .map(({ path }) => path);
}

export async function getFilesOfDir(dirPath) {
  const files = await new Promise((resolve, reject) => {
    fs.readdir(dirPath, (err, filesInDir) => {
      if (err) {
        reject(err);
      } else {
        resolve(filesInDir);
      }
    });
  });
  const subDirs = await Promise.all(
    files.map((file) => {
      return new Promise((resolve, reject) => {
        const filePath = `${dirPath}/${file}`;
        fs.stat(filePath, (err, stats) => {
          if (err) {
            reject(err);
          } else {
            resolve({ path: filePath, stats });
          }
        });
      });
    })
  );
  return subDirs.filter(({ stats }) => stats.isFile()).map(({ path }) => path);
}
