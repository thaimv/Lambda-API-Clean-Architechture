import { injectable, unmanaged } from 'inversify';

import { APP_CONST } from '@/common/constants/app.const';
import type { IDBClient } from '@/common/datasources/database/db-client.datasource';
import type {
  TCursorPaginationResponse,
  TCursorPaginator,
  TPaginationResponse,
  TPaginator,
} from '@/common/types/app.type';

@injectable()
export class BaseRepo<T> {
  constructor(
    protected readonly dbClient: IDBClient,
    @unmanaged() protected readonly modelName: string,
  ) {
    this.dbClient = dbClient;
    this.modelName = modelName;
  }

  private async getModel() {
    return (await this.dbClient.getClient())[this.modelName];
  }

  public async paginate<TFindManyArgs>(
    findManyArgs: TFindManyArgs,
    { page = 1, pageSize = APP_CONST.PAGE_SIZE }: TPaginator,
  ): Promise<TPaginationResponse<T>> {
    const model = await this.getModel();
    const total = await model.count({ ...findManyArgs });
    const items = await model.findMany({
      ...findManyArgs,
      skip: pageSize * (page - 1),
      take: pageSize,
    });

    return {
      items,
      totalItems: total,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  private encodeCursor(data: object, fields: string[]): string {
    return btoa(
      JSON.stringify(fields.reduce((acc, field) => ({ ...acc, [field]: data[field] }), {})),
    );
  }

  private decodeCursor(cursor: string): object | undefined {
    if (!cursor) {
      return undefined;
    }
    const parsedCursor = JSON.parse(atob(cursor));
    return parsedCursor;
  }

  public async paginateCursor<TFindManyArgs>(
    findManyArgs: TFindManyArgs,
    {
      nextCursor = null,
      prevCursor = null,
      pageSize = APP_CONST.PAGE_SIZE,
      orderDirection = 'desc',
      orderField = 'id',
    }: TCursorPaginator,
  ): Promise<TCursorPaginationResponse<T>> {
    const model = await this.getModel();

    const parsedCursor = this.decodeCursor(nextCursor || prevCursor || '');

    const items = await model.findMany({
      ...findManyArgs,
      cursor: parsedCursor,
      take: pageSize * (prevCursor ? -1 : 1),
      skip: nextCursor || prevCursor ? 1 : 0,
      orderBy: { [orderField]: orderDirection },
    });

    const lastItem = items.length ? items[items.length - 1] : null;
    const firstItem = items.length ? items[0] : null;

    return {
      items,
      orderField,
      orderDirection,
      pageSize,
      nextCursor: lastItem ? this.encodeCursor(lastItem, ['id', orderField]) : null,
      prevCursor: firstItem ? this.encodeCursor(firstItem, ['id', orderField]) : null,
    };
  }
}
