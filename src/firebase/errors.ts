
// src/firebase/errors.ts

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

/**
 * A custom error class for Firestore permission errors.
 * This class is designed to be thrown from .catch() blocks in Firestore mutation queries.
 * It encapsulates the context of the failed request, which can then be displayed
 * in a developer-friendly overlay for easier debugging of security rules.
 */
export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `FirestoreError: Missing or insufficient permissions. The following request was denied by Firestore Security Rules:`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // This is necessary for displaying the error correctly in some environments
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }
}
