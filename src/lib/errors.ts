export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Données invalides", fieldErrors?: Record<string, string[]>) {
    super(message, "VALIDATION_ERROR", fieldErrors);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Ressource introuvable") {
    super(message, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Accès non autorisé") {
    super(message, "UNAUTHORIZED");
  }
}

export class DomainError extends AppError {
  constructor(message: string) {
    super(message, "DOMAIN_ERROR");
  }
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof AppError) {
    return { ok: false, message: error.message, fieldErrors: error.fieldErrors };
  }
  return { ok: false, message: "Une erreur est survenue. Veuillez réessayer." };
}
