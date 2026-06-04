export class BoxtyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BoxtyError';
  }
}

export class AuthenticationError extends BoxtyError {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends BoxtyError {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}
