"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useFirebase } from "@/firebase/provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/firebase/auth/use-user";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export default function LoginPage() {
  const { app } = useFirebase();
  const router = useRouter();
  const { user, loaded } = useUser();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (loaded && user) {
      if(user.emailVerified) {
        router.push("/");
      } else {
        // If user is logged in but not verified, send to verification page.
        // This can happen if they close the tab after signing up.
        router.push("/auth/verify-email");
      }
    }
  }, [user, loaded, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!app) return;
    const auth = getAuth(app);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const signedInUser = userCredential.user;

      if (!signedInUser.emailVerified) {
        // Sign out the user immediately to prevent access
        await signOut(auth);
        
        toast({
            variant: "destructive",
            title: "Email Not Verified",
            description: "Please check your inbox and verify your email before logging in.",
        });
        
        // Pass email as query param to pre-fill on verify page if needed
        router.push(`/auth/verify-email?email=${values.email}`);
        return;
      }

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      // The useEffect hook will handle the redirect to "/"
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    }
  }
  
  if (!loaded || user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex flex-col min-h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link
                        href="/forgot-password"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                Log In
              </Button>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="underline">
                  Sign up
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
