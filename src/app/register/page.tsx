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
import { Chrome, ArrowRight } from "lucide-react";
import { doc } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
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
  const auth = useAuth();
  const { firestore } = useFirestore();
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
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }

      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
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
      let message = "Failed to send code. Ensure your domain is authorized in Firebase.";
      if (error.code === 'auth/unauthorized-domain') message = "Domain not authorized for SMS auth.";
      if (error.code === 'auth/too-many-requests') message = "Too many attempts. Please wait.";

      toast({
        variant: "destructive",
        title: "Registration Error",
        description: message,
      });
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
        setDocumentNonBlocking(doc(firestore, "users", user.uid), {
          id: user.uid,
          name: formData.name,
          phoneNumber: user.phoneNumber,
          email: formData.email || null,
          userType: formData.userType,
          address: "",
          isAdmin: false,
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
        description: "The code is incorrect. Please try again." 
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
        setDocumentNonBlocking(doc(firestore, "users", user.uid), {
          id: user.uid,
          name: user.displayName || "RentoVerse User",
          phoneNumber: user.phoneNumber || null,
          email: user.email || null,
          userType: "Tenant",
          address: "",
          isAdmin: false,
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
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                      <div className="absolute left-3 top-0 bottom-0 flex items-center gap-1 text-muted-foreground font-bold text-sm border-r pr-3 my-2 pointer-events-none">
                        +91
                      </div>
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
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full font-headline h-12 mt-4" disabled={isLoading || formData.whatsapp.length !== 10}>
                    {isLoading ? "Checking Security..." : "Send Verification Code"}
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground font-bold">Or</span>
                  </div>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-12 gap-2" 
                  onClick={handleGoogleRegister}
                  disabled={isLoading}
                >
                  <Chrome className="h-4 w-4" /> Sign up with Google
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
                    className="flex h-14 w-full rounded-md border border-input bg-background px-3 py-2 text-2xl text-center tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}