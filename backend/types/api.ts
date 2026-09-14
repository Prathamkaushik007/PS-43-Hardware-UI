/**
 * Standard API response and error structures
 */

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp: string;
  };
}

export interface APIError {
  code: string;
  message: string;
  details?: unknown;
}
