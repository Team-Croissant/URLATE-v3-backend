interface ResponseBase {
  result: string;
}

export interface SuccessResponse extends ResponseBase {
  // TODO: 무언가 추가될 일이 있는가?
}

export interface ErrorResponse extends ResponseBase {
  error: string,
  description: string,
}

export interface StatusResponse {
  status: string
}

export type ApiResponse = SuccessResponse | ErrorResponse | StatusResponse;

export function createSuccessResponse(result: string): SuccessResponse {
  return { result };
}

export function createErrorResponse(result: string, error: string, description: string): ErrorResponse {
  return { result, error, description };
}

export function createStatusResponse(status: string): StatusResponse {
  return { status };
}