import fs from 'fs';
import path from 'path';

/**
 * @async
 * @function getFileDetails
 * @description Retrieves details about a file.
 * @param {string} filePath - The path to the file.
 * @returns {Promise<fs.Stats>} - A promise that resolves to the file stats object.
 */
export async function getFileDetails(filePath: string): Promise<fs.Stats> {
  const stats = await fs.promises.stat(filePath);
  return stats;
}

/**
 * @async
 * @function readFile
 * @description Reads the entire contents of a file.
 * @param {string} filePath - The path to the file.
 * @returns {Promise<Buffer>} - A promise that resolves to a Buffer containing the file data.
 */
export const readFile = async (filePath: string): Promise<Buffer> => {
  const data = await fs.promises.readFile(filePath);
  return data;
};

/**
 * @async
 * @function writeFile
 * @description Writes data to a file, replacing any existing content.
 * @param {string} filePath - The path to the file.
 * @param {Buffer} data - The data to write to the file.
 * @returns {Promise<void>} - A promise that resolves when the data has been written.
 */
export const writeFile = async (filePath: string, data: Buffer): Promise<void> => {
  const dir = path.dirname(filePath);
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(filePath, data);
};

/**
 * @async
 * @function reGenerateFolder
 * @description Removes a folder and its contents if it exists, then recreates the folder.
 * @param {string} folderPath - The path to the folder.
 * @returns {Promise<void>} - A promise that resolves when the folder has been regenerated.
 */
export const reGenerateFolder = async (folderPath: string): Promise<void> => {
  await fs.promises.rm(folderPath, { recursive: true, force: true });
  await fs.promises.mkdir(folderPath, { recursive: true });
};

/**
 * @async
 * @function removeFolder
 * @description Asynchronously removes a folder and its contents.  No error is thrown if the folder does not exist.
 * @param {string} folderPath - The path to the folder to remove.
 * @returns {Promise<void>} - A promise that resolves when the folder and its contents are successfully removed, or immediately if the folder doesn't exist.
 */
export const removeFolder = async (folderPath: string): Promise<void> => {
  await fs.promises.rm(folderPath, { recursive: true, force: true });
};

/**
 * @async
 * @function fileTypeBuffer
 * @description Determines the file type from a buffer.
 * @param {Buffer} buff - The buffer to check.
 * @returns {Promise<{ext: string, mime: string} | undefined>} - A promise that resolves to the file type information or undefined if the type cannot be determined.
 */
export const fileTypeBuffer = async (
  buff: Buffer,
): Promise<{ ext: string; mime: string } | undefined> => {
  const { fileTypeFromBuffer } = await import('file-type');
  const fileType = await fileTypeFromBuffer(buff);
  return fileType;
};
