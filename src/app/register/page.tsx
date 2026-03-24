
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";

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
  
  const { auth } = useAuth();
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
      title: "Verification Code Sent",
      description: "A 6-digit code has been sent to your WhatsApp.",
    });
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== "123456") {
      toast({ title: "Invalid Code", description: "Please use 123456 for testing.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      if (!auth) return;
      await initiateAnonymousSignIn(auth);
      
      toast({
        title: "Welcome to RentoVerse!",
        description: "Registration complete. Redirecting...",
      });
      
      setTimeout(() => {
        router.push("/profile");
      }, 1500);

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
            <CardTitle className="text-2xl font-headline font-bold">Register Account</CardTitle>
            <CardDescription>
              {step === "form" ? "Join RentoVerse to start searching or listing." : "Verify your identity via WhatsApp."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "form" ? (
              <form onSubmit={handleRegisterInitiate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
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
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <Input
                    id="whatsapp"
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full font-headline h-12 mt-4">
                  Send Verification Code
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-6">
                <div className="text-center p-4 bg-muted/50 rounded-xl border">
                   <p className="text-sm font-medium mb-1">Code sent to:</p>
                   <p className="font-bold text-primary">{formData.whatsapp}</p>
                </div>
                <div className="space-y-2 text-center">
                  <Label htmlFor="otp">6-Digit Code</Label>
                  <Input
                    id="otp"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="text-center text-2xl tracking-widest h-14"
                    maxLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full font-headline h-12" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Complete Registration"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
