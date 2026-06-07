import type { Readable } from 'stream';

export interface IObjectStorageUploadDatasource {
  uploadFileWithStream(bucketName: string, filePath: string, stream: Readable): Promise<void>;
  uploadFile(bucketName: string, filePath: string, buffer: Buffer): Promise<void>;
}
