export class ApiResponseDto<T> {
  success: boolean;
  data: T;
  message?: string;

  constructor(data: T, message?: string) {
    this.success = true;
    this.data = data;
    if (message) {
      this.message = message;
    }
  }
}

export class ApiErrorResponseDto {
  success: boolean;
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp?: string;
  path?: string;

  constructor(statusCode: number, message: string | string[], error: string) {
    this.success = false;
    this.statusCode = statusCode;
    this.message = message;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }
}
