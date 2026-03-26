
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "firebase/auth";
import { useAuth, useFirestore } from "@/firebase";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Chrome, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import Link from "next/link";

export default function RegisterPage() {
  const [step, setStep] = useState<"form" | "verify">("form");
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    email: "",
    userType: "Tenant"
  });
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const { auth } = useAuth();
  const { firestore } = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const logo = PlaceHolderImages.find(img => img.id === 'logo');

  // Diagnostic check for Auth on mount
  useEffect(() => {
    if (!auth) {
      toast({
        variant: "destructive",
        title: "Auth Connection Error",
        description: "Firebase Auth is not initialized. Please refresh the page.",
      });
    }
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, [auth, toast]);

  const handleRegisterInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast({ variant: "destructive", title: "Error", description: "Authentication system is unavailable." });
      return;
    }

    const phoneDigits = formData.whatsapp.trim().replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      toast({ 
        title: "Invalid Number", 
        description: "Please enter a valid 10-digit mobile number.", 
        variant: "destructive" 
      });
      return;
    }

    const fullPhoneNumber = `+91${phoneDigits}`;
    setIsLoading(true);

    try {
      // Clear existing verifier if any
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }

      // Initialize Recaptcha
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          console.log("reCAPTCHA solved");
        },
        'expired-callback': () => {
          toast({ title: "Security Check Expired", description: "Please try again." });
          setIsLoading(false);
        }
      });

      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setStep("verify");
      toast({
        title: "OTP Sent",
        description: `Verification code sent to ${fullPhoneNumber}`,
      });
    } catch (error: any) {
      console.error("SMS Registration Error:", error);
      
      let message = "Failed to send code. Please try again.";
      
      // Map Firebase Errors to human-readable diagnostics
      if (error.code === 'auth/invalid-phone-number') message = "The phone number format is invalid.";
      if (error.code === 'auth/too-many-requests') message = "Too many attempts. Please wait a few minutes.";
      if (error.code === 'auth/network-request-failed') message = "Network error. Check your internet connection.";
      if (error.code === 'auth/captcha-check-failed') message = "Security check failed. Ensure your browser is up to date.";
      if (error.code === 'auth/unauthorized-domain') message = "This domain is not authorized for SMS auth in Firebase Console.";
      if (error.code === 'auth/operation-not-allowed') message = "Phone provider is not enabled in Firebase Console.";

      toast({
        variant: "destructive",
        title: "Registration Blocked",
        description: message,
      });
      
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || otp.length !== 6) return;

    setIsLoading(true);
    try {
      const credential = await confirmationResult.confirm(otp);
      const user = credential.user;

      if (firestore) {
        // Use non-await pattern for doc creation per guidelines
        setDoc(doc(firestore, "users", user.uid), {
          id: user.uid,
          name: formData.name,
          phoneNumber: user.phoneNumber,
          email: formData.email || null,
          userType: formData.userType,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isVerified: true,
        }, { merge: true });
      }
      
      toast({
        title: "Welcome to RentoVerse!",
        description: "Your account is verified and ready.",
      });
      
      router.push("/profile");
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Verification Failed", 
        description: "The code is incorrect. Please check and try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    if (!auth) return;
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      const user = credential.user;

      if (firestore) {
        setDoc(doc(firestore, "users", user.uid), {
          id: user.uid,
          name: user.displayName || "RentoVerse User",
          phoneNumber: user.phoneNumber || null,
          email: user.email || null,
          userType: "Tenant",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isVerified: !!user.phoneNumber,
        }, { merge: true });
      }

      router.push("/profile");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Registration Failed", description: error.message });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container flex items-center justify-center py-20 px-4">
        <Card className="max-w-md w-full border-none shadow-2xl">
          <CardHeader className="text-center space-y-1">
            <div className="relative w-48 h-24 mx-auto mb-4">
              {logo && (
                <Image 
                  src={logo.imageUrl} 
                  alt="RentoVerse Logo" 
                  fill 
                  className="object-contain"
                  priority
                />
              )}
            </div>
            <CardTitle className="text-2xl font-headline font-bold">Create Account</CardTitle>
            <CardDescription>
              {step === "form" ? "Join RentoVerse to start searching or listing." : "Verify your identity via SMS."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* The reCAPTCHA container must be present in the DOM for the verifier to attach */}
            <div id="recaptcha-container"></div>
            
            {step === "form" ? (
              <div className="space-y-4">
                <form onSubmit={handleRegisterInitiate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <input
                      id="name"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userType">Register as</Label>
                    <Select value={formData.userType} onValueChange={(v) => setFormData({...formData, userType: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Owner">Owner / Landlord</SelectItem>
                        <SelectItem value="Tenant">Tenant / Renter</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">Phone Number</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-0 bottom-0 flex items-center gap-1 text-muted-foreground font-bold text-sm border-r pr-3 my-2 pointer-events-none">
                        +91
                      </div>
                      <input
                        id="whatsapp"
                        placeholder="9876543210"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        className="flex h-10 w-full rounded-md border border-input bg-background pl-14 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                        type="tel"
                        maxLength={10}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Verification code will be sent to this number.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full font-headline h-12 mt-4" disabled={isLoading || formData.whatsapp.length !== 10}>
                    {isLoading ? "Preparing Security Check..." : "Send Verification Code"}
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground font-bold">Or register with</span>
                  </div>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-12 gap-2" 
                  onClick={handleGoogleRegister}
                  disabled={isLoading}
                >
                  <Chrome className="h-4 w-4" /> Google
                </Button>

                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary font-bold hover:underline">
                      Login
                    </Link>
                  </p>
                </div>
              </div>
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
                    className="flex h-14 w-full rounded-md border border-input bg-background px-3 py-2 text-2xl text-center tracking-widest ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    maxLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full font-headline h-12" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? "Verifying..." : "Complete Registration"}
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setStep("form")} disabled={isLoading}>
                  Change Phone Number
                </Button>
              </form>
            )}

            <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10 flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-primary uppercase">Security Check</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  RentoVerse uses Firebase Phone Authentication. If the code doesn't arrive, ensure your domain is whitelisted in the Firebase Console.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
