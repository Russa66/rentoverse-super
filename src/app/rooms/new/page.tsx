
"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, CheckCircle2, MessageCircle, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useFirestore, useUser, useAuth } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { composeSocialPost } from "@/ai/flows/ai-social-post-composer-flow";

export default function NewListing() {
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ id: string; postContent: string; title: string; rent: string } | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { firestore } = useFirestore();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const [formData, setFormData] = useState({
    location: "",
    transport: "",
    rent: "",
    idealFor: "",
    propertyType: "Room",
    areaSqFt: "",
    bhkCount: "N/A",
    wifi: false,
    ac: false,
    powerBackup: false,
    waterSource: "",
    description: ""
  });

  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !firestore) {
      toast({ title: "Connecting...", description: "Setting up your secure workspace.", variant: "default" });
      return;
    }

    setLoadingStep("Authenticating & Preparing...");

    try {
      const listingId = doc(collection(firestore, "temp")).id;
      const now = new Date().toISOString();

      // Ensure User Profile exists as Owner
      setDocumentNonBlocking(doc(firestore, "users", user.uid), {
        id: user.uid,
        name: user.displayName || "RentoVerse User",
        userType: "Owner",
        updatedAt: now,
        createdAt: now
      }, { merge: true });

      const listingData = {
        id: listingId,
        landlordId: user.uid,
        title: `${formData.bhkCount !== 'N/A' ? formData.bhkCount + ' BHK ' : ''}${formData.propertyType} in ${formData.location}`,
        location: formData.location,
        locality: formData.location.split(',')[0].trim(),
        areaSqFt: Number(formData.areaSqFt),
        bhkCount: formData.bhkCount,
        propertyType: formData.propertyType,
        nearestCommunicationOptions: [formData.transport],
        monthlyRent: Number(formData.rent),
        currency: "INR",
        amenities: [formData.wifi && "WiFi", formData.ac && "AC", formData.powerBackup && "Inverter"].filter(Boolean),
        waterSupplyCondition: formData.waterSource,
        description: formData.description,
        idealFor: formData.idealFor,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      setLoadingStep("Publishing to RentoVerse Database...");

      // Write to User's private subcollection for the Profile tab
      setDocumentNonBlocking(doc(firestore, `users/${user.uid}/listings/${listingId}`), listingData, { merge: true });
      
      // Write to Public Root Collection
      setDocumentNonBlocking(doc(firestore, `room_listings/${listingId}`), listingData, { merge: true });

      setLoadingStep("AI is Crafting Your Social Posts...");
      
      let postContent = `New Listing: ${listingData.title}\nRent: ₹${formData.rent}\nArea: ${formData.areaSqFt} sq ft\nLocation: ${formData.location}`;
      
      try {
        const aiPost = await composeSocialPost({
          type: "listing",
          location: formData.location,
          propertyType: formData.propertyType,
          areaSqFt: Number(formData.areaSqFt),
          bhkCount: formData.bhkCount !== 'N/A' ? formData.bhkCount : undefined,
          nearestCommunication: formData.transport,
          monthlyRent: `₹${formData.rent}`,
          socialMediaType: "facebook",
          waterSupplyCondition: formData.waterSource,
          wifiAvailable: formData.wifi,
          acAvailable: formData.ac,
          inverterAvailable: formData.powerBackup
        });
        postContent = aiPost.postContent;
      } catch (aiError) {
        console.warn("AI Generation failed", aiError);
      }

      setSuccessData({ 
        id: listingId, 
        postContent, 
        title: listingData.title, 
        rent: formData.rent 
      });
      
    } catch (error) {
      toast({ title: "Submission Error", description: "Could not save listing.", variant: "destructive" });
    } finally {
      setLoadingStep(null);
    }
  };

  const sendWhatsAppConfirmation = () => {
    if (!successData) return;
    const message = `Thank you for listing your property on RentoVerse!\n\nProperty: ${successData.title}\nRent: ₹${successData.rent}\n\nYour listing is now live and our AI has prepared a social post for you:\n\n${successData.postContent}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const notifyAdmin = () => {
    if (!successData) return;
    const adminMsg = `New Listing Alert!\nID: ${successData.id}\nProperty: ${successData.title}\nOwner: ${user?.displayName || 'Unknown'}`;
    window.open(`https://wa.me/919000000000?text=${encodeURIComponent(adminMsg)}`, "_blank");
  };

  if (successData) {
    return (
      <div className="min-h-screen bg-muted/30 pb-12 flex items-center justify-center p-4">
        <Card className="max-w-xl w-full border-none shadow-2xl overflow-hidden">
          <div className="bg-primary p-12 text-center text-white">
            <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h2 className="text-3xl font-headline font-bold mb-2">Listing Successful!</h2>
            <p className="opacity-90">Your property is now listed in your profile and live on the site.</p>
          </div>
          <CardContent className="p-8 space-y-6">
             <div className="p-4 bg-muted/50 rounded-xl border border-border">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" /> AI Prepared Social Post
                </p>
                <p className="text-sm italic text-gray-700 whitespace-pre-wrap">{successData.postContent}</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={sendWhatsAppConfirmation} className="bg-green-600 hover:bg-green-700 h-12 gap-2">
                  <MessageCircle className="h-4 w-4" /> WhatsApp Confirmation
                </Button>
                <Button onClick={notifyAdmin} variant="outline" className="border-primary text-primary hover:bg-primary/10 h-12 gap-2">
                  <ShieldCheck className="h-4 w-4" /> Notify Admin
                </Button>
             </div>

             <div className="flex flex-col gap-2">
               <Button onClick={() => router.push(`/rooms/${successData.id}`)} className="h-12 font-headline">
                 View Public Listing
               </Button>
               <Button variant="ghost" onClick={() => router.push('/profile')} className="h-12">
                 Go to My Profile
               </Button>
             </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-12">
      <Navbar />
      <div className="container max-w-3xl px-4 py-8 mx-auto">
        <Card className="border-none shadow-lg">
          <CardHeader className="text-center bg-primary/5 rounded-t-xl py-10">
            <CardTitle className="text-3xl font-headline font-bold text-primary">List Property</CardTitle>
            <CardDescription>Share your property details and let AI handle the marketing.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {loadingStep ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                 <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                 <p className="text-xl font-headline font-bold text-primary">{loadingStep}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Precise Location</Label>
                    <Input required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g. Poabagan, Heavir More etc." />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Property Type</Label>
                    <Select required value={formData.propertyType} onValueChange={(v) => setFormData({...formData, propertyType: v})}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Room">Single Room</SelectItem>
                        <SelectItem value="Apartment">Apartment / Flat</SelectItem>
                        <SelectItem value="PG">PG / Hostel</SelectItem>
                        <SelectItem value="Commercial">Commercial Space</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>BHK Number (If Room/Apt)</Label>
                    <Select value={formData.bhkCount} onValueChange={(v) => setFormData({...formData, bhkCount: v})}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="N/A">Not Applicable</SelectItem>
                        <SelectItem value="1">1 BHK</SelectItem>
                        <SelectItem value="2">2 BHK</SelectItem>
                        <SelectItem value="3">3 BHK</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Area (Square Feet)</Label>
                    <Input required type="number" value={formData.areaSqFt} onChange={(e) => setFormData({...formData, areaSqFt: e.target.value})} placeholder="e.g. 1200" />
                  </div>

                  <div className="space-y-2">
                    <Label>Monthly Rent (INR)</Label>
                    <Input required type="number" value={formData.rent} onChange={(e) => setFormData({...formData, rent: e.target.value})} placeholder="15000" />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label>Ideal For</Label>
                    <Select required onValueChange={(v) => setFormData({...formData, idealFor: v})}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single Tenant">Single Tenant</SelectItem>
                        <SelectItem value="PG">PG Users</SelectItem>
                        <SelectItem value="Family">Family</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                        <SelectItem value="All purpose">All Purpose</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Water Supply Source</Label>
                    <Input required value={formData.waterSource} onChange={(e) => setFormData({...formData, waterSource: e.target.value})} placeholder="e.g. Municipal / Borewell" />
                  </div>

                  <div className="space-y-2">
                    <Label>Nearest Transportation</Label>
                    <Input required value={formData.transport} onChange={(e) => setFormData({...formData, transport: e.target.value})} placeholder="e.g. 5 mins from station" />
                  </div>
                  
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Detailed Description</Label>
                    <textarea 
                      required 
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})} 
                      placeholder="Describe the room, rules, etc." 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                   <div className="flex items-center gap-2 border p-3 rounded-lg">
                      <input type="checkbox" id="wifi" checked={formData.wifi} onChange={(e) => setFormData({...formData, wifi: e.target.checked})} />
                      <Label htmlFor="wifi" className="cursor-pointer">WiFi</Label>
                   </div>
                   <div className="flex items-center gap-2 border p-3 rounded-lg">
                      <input type="checkbox" id="ac" checked={formData.ac} onChange={(e) => setFormData({...formData, ac: e.target.checked})} />
                      <Label htmlFor="ac" className="cursor-pointer">AC</Label>
                   </div>
                   <div className="flex items-center gap-2 border p-3 rounded-lg">
                      <input type="checkbox" id="backup" checked={formData.powerBackup} onChange={(e) => setFormData({...formData, powerBackup: e.target.checked})} />
                      <Label htmlFor="backup" className="cursor-pointer">Inverter</Label>
                   </div>
                </div>

                <Button type="submit" className="w-full h-14 text-lg font-headline">
                  Publish Property
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
