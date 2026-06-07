import { describe, expect, test } from 'vitest';

import {
  getFileName,
  getRelativePathFromBase,
  isFilePath,
  joinPaths,
} from '@/common/utils/s3-path.util';

describe('s3-path.util', () => {
  test('isFilePath detects file vs directory paths', () => {
    expect(isFilePath('folder/file.txt')).toBe(true);
    expect(isFilePath('folder/')).toBe(false);
  });

  test('getFileName returns basename', () => {
    expect(getFileName('folder/nested/file.txt')).toBe('file.txt');
  });

  test('joinPaths joins path segments', () => {
    expect(joinPaths('a/', 'b/', 'c')).toBe('a/b/c');
  });

  test('getRelativePathFromBase returns relative path', () => {
    expect(getRelativePathFromBase('base/path', 'base/path/file.txt')).toBe('file.txt');
    expect(getRelativePathFromBase('base/path', 'base/path')).toBe('');
    expect(getRelativePathFromBase('other', 'base/path/file.txt')).toBe('base/path/file.txt');
  });
});
