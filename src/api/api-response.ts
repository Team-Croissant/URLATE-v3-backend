interface ResponseBase {
  // TODO: result는 무엇을 의미하는가?
  result: string;
}

export interface SuccessResponse extends ResponseBase {
  // TODO: 무언가 추가될 일이 있는가?
}

export interface ErrorResponse extends ResponseBase {
  error: string,
  // TODO error_description -> description 마이그레이션 필요
  // ? description이라는 필드는 무엇에 대한 설명인지 불분명함
  // ? error와 description 간 목적 차이에 대한 문서화가 필요
  description: string,
}

export type ApiResponse = SuccessResponse | ErrorResponse;

export function createSuccessResponse(result: string): SuccessResponse {
  return { result };
}

export function createErrorResponse(result: string, error: string, description: string): ErrorResponse {
  return { result, error, description };
}