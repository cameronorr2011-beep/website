export class CultureTraceError extends Error {
  constructor(code, message, { recoverable = true, details = null } = {}) {
    super(message);
    this.name = "CultureTraceError";
    this.code = code;
    this.recoverable = recoverable;
    this.details = details;
  }
}

export class CultureTraceValidationError extends CultureTraceError {
  constructor(message, errors = [], options = {}) {
    super("VALIDATION_ERROR", message, { ...options, details: errors });
    this.name = "CultureTraceValidationError";
    this.errors = errors;
  }
}
