export enum ErrorCode {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PARSE_ERROR = 'PARSE_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DAEMON_ERROR = 'DAEMON_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

export class TrakError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'TrakError';
  }
}

export function handleError(error: unknown, context: string): TrakError {
  if (error instanceof TrakError) return error;
  
  if (error instanceof Error) {
    if (error.message.includes('ENOENT')) {
      return new TrakError(ErrorCode.FILE_NOT_FOUND, `File not found in ${context}`, error);
    }
    if (error.message.includes('JSON')) {
      return new TrakError(ErrorCode.PARSE_ERROR, `Parse error in ${context}`, error);
    }
    return new TrakError(ErrorCode.API_ERROR, `${context}: ${error.message}`, error);
  }
  
  return new TrakError(ErrorCode.API_ERROR, `Unknown error in ${context}`);
}

export function logError(error: TrakError): void {
  console.error(`❌ [${error.code}] ${error.message}`);
  if (error.cause) {
    console.error(`   Caused by: ${error.cause.message}`);
  }
}
