// @ts-nocheck — template file; path aliases resolve correctly in generated output under tests/
import { describe, expect, it } from 'vitest';

import { <schemaName> } from '@/modules/<module>/dtos/requests/<name>.request.dto';

describe('<schemaName>', () => {
  it('accepts valid input', () => {
    const result = <schemaName>.safeParse({
      input: { fieldName: 'valid_value' },
    });

    expect(result.success).toBe(true);
  });

  it('trims whitespace from string fields', () => {
    const result = <schemaName>.safeParse({
      input: { fieldName: '  valid_value  ' },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.input.fieldName).toBe('valid_value');
    }
  });

  it('rejects empty required field after trim', () => {
    const result = <schemaName>.safeParse({
      input: { fieldName: '   ' },
    });

    expect(result.success).toBe(false);
  });

  it('rejects missing required field', () => {
    const result = <schemaName>.safeParse({ input: {} });

    expect(result.success).toBe(false);
  });

  it('rejects invalid format / out-of-range value', () => {
    const result = <schemaName>.safeParse({
      input: { fieldName: 'x'.repeat(256) }, // exceeds max length
    });

    expect(result.success).toBe(false);
  });
});
