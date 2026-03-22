
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useAuth, useFirestore, useUser } from "@/firebase";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { auth } = useAuth();
  const { firestore } = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // If user is already logged in (non-anonymous), handle the redirect logic
    if (user && !user.isAnonymous && firestore) {
      checkAdminAndRedirect(user.uid);
    }
  }, [user, firestore]);

  const checkAdminAndRedirect = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(firestore!, "users", uid));
      if (userDoc.exists() && userDoc.data()?.isAdmin) {
        router.push("/admin");
      } else {
        router.push("/profile");
      }
    } catch (error) {
      router.push("/profile");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Welcome back!",
        description: "Checking your credentials...",
      });
      // The useEffect will handle the redirection once the user state updates
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Please check your email and password.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container flex items-center justify-center py-20 px-4">
        <Card className="max-w-md w-full border-none shadow-2xl">
          <CardHeader className="text-center space-y-1">
            <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-headline font-bold">RentoVerse Login</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full font-headline h-12" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                    Signing in...
                  </div>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10 flex items-start gap-3">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Administrators will be automatically redirected to the secure management dashboard upon successful login.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
