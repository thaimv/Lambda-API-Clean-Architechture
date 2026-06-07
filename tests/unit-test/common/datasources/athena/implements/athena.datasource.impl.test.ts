import { GetQueryResultsCommand } from '@aws-sdk/client-athena';
import { describe, expect, it, vi } from 'vitest';

import { AthenaDatasource } from '@/common/datasources/athena/implements/athena.datasource.impl';
import type { QueryResultsInput } from '@/common/types/datasources/athena.type';
import { createMockAppConfig } from '~/common/helpers/app-config.helper';

describe('AthenaDatasource datasource', () => {
  it('should call AthenaDatasource client with GetQueryResultsCommand', async () => {
    const mockSend = vi.fn().mockResolvedValue({ ResultSet: { Rows: [] } });
    const mockClient = { send: mockSend } as any;
    const datasource = new AthenaDatasource(createMockAppConfig(), mockClient);

    const input: QueryResultsInput = {
      QueryExecutionId: 'exec-1',
    };

    const result = await datasource.getQueryResults(input);

    expect(result).toEqual({ ResultSet: { Rows: [] } });
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(expect.any(GetQueryResultsCommand));

    const command = mockSend.mock.calls[0][0] as GetQueryResultsCommand;
    expect(command.input).toEqual(input);
  });

  it('should create default AthenaClient when client is not provided', () => {
    const datasource = new AthenaDatasource(createMockAppConfig());
    expect(datasource).toBeInstanceOf(AthenaDatasource);
  });
});
