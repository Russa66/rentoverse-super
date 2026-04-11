"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const [step, setStep] = useState<"form" | "verify">("form");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    nearestCommunication: ""
  });
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const logo = PlaceHolderImages.find(img => img.id === 'logo');

  const handleRegisterInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.includes("@")) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
      });

      if (error) throw error;

      setStep("verify");
      toast({ title: "Code Sent", description: `A 6-digit verification code was sent to ${formData.email}` });
    } catch (error: any) {
      console.error("Email Error Details:", error);
      toast({ variant: "destructive", title: "Registration Error", description: error.message || "Failed to send code." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6 || !formData.email) {
      toast({ title: "Invalid Code", description: "Please enter a valid code.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: otp,
        type: 'email'
      });

      if (error) throw error;
      if (!data?.session?.user) throw new Error("Verification failed to return a valid session.");

      const user = data.session.user;

      // Ensure profile exists in PostgreSQL table
      // 1. Check if user already exists (shadow user created by admin)
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", formData.email)
        .single();

      if (existingUser) {
        // Link existing shadow user to this Auth account
        const { error: linkError } = await supabase
          .from("users")
          .update({
            auth_id: user.id,
            name: formData.name, // Update with official name
            is_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingUser.id);
          
        if (linkError) {
          console.error("Linking Error:", linkError);
          toast({ title: "Login Successful", description: "Warning: Profile linking failed.", variant: "destructive" });
        } else {
          toast({ title: "Welcome back to RentoVerse", description: "Your admin-managed listings are now linked to your account." });
        }
      } else {
        // Create new user record
        const userData = {
          id: user.id, // For standard users, we can use auth.id as PK
          auth_id: user.id,
          name: formData.name,
          email: formData.email,
          phone_number: "",
          address: "",
          nearest_communication: formData.nearestCommunication,
          is_admin: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_verified: true,
        };

        const { error: dbError } = await supabase.from("users").insert(userData);
        
        if (dbError) {
          console.warn("Could not insert user profile:", dbError);
          toast({ title: "Login Successful", description: "Warning: Profile metadata sync failed.", variant: "destructive" });
        } else {
          toast({ title: "Welcome to RentoVerse", description: "Your account is synced to Supabase." });
        }
      }
      
      router.push("/profile");
      
    } catch (error: any) {
      console.error("Verification Error Details:", error);
      toast({ variant: "destructive", title: "Verification Error", description: error.message || "Incorrect verification code." });
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
            <CardTitle className="text-2xl font-headline font-bold">Join RentoVerse</CardTitle>
            <CardDescription>
              {step === "form" ? "Quick registration with your email." : "Verify your identity via Email Code."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "form" ? (
              <form onSubmit={handleRegisterInitiate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <input
                    id="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nearestComm">Nearest Communication (Landmark)</Label>
                  <input
                    id="nearestComm"
                    placeholder="e.g. Metro Station, Bus Stand"
                    value={formData.nearestCommunication}
                    onChange={(e) => setFormData({ ...formData, nearestCommunication: e.target.value })}
                    className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  />
                </div>
                <Button type="submit" className="w-full font-headline h-12 mt-4" disabled={isLoading || !formData.email}>
                  {isLoading ? <Loader2 className="animate-spin" /> : "Send Email Code"}
                </Button>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Login</Link>
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-6">
                <div className="text-center p-4 bg-muted/50 rounded-xl border">
                   <p className="text-sm font-medium mb-1">Code sent to:</p>
                   <p className="font-bold text-primary">{formData.email}</p>
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
                  {isLoading ? <Loader2 className="animate-spin" /> : "Complete Registration"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("form")} disabled={isLoading}>Change Email</Button>
              </form>
            )}

            <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10 flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                RentoVerse secures your data using industry-standard Supabase encryption.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
