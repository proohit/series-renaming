#!/usr/bin/env node

import fs from 'fs';
import prompts from 'prompts';
import { program } from 'commander';

const FILE_EXTENSIONS = ['.mkv', '.avi', '.mp4'];
const FILE_EXTENSIONS_REG = new RegExp(FILE_EXTENSIONS.join('|'));
const EP_REG_FULL = RegExp(/(e|E)(?<episode>\d{1,})/);
const EP_REG_IMPLICIT = /(\_|\.)(?<episode>\d{1,})(\_|\.)/;
const EP_REGS = [EP_REG_FULL, EP_REG_IMPLICIT];

program
  .option('-i, --interactive')
  .option('-f, --folder <folder>')
  .option('-n, --name <name>')
  .option('-s, --season <season>')
  .option('-p, --preview')
  .parse();

let opts = program.opts();

if (opts.interactive) {
  runInteractively();
} else {
  runNormally();
}

function runNormally() {
  const { dir, name, season, preview } = opts;
  validateOptions(dir, name);
  renameFilesInFolder(dir, name, season, preview);
}

async function runInteractively() {
  const questions = [
    {
      message: 'Video folder path: ',
      type: 'text',
      name: 'dir',
      initial: opts.folder,
    },
    {
      message: 'Series name',
      type: 'text',
      name: 'name',
      initial: opts.name,
    },
    {
      message: 'Season',
      type: 'number',
      name: 'season',
      initial: opts.season,
    },
  ];
  const response = await prompts(questions);
  const { dir, name, season } = response;
  const { preview } = opts;
  validateOptions(dir, name);
  renameFilesInFolder(dir, name, season, preview);
}

function validateOptions(dir, name) {
  if (!dir || !name) {
    program.help();
  }
}

function renameFilesInFolder(dir, name, season, preview) {
  console.log(`${preview ? 'PREVIEW ' : ''}Running renaming on path:
    ${dir}
    with name:
    ${name}
    `);

  const files = fs.readdirSync(dir);
  files.forEach((fileName, index) => {
    if (!isVideo(fileName)) {
      return;
    }
    const episode = pad(getEpisodeNo(fileName) || index, 2);
    renameFile(fileName, episode, dir, name, season, preview);
  });
}

function renameFile(currentFileName, episode, dir, name, season, preview) {
  const fileEnding = getFileExtension(currentFileName);

  const filePath = dir + '/' + currentFileName;
  const newFileName = buildFileName(name, season, episode, fileEnding);
  const newFilePath = `${dir}/${newFileName}`;

  console.info(`Renaming ${currentFileName} to ${newFileName}`);
  if (preview) {
    return;
  } else {
    fs.renameSync(filePath, newFilePath);
  }
}

function buildFileName(name, season, episode, fileEnding) {
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
function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function isVideo(fileName) {
  for (const reg of EP_REGS) {
    if (reg.test(fileName) && FILE_EXTENSIONS_REG.test(fileName)) {
      return true;
    }
  }
  return false;
}

function getEpisodeNo(fileName) {
  for (const reg of EP_REGS) {
    let match = reg.exec(fileName);
    if (match && match.length > 0 && match.groups) {
      return match.groups.episode;
    }
  }
}

function getFileExtension(fileName) {
  const match = FILE_EXTENSIONS_REG.exec(fileName);
  if (match && match.length > 0) {
    return match[0];
  }
}
