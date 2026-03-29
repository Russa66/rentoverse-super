
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useAuth, useFirestore, useUser } from "@/firebase";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from "next/link";

export default function LoginPage() {
  const [step, setStep] = useState<"form" | "verify">("form");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const auth = useAuth();
  const { firestore } = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const logo = PlaceHolderImages.find(img => img.id === 'logo');

  // Handle successful login or admin check
  useEffect(() => {
    if (user && !user.isAnonymous && firestore) {
      checkAdminAndRedirect(user.uid);
    }
  }, [user, firestore]);

  // Handle incoming Email Link authentication
  useEffect(() => {
    if (!auth) return;

    if (isSignInWithEmailLink(auth, window.location.href)) {
      const finishSignIn = async () => {
        let storedEmail = window.localStorage.getItem('emailForSignIn');
        if (!storedEmail) {
          storedEmail = window.prompt('Please provide your email for confirmation');
        }
        
        if (!storedEmail) return;

        setIsLoading(true);
        try {
          await signInWithEmailLink(auth, storedEmail, window.location.href);
          window.localStorage.removeItem('emailForSignIn');
          toast({ title: "Logged in", description: "Email verified successfully." });
          router.push('/profile');
        } catch (error: any) {
          toast({ variant: "destructive", title: "Verification Failed", description: error.message });
        } finally {
          setIsLoading(false);
        }
      };
      finishSignIn();
    }
  }, [auth]);

  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    const phoneDigits = phoneNumber.trim().replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      toast({ 
        title: "Invalid Number", 
        description: "Please enter a 10-digit mobile number.", 
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
        'size': 'invisible'
      });

      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setStep("verify");
      toast({
        title: "OTP Sent",
        description: `Verification code sent to +91 ${phoneDigits}`,
      });
    } catch (error: any) {
      console.error("SMS Login Error:", error);
      toast({
        variant: "destructive",
        title: "Error Sending Code",
        description: error.message || "Please check your network and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmailLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    setIsLoading(true);
    try {
      const actionCodeSettings = {
        url: window.location.origin + '/login',
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      toast({
        title: "Login Link Sent",
        description: `Check your inbox at ${email} for the secure login link.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Email Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || otp.length !== 6) return;

    setIsLoading(true);
    try {
      await confirmationResult.confirm(otp);
      toast({
        title: "Logged In Successfully",
        description: "Redirecting...",
      });
    } catch (error: any) {
      console.error("OTP Verification Error:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "The code is incorrect. Please try again.",
      });
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
                <Image 
                  src={logo.imageUrl} 
                  alt="RentoVerse Logo" 
                  fill 
                  className="object-contain"
                  priority
                />
              )}
            </div>
            <CardTitle className="text-2xl font-headline font-bold">RentoVerse Login</CardTitle>
            <CardDescription>
              {step === "form" ? "Choose your preferred login method." : "Verify your identity via SMS."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div id="recaptcha-container"></div>

            {step === "form" ? (
              <Tabs defaultValue="phone" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                  <TabsTrigger value="phone" className="gap-2 font-headline">
                    <Phone className="h-4 w-4" /> Phone
                  </TabsTrigger>
                  <TabsTrigger value="email" className="gap-2 font-headline">
                    <Mail className="h-4 w-4" /> Email
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="phone">
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <div className="absolute left-3 top-0 bottom-0 flex items-center gap-1 text-muted-foreground font-bold text-sm border-r pr-3 my-2 pointer-events-none">
                          +91
                        </div>
                        <input
                          id="phone"
                          type="tel"
                          placeholder="9876543210"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="flex h-12 w-full rounded-md border border-input bg-background pl-14 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          required
                          maxLength={10}
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full font-headline h-12" disabled={isLoading || phoneNumber.length !== 10}>
                      {isLoading ? "Preparing..." : "Send SMS OTP"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="email">
                  <form onSubmit={handleSendEmailLink} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
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
                      {isLoading ? "Sending Link..." : "Send Login Link"}
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center px-4 leading-relaxed">
                      A secure login link will be sent to your inbox. Simply click the link to log in.
                    </p>
                  </form>
                </TabsContent>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
                      Register Now <ArrowRight className="h-3 w-3" />
                    </Link>
                  </p>
                </div>
              </Tabs>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="text-center p-4 bg-muted/50 rounded-xl border">
                   <p className="text-sm font-medium mb-1">Code sent to:</p>
                   <p className="font-bold text-primary">+91 {phoneNumber}</p>
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
                  {isLoading ? "Verifying..." : "Login"}
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setStep("form")} disabled={isLoading}>
                  Back to Options
                </Button>
              </form>
            )}

            <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10 flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                RentoVerse uses secure Firebase Authentication. OTP is delivered via SMS, and login links are sent via encrypted email.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
