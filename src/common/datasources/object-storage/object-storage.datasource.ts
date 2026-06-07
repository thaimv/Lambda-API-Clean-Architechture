import type { Readable } from 'stream';

import type {
  ListObjectsInput,
  ListObjectsOutput,
  ObjectStorageCrossAccountConfig,
  PutObjectInput,
  PutObjectOutput,
} from '@/common/types/datasources/object-storage.type';

export interface IObjectStorageConnectorDatasource {
  connect(config: ObjectStorageCrossAccountConfig): Promise<IObjectStorageDatasource>;
}

export interface IObjectStorageDatasource {
  getFile(bucket: string, key: string, encoding?: string): Promise<string>;
  getFileAsStream(bucket: string, key: string): Promise<Readable>;
  listObjects(input: ListObjectsInput, getAllObjects?: boolean): Promise<ListObjectsOutput>;
  deleteObject(bucket: string, key: string): Promise<void>;
  deleteObjects(bucket: string, keys: string[]): Promise<void>;
  putObject(input: PutObjectInput): Promise<PutObjectOutput>;
  getFileAsBuffer(bucket: string, key: string): Promise<Buffer>;
  deleteDirectory(bucket: string, prefix: string): Promise<void>;
  multipartUpload(input: PutObjectInput): Promise<PutObjectOutput>;
}

/** @deprecated Use IObjectStorageDatasource */
export type IS3Bucket = IObjectStorageDatasource;
