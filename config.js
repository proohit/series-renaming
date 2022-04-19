import { fileExists, loadAndParseJson, writeFile } from "./file-utils.js";

export async function loadConfig(appConfigFilePath) {
  const appConfigExists = await fileExists(appConfigFilePath);
  if (appConfigExists) {
    return loadAndParseJson(appConfigFilePath);
  } else {
    throw new Error(`Config file not found: ${appConfigFilePath}`);
  }
}

export async function updateConfig(appConfigFilePath, config) {
  return writeFile(appConfigFilePath, JSON.stringify(config));
}
