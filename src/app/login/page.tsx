"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from "next/link";

export default function LoginPage() {
  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const logo = PlaceHolderImages.find(img => img.id === 'logo');

  useEffect(() => {
    // Check if they came from an email magic link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        checkAdminAndRedirect(session.user.id);
      }
    };
    
    // Subscribe to auth state changes for magic links
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        toast({ title: "Logged in", description: "Successfully authenticated." });
        checkAdminAndRedirect(session.user.id);
      }
    });

    checkSession();
    
    return () => subscription.unsubscribe();
  }, [supabase, router, toast]);

  const checkAdminAndRedirect = async (uid: string) => {
    try {
      const { data: userProfile } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', uid)
        .single();
        
      if (userProfile?.is_admin) {
        router.push("/admin");
      } else {
        router.push("/profile");
      }
    } catch (error) {
      router.push("/profile");
    }
  };

  const handleSendEmailLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      // By default, this sends both a Magic Link and a 6-digit OTP code in the same email.
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: window.location.origin + '/profile',
        }
      });
      
      if (error) throw error;
      
      setStep("verify");
      toast({ title: "Email Sent!", description: `Check your inbox at ${email} for the link or code.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Email Error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: otp,
        type: 'email' // We verify the 6 digit code sent in the magic link email
      });

      if (error) throw error;
      if (data.session) {
        checkAdminAndRedirect(data.session.user.id);
      }
    } catch (error: any) {
      console.error("OTP Verification Error:", error);
      toast({ variant: "destructive", title: "Login Failed", description: error.message || "Incorrect code." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container flex items-center justify-center py-20 px-4 mx-auto">
        <Card className="max-w-md w-full border-none shadow-2xl">
          <CardHeader className="text-center space-y-1">
            <div className="relative w-48 h-24 mx-auto mb-4">
              {logo && (
                <Image src={logo.imageUrl} alt="RentoVerse" fill className="object-contain" priority />
              )}
            </div>
            <CardTitle className="text-2xl font-headline font-bold">Log In</CardTitle>
            <CardDescription>
              {step === "form" ? "Enter your email for a secure link or code." : "Verify using the code in your email."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "form" ? (
              <form onSubmit={handleSendEmailLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                     <Mail className="h-4 w-4" /> Email Address
                  </Label>
                  <input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  />
                </div>
                <Button type="submit" className="w-full font-headline h-12" disabled={isLoading || !email}>
                  {isLoading ? <Loader2 className="animate-spin" /> : "Send Login Link & Code"}
                </Button>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
                      Register Now <ArrowRight className="h-3 w-3" />
                    </Link>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="text-center p-4 bg-muted/50 rounded-xl border">
                   <p className="text-sm font-medium mb-2">Check your email. Click the link or enter the code sent to:</p>
                   <p className="font-bold text-primary">{email}</p>
                </div>
                <div className="space-y-2 text-center">
                  <Label htmlFor="otp">Enter Email Code</Label>
                  <input
                    id="otp"
                    placeholder="12345678"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    className="flex h-14 w-full rounded-md border border-input bg-background px-3 py-2 text-2xl text-center tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    maxLength={8}
                    required
                  />
                </div>
                <Button type="submit" className="w-full font-headline h-12" disabled={isLoading || otp.length < 6}>
                  {isLoading ? <Loader2 className="animate-spin" /> : "Login"}
                </Button>
                <div className="text-center">
                   <p className="text-xs text-muted-foreground mb-4">Or simply click the Magic Link in the email to automatically sign in.</p>
                   <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("form")} disabled={isLoading}>Back to Email</Button>
                </div>
              </form>
            )}

            <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10 flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground">Secure passwordless verification powered by Supabase Auth.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}