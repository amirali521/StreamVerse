
// src/firebase/error-emitter.ts

import { EventEmitter } from 'events';

// This is a simple event emitter that can be used to broadcast errors
// from anywhere in the application. The FirebaseErrorListener will pick these up.
class ErrorEmitter extends EventEmitter {}

export const errorEmitter = new ErrorEmitter();
