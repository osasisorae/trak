import { describe, it, expect } from 'vitest';
import { TrakError, ErrorCode, handleError } from '../../../src/services/errorHandler.js';

describe('Error Handler', () => {
  it('should handle file not found errors', () => {
    const error = new Error('ENOENT: no such file or directory');
    const trakError = handleError(error, 'test context');
    
    expect(trakError.code).toBe(ErrorCode.FILE_NOT_FOUND);
    expect(trakError.message).toContain('test context');
  });

  it('should handle JSON parse errors', () => {
    const error = new Error('Unexpected token in JSON');
    const trakError = handleError(error, 'parsing config');
    
    expect(trakError.code).toBe(ErrorCode.PARSE_ERROR);
    expect(trakError.message).toContain('parsing config');
  });

  it('should preserve existing TrakError instances', () => {
    const originalError = new TrakError(ErrorCode.VALIDATION_ERROR, 'test message');
    const result = handleError(originalError, 'context');
    
    expect(result).toBe(originalError);
  });
});
