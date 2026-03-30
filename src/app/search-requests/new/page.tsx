
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
import { useFirestore, useUser, useAuth } from "@/firebase";
import { collection, doc, query, getDocs, where } from "firebase/firestore";
import { setDocumentNonBlocking, updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { composeSocialPost } from "@/ai/flows/ai-social-post-composer-flow";
import { Search, Sparkles, Phone, ShieldCheck, MapPin } from "lucide-react";

export default function PostRequirement() {
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const [formData, setFormData] = useState({
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
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
    if (user?.phoneNumber) {
      const displayPhone = user.phoneNumber.startsWith('+91') 
        ? user.phoneNumber.substring(3) 
        : user.phoneNumber;
      setFormData(prev => ({ ...prev, phoneNumber: displayPhone }));
    }
  }, [user, isUserLoading, auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !firestore) {
      toast({ title: "Connecting...", description: "Setting up your secure workspace.", variant: "default" });
      return;
    }

    const phoneDigits = formData.phoneNumber.trim().replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      toast({ title: "Phone Required", description: "Please enter a 10-digit mobile number.", variant: "destructive" });
      return;
    }

    const fullPhone = `+91${phoneDigits}`;
    setLoadingStep("Saving Requirement...");

    try {
      const requestId = doc(collection(firestore, "temp")).id;
      const amenities = [];
      if (formData.acRequired) amenities.push("AC");
      if (formData.wifiRequired) amenities.push("WiFi");
      if (formData.powerBackupRequired) amenities.push("Inverter");

      const locations = [formData.location1, formData.location2, formData.location3].filter(Boolean);
      const combinedLocation = locations.join(", ");

      const requestData = {
        id: requestId,
        renterId: user.uid,
        locationFilter: combinedLocation,
        maxRent: Number(formData.budget),
        propertyType: formData.propertyType,
        requiredAmenities: amenities,
        phoneNumber: fullPhone,
        notificationPreference: "WhatsApp",
        createdAt: new Date().toISOString(),
      };

      setDocumentNonBlocking(doc(firestore, `users/${user.uid}/saved_search_requests/${requestId}`), requestData, { merge: true });
      setDocumentNonBlocking(doc(firestore, `saved_search_requests/${requestId}`), requestData, { merge: true });

      updateDocumentNonBlocking(doc(firestore, "users", user.uid), { 
        phoneNumber: fullPhone,
        updatedAt: new Date().toISOString()
      });

      setLoadingStep("AI is Formatting for Social Groups...");
      const aiPost = await composeSocialPost({
        type: "requirement",
        location: combinedLocation,
        monthlyRent: `₹${formData.budget}`,
        socialMediaType: "facebook",
        acAvailable: formData.acRequired,
        wifiAvailable: formData.wifiRequired,
        inverterAvailable: formData.powerBackupRequired
      });

      addDocumentNonBlocking(collection(firestore, "social_posts"), {
        authorId: user.uid,
        savedSearchRequestId: requestId,
        platform: "facebook",
        postContent: aiPost.postContent,
        status: "POSTED",
        createdAt: new Date().toISOString()
      });

      setLoadingStep("Alerting Property Owners...");
      const q = query(collection(firestore, "room_listings"), where("locality", "==", formData.location1.split(',')[0].trim()));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((listingDoc) => {
        const listing = listingDoc.data();
        const msg = `Match! A tenant is looking for a ${formData.propertyType} in ${combinedLocation} (Budget: ₹${formData.budget}). Contact: ${fullPhone}`;
        
        ["InApp", "WhatsApp", "Email"].forEach(method => {
          addDocumentNonBlocking(collection(firestore, `users/${listing.landlordId}/notifications`), {
            recipientId: listing.landlordId,
            message: msg,
            notificationType: "ListingMatch",
            deliveryMethod: method,
            status: "Pending",
            createdAt: new Date().toISOString()
          });
        });
      });

      toast({ title: "Success!", description: "Requirement posted and AI-shared to social groups." });
      router.push("/profile");
    } catch (error) {
      toast({ title: "Error", description: "Failed to post requirement.", variant: "destructive" });
    } finally {
      setLoadingStep(null);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-12">
      <Navbar />
      <div className="container max-w-2xl px-4 py-12 mx-auto">
        <Card className="border-none shadow-xl overflow-hidden">
          <div className="bg-primary h-2 w-full" />
          <CardHeader className="text-center space-y-2 pb-8">
            <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-2 rotate-3 hover:rotate-0 transition-transform">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold">Post Your Requirement</CardTitle>
            <CardDescription>Tell us what you need and let the right property find you.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {loadingStep ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                 <div className="relative">
                   <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                   <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
                 </div>
                 <div className="text-center">
                    <p className="text-xl font-headline font-bold text-primary">{loadingStep}</p>
                    <p className="text-sm text-muted-foreground mt-2">RentoVerse AI is matching your request...</p>
                 </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Label className="font-bold">Preferred Locations (Up to 3)</Label>
                  <div className="space-y-3">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-primary" />
                      <Input 
                        required 
                        value={formData.location1} 
                        onChange={(e) => setFormData({...formData, location1: e.target.value})} 
                        placeholder="Primary Location (e.g. Poabagan)" 
                        className="h-12 pl-10"
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={formData.location2} 
                        onChange={(e) => setFormData({...formData, location2: e.target.value})} 
                        placeholder="Second Location (Optional)" 
                        className="h-12 pl-10"
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={formData.location3} 
                        onChange={(e) => setFormData({...formData, location3: e.target.value})} 
                        placeholder="Third Location (Optional)" 
                        className="h-12 pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="font-bold">Max Monthly Budget (INR)</Label>
                    <Input 
                      required 
                      type="number" 
                      value={formData.budget} 
                      onChange={(e) => setFormData({...formData, budget: e.target.value})} 
                      placeholder="12000" 
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">Property Type</Label>
                    <Select value={formData.propertyType} onValueChange={(v) => setFormData({...formData, propertyType: v})}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
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
                      <div className="absolute left-3 top-0 bottom-0 flex items-center gap-1 text-muted-foreground font-bold text-sm border-r pr-3 my-2 pointer-events-none">
                        +91
                      </div>
                      <input 
                        required 
                        value={formData.phoneNumber} 
                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                        placeholder="9876543210" 
                        className="flex h-12 w-full rounded-md border border-input bg-background pl-14 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                      <Checkbox 
                        id="ac" 
                        checked={formData.acRequired} 
                        onCheckedChange={(v) => setFormData({...formData, acRequired: !!v})} 
                      />
                      <label htmlFor="ac" className="text-sm font-medium leading-none cursor-pointer">AC</label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <Checkbox 
                        id="wifi" 
                        checked={formData.wifiRequired} 
                        onCheckedChange={(v) => setFormData({...formData, wifiRequired: !!v})} 
                      />
                      <label htmlFor="wifi" className="text-sm font-medium leading-none cursor-pointer">WiFi</label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <Checkbox 
                        id="backup" 
                        checked={formData.powerBackupRequired} 
                        onCheckedChange={(v) => setFormData({...formData, powerBackupRequired: !!v})} 
                      />
                      <label htmlFor="backup" className="text-sm font-medium leading-none cursor-pointer">Inverter</label>
                    </div>
                  </div>
                </div>
                
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-3">
                   <div className="flex items-start gap-3">
                     <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                     <p className="text-[11px] text-muted-foreground leading-relaxed">
                       RentoVerse will automatically post this requirement to relevant social groups and alert matching property owners.
                     </p>
                   </div>
                   <div className="flex items-start gap-3">
                     <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                     <p className="text-[11px] text-muted-foreground leading-relaxed">
                       You can verify this phone number in your profile settings later to get the <strong>Verified Member</strong> badge and increase trust.
                     </p>
                   </div>
                </div>

                <Button type="submit" className="w-full h-14 text-lg font-headline shadow-lg hover:shadow-primary/20 transition-all">
                   Find My Matching Room
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
