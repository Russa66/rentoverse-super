
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Chrome, Phone, CheckCircle2, ArrowRight } from "lucide-react";
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

  // Initialize Recaptcha
  const setupRecaptcha = async () => {
    if (!auth) return null;
    try {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
      });
      recaptchaVerifierRef.current = verifier;
      return verifier;
    } catch (error) {
      console.error("Recaptcha initialization failed", error);
      return null;
    }
  };

  const handleRegisterInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    // Cleaning and formatting phone number for India (+91)
    let phone = formData.whatsapp.trim().replace(/\s+/g, '');
    
    // Automatically prepend +91 if no country code is provided
    if (!phone.startsWith('+')) {
      if (phone.length === 10) {
        phone = `+91${phone}`;
      } else {
        toast({ 
          title: "Invalid Phone Number", 
          description: "Please enter a valid 10-digit mobile number.", 
          variant: "destructive" 
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const appVerifier = await setupRecaptcha();
      if (!appVerifier) {
        throw new Error("Could not initialize security check. Please refresh the page.");
      }

      const result = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(result);
      setStep("verify");
      toast({
        title: "Verification Code Sent",
        description: `A code has been sent to ${phone} via SMS.`,
      });
    } catch (error: any) {
      console.error("Sign-in with phone error:", error);
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: error.message || "Failed to send code. Ensure your domain is authorized in Firebase Console.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;

    setIsLoading(true);
    try {
      const credential = await confirmationResult.confirm(otp);
      const user = credential.user;

      if (firestore) {
        await setDoc(doc(firestore, "users", user.uid), {
          id: user.uid,
          name: formData.name,
          phoneNumber: user.phoneNumber,
          email: formData.email || null,
          userType: formData.userType,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
        title: "Invalid Code", 
        description: "The verification code is incorrect or has expired." 
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
        await setDoc(doc(firestore, "users", user.uid), {
          id: user.uid,
          name: user.displayName || "RentoVerse User",
          phoneNumber: user.phoneNumber || null,
          email: user.email || null,
          userType: "Tenant",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userType">Register as</Label>
                    <Select value={formData.userType} onValueChange={(v) => setFormData({...formData, userType: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Owner">Owner / Landlord</SelectItem>
                        <SelectItem value="Tenant">Tenant / Renter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">Phone Number</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-3 flex items-center gap-1 text-muted-foreground font-bold text-sm border-r pr-2 h-4">
                        +91
                      </div>
                      <input
                        id="whatsapp"
                        placeholder="98765 43210"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background pl-14 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                        type="tel"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">OTP will be sent to this number for verification.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  
                  <div id="recaptcha-container"></div>
                  
                  <Button type="submit" className="w-full font-headline h-12 mt-4" disabled={isLoading}>
                    {isLoading ? "Preparing..." : "Send Verification Code"}
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
                   <p className="font-bold text-primary">
                    {formData.whatsapp.startsWith('+') ? formData.whatsapp : `+91 ${formData.whatsapp}`}
                   </p>
                </div>
                <div className="space-y-2 text-center">
                  <Label htmlFor="otp">Enter 6-Digit Code</Label>
                  <input
                    id="otp"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="flex h-14 w-full rounded-md border border-input bg-background px-3 py-2 text-2xl text-center tracking-widest ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    maxLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full font-headline h-12" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Complete Registration"}
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setStep("form")} disabled={isLoading}>
                  Change Phone Number
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    