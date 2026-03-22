
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore, useUser } from "@/firebase";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, User, Mail, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { doc, setDoc } from "firebase/firestore";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { updateProfile } from "firebase/auth";

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/firejet-0.appspot.com/o/studio%2Fstudio-184067128-73095%2Fuploads%2F1741162330756.png?alt=media&token=86603a11-e77a-4286-90b4-c3e6027a4e0a";

export default function RegisterPage() {
  const [step, setStep] = useState<"form" | "verify">("form");
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    email: ""
  });
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { auth } = useAuth();
  const { firestore } = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const logo = PlaceHolderImages.find(img => img.id === 'logo');

  const handleRegisterInitiate = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.whatsapp.length < 10) {
      toast({ title: "Invalid Number", description: "Please enter a valid WhatsApp number.", variant: "destructive" });
      return;
    }
    setStep("verify");
    toast({
      title: "Verification Sent",
      description: "A verification code has been sent to your WhatsApp number.",
    });
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== "123456") { // Simulated OTP for prototype
      toast({ title: "Invalid Code", description: "Please use '123456' for the prototype verification.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      if (!auth || !firestore) return;

      // For the prototype, we use anonymous sign-in and then associate the profile
      await initiateAnonymousSignIn(auth);
      
      // Wait for user to be available (simulated or via an effect, but here we'll assume we update after sign-in)
      // In a real app, you'd use Phone Auth or Link with Email.
      
      toast({
        title: "Registration Successful!",
        description: "Welcome to RentoVerse. Redirecting to your profile...",
      });
      
      setTimeout(() => {
        router.push("/profile");
      }, 1500);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Something went wrong.",
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
            <div className="relative w-40 h-20 mx-auto mb-4">
              <Image 
                src={logo?.imageUrl || LOGO_URL} 
                alt="RentoVerse Logo" 
                fill 
                className="object-contain"
                priority
              />
            </div>
            <CardTitle className="text-2xl font-headline font-bold">Join RentoVerse</CardTitle>
            <CardDescription>
              {step === "form" ? "Create your account in seconds." : "Verify your WhatsApp number."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "form" ? (
              <form onSubmit={handleRegisterInitiate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-3 h-4 w-4 text-green-500" />
                    <Input
                      id="whatsapp"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address (Optional)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full font-headline h-12 bg-primary text-primary-foreground hover:bg-primary/90 mt-4">
                  Register & Verify WhatsApp
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-6">
                <div className="text-center p-4 bg-muted/50 rounded-xl border mb-2">
                   <p className="text-sm font-medium mb-1">Code sent to:</p>
                   <p className="font-bold text-primary">{formData.whatsapp}</p>
                </div>
                <div className="space-y-2 text-center">
                  <Label htmlFor="otp" className="text-lg">Verification Code</Label>
                  <Input
                    id="otp"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="text-center text-2xl tracking-[0.5em] h-14 font-headline"
                    maxLength={6}
                    required
                  />
                  <p className="text-[10px] text-muted-foreground italic mt-2">Hint: Use '123456' for testing</p>
                </div>
                <Button type="submit" className="w-full font-headline h-12" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Complete Registration"}
                </Button>
                <Button variant="ghost" className="w-full text-xs" onClick={() => setStep("form")}>
                  Change Details
                </Button>
              </form>
            )}

            <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-100 flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-green-800">Verified Badge Advantage</p>
                <p className="text-[10px] text-green-700 leading-relaxed">
                  Verified WhatsApp users get the <strong>"Verified Member"</strong> badge, which increases trust with property owners by 80%.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
