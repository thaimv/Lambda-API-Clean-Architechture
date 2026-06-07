import path from 'path';

export function isFilePath(filePath: string): boolean {
  return !filePath.endsWith('/');
}

export function getFileName(filePath: string): string {
  return path.basename(filePath);
}

export function joinPaths(...paths: string[]): string {
  return paths
    .map((p, i) => {
      if (i < paths.length - 1) {
        return p.replace(/\/$/, '');
      }
      return p;
    })
    .filter((p) => p)
    .join('/');
}

export function getRelativePathFromBase(basePath: string, fullPath: string): string {
  const base = basePath.replace(/\/$/, '');

  if (fullPath === base) {
    return '';
  }

  if (fullPath.startsWith(base + '/')) {
    return fullPath.substring(base.length + 1);
  }

  return fullPath;
}
