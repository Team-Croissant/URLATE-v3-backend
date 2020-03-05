"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createSuccessResponse(result) {
    return { result: result };
}
exports.createSuccessResponse = createSuccessResponse;
function createErrorResponse(result, error, description) {
    return { result: result, error: error, description: description };
}
exports.createErrorResponse = createErrorResponse;
