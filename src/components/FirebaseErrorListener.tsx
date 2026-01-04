
'use client';

import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import {
  FirestorePermissionError,
  type SecurityRuleContext,
} from '@/firebase/errors';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

function formatJson(data: any) {
  return JSON.stringify(data, null, 2);
}

function SecurityRuleViolation({
  context,
  onDismiss,
}: {
  context: SecurityRuleContext;
  onDismiss: () => void;
}) {
  const { toast } = useToast();
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard!',
    });
  };

  const { path, operation, requestResourceData } = context;

  const authSection = `
"auth": {
  "uid": "gHZ9n7s2b9X8fJ2kP3s5t8YxVOE2",
  "token": {
    "name": "Jane Doe",
    "picture": "https://lh3.googleusercontent.com/a-/AAA99AaA.../a11-a/photo.jpg",
    "email": "jane.doe@example.com",
    "email_verified": true,
    "phone_number": null,
    "firebase": {
      "identities": {
        "google.com": [
          "111111111111111111111"
        ]
      },
      "sign_in_provider": "google.com"
    }
  },
  "method": "${operation}",
  "path": "/databases/(default)/documents/${path}"
}
`;

  const requestSection = requestResourceData
    ? `
"request": {
  "resource": {
    "data": ${formatJson(requestResourceData)}
  }
}
`
    : '';

  const fullErrorObject = `{
${authSection}${requestSection ? ',' + requestSection : ''}
}`;

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
      <Alert
        variant="destructive"
        className="w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          <AlertTitle className="font-bold">
            Firestore Security Rule Violation
          </AlertTitle>
        </div>
        <AlertDescription className="mt-2 text-sm flex-grow overflow-auto">
          The following request was denied by your security rules. Review the
          details below to debug your `firestore.rules` file.
          <div className="relative mt-4 bg-background/50 p-4 rounded-lg">
            <pre className="text-xs text-destructive-foreground whitespace-pre-wrap overflow-x-auto">
              <code>{fullErrorObject}</code>
            </pre>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(fullErrorObject)}
            >
              Copy
            </Button>
          </div>
        </AlertDescription>
        <div className="flex justify-end mt-4">
          <Button variant="destructive" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </Alert>
    </div>
  );
}

export function FirebaseErrorListener() {
  const [errorContext, setErrorContext] =
    useState<SecurityRuleContext | null>(null);

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // In development, show the detailed overlay.
      if (process.env.NODE_ENV === 'development') {
        setErrorContext(error.context);
      } else {
        // In production, you might want to log this to a service
        // or show a generic error message.
        console.error('Firestore Permission Error:', error.message);
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  if (!errorContext) {
    return null;
  }

  return (
    <SecurityRuleViolation
      context={errorContext}
      onDismiss={() => setErrorContext(null)}
    />
  );
}
