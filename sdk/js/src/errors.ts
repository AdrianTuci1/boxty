/**
 * Error types for the Boxty SDK.
 */

export class BoxtyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BoxtyError";
  }
}

export class BoxtyAPIError extends BoxtyError {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "BoxtyAPIError";
    this.statusCode = statusCode;
  }
}

export class BoxtyConnectionError extends BoxtyError {
  constructor(message: string = "Connection error") {
    super(message);
    this.name = "BoxtyConnectionError";
  }
}
