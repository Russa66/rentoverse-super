"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Search, ShieldCheck, MapPin, Loader2, Phone, User as UserIcon, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";

export default function PostRequirement() {
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    location1: "",
    location2: "",
    location3: "",
    budget: "",
    propertyType: "Single Room",
    phoneNumber: "",
    acRequired: false,
    wifiRequired: false,
    powerBackupRequired: false,
  });

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      if (session?.user) {
        const { data } = await supabase.from('users').select('*').eq('auth_id', session.user.id).single();
        if (data) {
          setProfile(data);
          let phone = data.phone_number || session.user.phone || "";
          phone = phone.startsWith('+91') ? phone.substring(3) : phone;
          setFormData(prev => ({ ...prev, phoneNumber: phone, name: data.name || "" }));
        }
      }
      setLoadingUser(false);
    };
    fetchSession();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({ title: "Registration Required", description: "Please log in to post your requirements.", variant: "destructive" });
      return;
    }

    const phoneDigits = formData.phoneNumber.trim().replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      toast({ title: "Phone Required", description: "Please enter a 10-digit mobile number.", variant: "destructive" });
      return;
    }

    if (!formData.name.trim()) {
      toast({ title: "Name Required", description: "Please enter your name.", variant: "destructive" });
      return;
    }

    const fullPhone = `+91${phoneDigits}`;
    setLoadingStep("Saving Requirement...");

    try {
      const requestId = uuidv4();
      const amenities = [];
      if (formData.acRequired) amenities.push("AC");
      if (formData.wifiRequired) amenities.push("WiFi");
      if (formData.powerBackupRequired) amenities.push("Inverter");

      const locations = [formData.location1, formData.location2, formData.location3].filter(Boolean);
      const combinedLocation = locations.join(", ");

      const requestData = {
        id: requestId,
        renter_id: profile?.id || user.id, // Primary ID from public.users
        location_filter: combinedLocation,
        max_rent: Number(formData.budget),
        notification_preference: "WhatsApp",
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('saved_search_requests').insert(requestData);
      
      if (error) throw error;

      toast({ title: "Requirement Posted", description: "Your search is now active in RentoVerse." });
      router.push("/profile");
    } catch (error) {
      toast({ title: "Error", description: "Failed to post requirement. Did you create the SQL table?", variant: "destructive" });
    } finally {
      setLoadingStep(null);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-12">
      <Navbar />
      <div className="container max-w-2xl px-4 py-12 mx-auto">
        {!user ? (
          <Card className="border-none shadow-xl text-center p-12 space-y-6 bg-white">
            <div className="bg-destructive/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <Lock className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-headline font-bold">Registration Required</h1>
              <p className="text-muted-foreground max-w-sm mx-auto">
                To post your requirements on RentoVerse and connect with landlords, you must have a verified account.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/login">
                <Button className="font-headline h-12 px-8 gap-2">
                  Log In Now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card className="border-none shadow-xl overflow-hidden">
            <div className="bg-primary h-2 w-full" />
            <CardHeader className="text-center space-y-2 pb-8">
              <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-headline font-bold">Post Your Requirement</CardTitle>
              <CardDescription>
                Tell us what you need and let the right property find you.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {loadingStep ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <div className="text-center">
                      <p className="text-xl font-headline font-bold text-primary">{loadingStep}</p>
                      <p className="text-sm text-muted-foreground mt-2">Saving your request to Supabase Postgres...</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="space-y-2">
                    <Label className="font-bold flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-primary" /> Your Full Name
                    </Label>
                    <Input 
                      required 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      placeholder="Enter your name" 
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="font-bold">Preferred Locations (Up to 3)</Label>
                    <div className="space-y-3">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-primary" />
                        <Input required value={formData.location1} onChange={(e) => setFormData({...formData, location1: e.target.value})} placeholder="Primary Location" className="h-12 pl-10" />
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input value={formData.location2} onChange={(e) => setFormData({...formData, location2: e.target.value})} placeholder="Second Location (Optional)" className="h-12 pl-10" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="font-bold">Max Monthly Budget (INR)</Label>
                      <Input required type="number" value={formData.budget} onChange={(e) => setFormData({...formData, budget: e.target.value})} placeholder="12000" className="h-12" />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold">Property Type</Label>
                      <Select value={formData.propertyType} onValueChange={(v) => setFormData({...formData, propertyType: v})}>
                        <SelectTrigger className="h-12"><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single Room">Single Room</SelectItem>
                          <SelectItem value="Shared Room / PG">Shared Room / PG</SelectItem>
                          <SelectItem value="1BHK / 2BHK">Full Apartment (1/2 BHK)</SelectItem>
                          <SelectItem value="Commercial">Commercial Space</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label className="font-bold flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" /> Contact Phone Number
                      </Label>
                      <div className="relative">
                        <div className="absolute left-3 top-0 bottom-0 flex items-center gap-1 text-muted-foreground font-bold text-sm border-r pr-3 my-2 pointer-events-none">+91</div>
                        <input 
                          required 
                          value={formData.phoneNumber} 
                          onChange={(e) => setFormData({...formData, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                          placeholder="9876543210" 
                          className="flex h-12 w-full rounded-md border border-input bg-background pl-14 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          type="tel"
                          maxLength={10}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="font-bold">Essential Amenities</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                        <Checkbox id="ac" checked={formData.acRequired} onCheckedChange={(v) => setFormData({...formData, acRequired: !!v})} />
                        <label htmlFor="ac" className="text-sm font-medium cursor-pointer">AC</label>
                      </div>
                      <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                        <Checkbox id="wifi" checked={formData.wifiRequired} onCheckedChange={(v) => setFormData({...formData, wifiRequired: !!v})} />
                        <label htmlFor="wifi" className="text-sm font-medium cursor-pointer">WiFi</label>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={!!loadingStep} className="w-full h-14 text-lg font-headline shadow-lg hover:shadow-primary/20">
                    Post Requirement
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}