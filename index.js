#!/usr/bin/env node

/**
 * can have 3 arguments
 * 1. argument is the directory path
 * 2. argument is the name of each file
 * 3. season number
 */
import fs from 'fs';
import { exit } from 'process';
import promptSync from 'prompt-sync';

const prompt = promptSync({ sigint: true });

const fileEndings = ['avi', 'mkv', 'mp4'];
const args = process.argv.slice(2, process.argv.length);

const isInteractive = !!args.find(
  (arg) => arg === '--interactive' || arg === '-i'
);

let dir, name, season, epOffset;

if (isInteractive) {
  dir = prompt('Video folder path:');
  name = prompt('Series name:');
  season = pad(prompt('Season:'), 2);
  epOffset = Number(prompt('offset:'));
} else {
  const dirArg = args.findIndex((arg) => arg === '--folder' || arg === '-f');
  const nameArg = args.findIndex((arg) => arg === '--name' || arg === '-n');
  const seasonArg = args.findIndex((arg) => arg === '--season' || arg === '-s');
  const offsetArg = args.findIndex((arg) => arg === '--offset' || arg === '-o');
  dir = args[dirArg + 1];
  name = args[nameArg + 1];
  season = args[seasonArg + 1];
  if (offsetArg > 0) {
    epOffset = Number(args[offsetArg + 1]);
  } else {
    epOffset = 0;
  }
  if (!dirArg || !nameArg || !seasonArg || args.length < 6) {
    exitInvalidInput();
  }
}

const isPreview = !!args.find((arg) => arg === '--preview' || arg === '-p');

if (!dir || !name || !season) {
  exitInvalidInput();
}

console.log(`${isPreview && 'PREVIEW'} Running renaming on path: 
  ${dir}
  with name:
  ${name}
  offset: ${epOffset}
  `);

const files = fs.readdirSync(dir);
files.forEach((fileName, index) => {
  const fileEnding = fileEndings.filter((ending) =>
    fileName.includes(ending)
  )[0];

  const fileNo = pad(index + epOffset + 1, 2);
  const filePath = dir + '/' + fileName;
  const newFileName = `${name} S${season}E${fileNo}.${fileEnding}`;
  const newFile = `${dir}/${newFileName}`;

  console.info(`Renaming ${fileName} to ${newFileName}`);
  if (isPreview) {
    return;
  } else {
    fs.renameSync(filePath, newFile);
  }
});

function exitInvalidInput() {
  console.error('Invalid inputs. arguments: --folder|-f --name|-n --season|-s');
  exit();
}

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
