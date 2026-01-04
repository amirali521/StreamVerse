
"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getAuth, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { useFirebase } from "@/firebase/provider";
import { useRouter } from "next/navigation";
import { doc, setDoc, getDocs, collection } from "firebase/firestore";

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
import { useFirestore } from "@/firebase";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

export default function SignupPage() {
  const { app } = useFirebase();
  const firestore = useFirestore();
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!app || !firestore) return;
    const auth = getAuth(app);

    // Check if this is the first user signing up.
    const usersCollection = collection(firestore, "users");
    const existingUsers = await getDocs(usersCollection);
    const isFirstUser = existingUsers.empty;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      await updateProfile(userCredential.user, {
        displayName: values.name,
      });
      
      const userProfileData: {
        displayName: string;
        email: string;
        photoURL: string | null;
        admin: boolean;
        isSuperAdmin?: boolean;
      } = {
        displayName: values.name,
        email: values.email,
        photoURL: user.photoURL,
        admin: isFirstUser, // First user is an admin
      };

      // If it's the first user, they become the Super Admin
      if (isFirstUser) {
        userProfileData.isSuperAdmin = true;
      }

      await setDoc(doc(firestore, "users", user.uid), userProfileData);

      await sendEmailVerification(user);

      toast({
        title: "Account Created",
        description: isFirstUser 
          ? "You have been made a Super Admin! A verification email has been sent."
          : "A verification email has been sent to your address. Please verify to log in.",
      });

      router.push("/auth/verify-email");

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message,
      });
    }
  }

  return (
    <div className="flex flex-col min-h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
          <CardDescription>
            Enter your details to sign up. The first user to register becomes the Super Admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                Sign Up
              </Button>
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="underline">
                  Log in
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
