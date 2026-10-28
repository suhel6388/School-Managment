export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function assert(condition: unknown, message: string, status = 400): asserts condition {
  if (!condition) throw new ApiError(status, message);
}
