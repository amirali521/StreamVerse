"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/firebase/auth/use-user";
import { sendEmailVerification, getAuth } from "firebase/auth";
import { useFirebase } from "@/firebase/provider";
import { toast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const { app } = useFirebase();
  const { user, loaded } = useUser();
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [lastSent, setLastSent] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Redirect if user is not loaded or not logged in
  useEffect(() => {
    if (loaded && !user) {
      router.push("/login");
    }
  }, [user, loaded, router]);

  // Redirect if user is already verified
  useEffect(() => {
    if (user?.emailVerified) {
      toast({
        title: "Email Verified",
        description: "Your email is verified. Welcome!",
      });
      router.push("/");
    }
  }, [user, router]);


  // Periodically check the user's email verification status.
  useEffect(() => {
    const interval = setInterval(async () => {
      if (user) {
        await user.reload();
        // The useUser hook will update its state, triggering the effect above
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [user]);

  // Countdown timer for resend button
  useEffect(() => {
    if (!lastSent) return;

    const interval = setInterval(() => {
      const secondsPassed = (new Date().getTime() - lastSent.getTime()) / 1000;
      const secondsLeft = Math.max(0, 60 - secondsPassed);
      setCountdown(Math.ceil(secondsLeft));
      if (secondsLeft <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastSent]);

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
      setLastSent(new Date());
      setCountdown(60);
      toast({
        title: "Verification Email Sent",
        description: "A new verification link has been sent to your email address.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Sending Email",
        description: error.message || "Could not resend verification email. Please wait a moment before trying again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = async () => {
    if (!app) return;
    const auth = getAuth(app);
    await auth.signOut();
    router.push('/login');
  };
  
  if (!loaded || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }
  
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
            We&apos;ve sent a verification link to <span className="font-semibold text-primary">{user.email}</span>. Please check your inbox and click the link to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive the email?
          </p>
          <Button variant="link" className="text-primary" onClick={handleResendVerification} disabled={isSending || countdown > 0}>
            {isSending ? "Sending..." : (countdown > 0 ? `Resend in ${countdown}s` : "Resend Verification Email")}
          </Button>
           <p className="text-sm text-muted-foreground">
            If you signed up with the wrong email, you can{" "}
            <Button variant="link" className="p-0 h-auto text-primary" onClick={handleLogout}>log out</Button>
            {" "}and sign up again.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
