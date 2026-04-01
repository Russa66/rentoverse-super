
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult
} from "firebase/auth";
import { useAuth, useFirestore } from "@/firebase";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { ArrowRight, ShieldCheck, Phone, Info, Loader2 } from "lucide-react";
import { doc } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import Link from "next/link";

export default function RegisterPage() {
  const [step, setStep] = useState<"form" | "verify">("form");
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    email: ""
  });
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const logo = PlaceHolderImages.find(img => img.id === 'logo');

  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const handleRegisterInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    const phoneDigits = formData.whatsapp.trim().replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      toast({ title: "Invalid Number", description: "Please enter a 10-digit mobile number.", variant: "destructive" });
      return;
    }

    const fullPhoneNumber = `+91${phoneDigits}`;
    setIsLoading(true);

    try {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }

      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });

      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setStep("verify");
      toast({ title: "OTP Sent", description: `Verification code sent to +91 ${phoneDigits}` });
    } catch (error: any) {
      console.error("SMS Error:", error);
      let errorMessage = "Failed to send code.";
      if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many attempts. Please try again in 15 minutes.";
      }
      toast({ variant: "destructive", title: "Registration Error", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || otp.length !== 6 || !firestore) {
      toast({ title: "System Readying", description: "Waiting for database connection...", variant: "default" });
      return;
    }

    setIsLoading(true);
    try {
      const credential = await confirmationResult.confirm(otp);
      const user = credential.user;

      const userData = {
        id: user.uid,
        name: formData.name,
        phoneNumber: user.phoneNumber,
        email: formData.email || null,
        address: "",
        isAdmin: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isVerified: true,
      };

      // Ensure firestore is ready before writing
      const userRef = doc(firestore, "users", user.uid);
      setDocumentNonBlocking(userRef, userData, { merge: true });
      
      toast({ title: "Welcome to RentoVerse", description: "Your account is being initialized." });
      
      // Delay redirect slightly to ensure Firestore SDK initiates the write
      setTimeout(() => {
        router.push("/profile");
      }, 500);
      
    } catch (error: any) {
      console.error("Verification Error:", error);
      toast({ variant: "destructive", title: "Invalid Code", description: "Please check the OTP and try again." });
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
              {step === "form" ? "Quick registration with mobile number." : "Verify your identity via SMS."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div id="recaptcha-container"></div>
            
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">Phone Number</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-0 bottom-0 flex items-center gap-1 text-muted-foreground font-bold text-sm border-r pr-3 my-2 pointer-events-none">+91</div>
                    <input
                      id="whatsapp"
                      placeholder="9876543210"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className="flex h-10 w-full rounded-md border border-input bg-background pl-14 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                      type="tel"
                      maxLength={10}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <Button type="submit" className="w-full font-headline h-12 mt-4" disabled={isLoading || formData.whatsapp.length !== 10}>
                  {isLoading ? <Loader2 className="animate-spin" /> : "Send Verification Code"}
                </Button>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Login</Link>
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-6">
                <div className="text-center p-4 bg-muted/50 rounded-xl border">
                   <p className="text-sm font-medium mb-1">Code sent to:</p>
                   <p className="font-bold text-primary">+91 {formData.whatsapp}</p>
                </div>
                <div className="space-y-2 text-center">
                  <Label htmlFor="otp">Enter 6-Digit Code</Label>
                  <input
                    id="otp"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="flex h-14 w-full rounded-md border border-input bg-background px-3 py-2 text-2xl text-center tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    maxLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full font-headline h-12" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? <Loader2 className="animate-spin" /> : "Complete Registration"}
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setStep("form")} disabled={isLoading}>Change Phone Number</Button>
              </form>
            )}

            <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10 flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                RentoVerse secures your data using industry-standard Firebase encryption.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
