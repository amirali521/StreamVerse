"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/firebase/auth/use-user";
import { sendEmailVerification } from "firebase/auth";
import { useFirebase } from "@/firebase/provider";
import { toast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const { app } = useFirebase();
  const { user, loaded } = useUser();
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    // If the user is loaded and their email is verified, redirect them home.
    if (loaded && user?.emailVerified) {
      toast({
        title: "Email Verified",
        description: "Your email has been successfully verified. Welcome!",
      });
      router.push("/");
    }
    // If the user is not logged in, they shouldn't be here.
    if (loaded && !user) {
      router.push("/login");
    }
  }, [user, loaded, router]);

  // Periodically check the user's email verification status.
  useEffect(() => {
    const interval = setInterval(async () => {
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          clearInterval(interval);
          router.push("/");
        }
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [user, router]);


  const handleResendVerification = async () => {
    if (!app || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be signed in to resend a verification email."
      });
      return;
    }
    
    setIsSending(true);
    try {
      await sendEmailVerification(user);
      toast({
        title: "Verification Email Sent",
        description: "A new verification link has been sent to your email address.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Sending Email",
        description: error.message || "Could not resend verification email.",
      });
    } finally {
      setIsSending(false);
    }
  };

  // If user data is still loading, or we are redirecting, show a loading message
  if (!loaded || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }
  
  // If user is already verified, they will be redirected by the useEffect. 
  // We can show a message while that happens.
  if (user.emailVerified) {
    return <div className="flex min-h-screen items-center justify-center">You are already verified. Redirecting...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <Mail className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="mt-4 text-2xl font-headline">Verify Your Email</CardTitle>
          <CardDescription className="mt-2">
            We've sent a verification link to <span className="font-semibold text-primary">{user.email}</span>. Please check your inbox and click the link to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Didn't receive the email?
          </p>
          <Button variant="link" className="text-primary mt-2" onClick={handleResendVerification} disabled={isSending}>
            {isSending ? "Sending..." : "Click here to resend"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
