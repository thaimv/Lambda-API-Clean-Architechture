import fs from 'fs';
import path from 'path';

import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import {
  fileTypeBuffer,
  getFileDetails,
  readFile,
  reGenerateFolder,
  removeFolder,
  writeFile,
} from '@/common/utils/file.util';

describe('File Utility Functions', () => {
  const folderPath = path.join(__dirname, 'tmp-test');
  const fileName = 'hello.txt';
  const filePath = path.join(folderPath, fileName);
  const content = 'Hello, World!';

  beforeEach(async () => {
    try {
      await fs.promises.rm(folderPath, { recursive: true, force: true });
      await fs.promises.mkdir(folderPath, { recursive: true });
    } catch {
      await fs.promises.mkdir(folderPath, { recursive: true });
    }

    await fs.promises.writeFile(filePath, content);
  });

  afterEach(async () => {
    await fs.promises.rm(folderPath, { recursive: true, force: true });
  });

  test('getFileDetails: Should return file stats', async () => {
    const fileDetails = await getFileDetails(filePath);
    const stats = await fs.promises.stat(filePath);

    expect(fileDetails).toEqual(stats);
  });

  test('readFile: Should read file contents', async () => {
    const mockData = Buffer.from(content);
    const data = await readFile(filePath);

    expect(data).toEqual(mockData);
  });

  test('writeFile: Should write data to file', async () => {
    const mockData = Buffer.from(content);
    await writeFile(filePath, mockData);
    const data = await fs.promises.readFile(filePath);

    expect(data).toEqual(mockData);
  });

  test('reGenerateFolder: Should recreate existing folder', async () => {
    await reGenerateFolder(folderPath);

    expect(folderPath).toEqual(folderPath);
  });

  test('removeFolder: Should remove folder', async () => {
    const folderRemovePath = path.join(__dirname, 'tmp-folder-remove-test');
    await fs.promises.mkdir(folderRemovePath, { recursive: true });

    await removeFolder(folderRemovePath);
    expect(folderPath).toEqual(folderPath);
  });

  test('fileTypeBuffer: Should return file type info', async () => {
    const file = await fs.promises.readFile(filePath);
    const fileTypeResult = await fileTypeBuffer(file);

    expect(fileTypeResult).toEqual(undefined);
  });
});
