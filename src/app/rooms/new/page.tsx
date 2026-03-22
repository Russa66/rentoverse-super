
"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, CheckCircle2, MessageCircle, ShieldCheck, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useFirestore, useUser, useAuth } from "@/firebase";
import { collection, doc, query, getDocs, where } from "firebase/firestore";
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { composeSocialPost } from "@/ai/flows/ai-social-post-composer-flow";

export default function NewListing() {
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ id: string; postContent: string } | null>(null);
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

    setLoadingStep("Saving Listing...");

    try {
      const listingId = doc(collection(firestore, "temp")).id;
      const listingData = {
        id: listingId,
        landlordId: user.uid,
        title: `${formData.bhkCount !== 'N/A' ? formData.bhkCount + ' BHK ' : ''}${formData.propertyType} in ${formData.location}`,
        location: formData.location,
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
        availabilityStatus: "PUBLISHED",
        createdAt: new Date().toISOString(),
      };

      setDocumentNonBlocking(doc(firestore, `users/${user.uid}/listings/${listingId}`), listingData, { merge: true });
      setDocumentNonBlocking(doc(firestore, `published_room_listings/${listingId}`), listingData, { merge: true });

      setLoadingStep("AI is Formatting for Facebook & WhatsApp...");
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

      addDocumentNonBlocking(collection(firestore, "social_posts"), {
        authorId: user.uid,
        listingId,
        platform: "facebook",
        postContent: aiPost.postContent,
        status: "POSTED",
        createdAt: new Date().toISOString()
      });

      setLoadingStep("Matching with Prospective Tenants...");
      const q = query(collection(firestore, "saved_search_requests"), where("locationFilter", "==", formData.location));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((tenantDoc) => {
        const tenant = tenantDoc.data();
        const msg = `Match! ${listingData.title} available now. Budget fits: ₹${formData.rent}`;
        
        ["InApp", "WhatsApp", "Email"].forEach(method => {
          addDocumentNonBlocking(collection(firestore, `users/${tenant.renterId}/notifications`), {
            recipientId: tenant.renterId,
            message: msg,
            notificationType: "ListingMatch",
            deliveryMethod: method,
            status: "Pending",
            createdAt: new Date().toISOString()
          });
        });
      });

      setSuccessData({ id: listingId, postContent: aiPost.postContent });
      toast({ title: "Success!", description: "Listing live and shared to Facebook!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to publish listing.", variant: "destructive" });
    } finally {
      setLoadingStep(null);
    }
  };

  const shareWithAdmin = () => {
    if (!successData) return;
    const adminWhatsApp = "919000000000"; // Replace with real admin number
    const text = encodeURIComponent(`New Listing Alert! ID: ${successData.id}\n\n${successData.postContent}`);
    window.open(`https://wa.me/${adminWhatsApp}?text=${text}`, "_blank");
  };

  const shareToOwner = () => {
    if (!successData) return;
    const text = encodeURIComponent(`Your RentoVerse Listing is Live!\n\n${successData.postContent}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
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
            <p className="opacity-90">Your property is now live and matching with tenants.</p>
          </div>
          <CardContent className="p-8 space-y-6">
             <div className="p-4 bg-muted/50 rounded-xl border border-border">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" /> AI Generated Post Content
                </p>
                <p className="text-sm italic text-gray-700 leading-relaxed whitespace-pre-wrap">{successData.postContent}</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={shareToOwner} className="bg-green-600 hover:bg-green-700 h-12 gap-2">
                  <MessageCircle className="h-4 w-4" /> Save to WhatsApp
                </Button>
                <Button onClick={shareWithAdmin} variant="outline" className="border-primary text-primary hover:bg-primary/10 h-12 gap-2">
                  <ShieldCheck className="h-4 w-4" /> Notify Admin
                </Button>
             </div>

             <Button onClick={() => router.push(`/rooms/${successData.id}`)} className="w-full h-12 font-headline">
               View My Listing
             </Button>
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
            <CardTitle className="text-3xl font-headline font-bold text-primary">List Your Property</CardTitle>
            <CardDescription>Share your property details and let RentoVerse AI handle the marketing.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {loadingStep ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                 <div className="relative">
                   <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                   <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
                 </div>
                 <div className="text-center">
                   <p className="text-xl font-headline font-bold text-primary">{loadingStep}</p>
                   <p className="text-sm text-muted-foreground mt-2">Hang tight, RentoVerse's AI is working for you.</p>
                 </div>
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
                        <SelectItem value="4+">4+ BHK</SelectItem>
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

                  <div className="space-y-2">
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

                  <div className="space-y-2 sm:col-span-2">
                    <Label>Nearest Transportation / Landmarks</Label>
                    <Input required value={formData.transport} onChange={(e) => setFormData({...formData, transport: e.target.value})} placeholder="e.g. 5 mins from indira more" />
                  </div>
                  
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Detailed Description</Label>
                    <textarea 
                      required 
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})} 
                      placeholder="Describe furniture, roommates, rules, etc." 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                   <div className="flex items-center gap-2 border p-3 rounded-lg">
                      <input type="checkbox" id="wifi" checked={formData.wifi} onChange={(e) => setFormData({...formData, wifi: e.target.checked})} className="h-4 w-4 rounded border-gray-300 text-primary" />
                      <Label htmlFor="wifi" className="cursor-pointer">WiFi</Label>
                   </div>
                   <div className="flex items-center gap-2 border p-3 rounded-lg">
                      <input type="checkbox" id="ac" checked={formData.ac} onChange={(e) => setFormData({...formData, ac: e.target.checked})} className="h-4 w-4 rounded border-gray-300 text-primary" />
                      <Label htmlFor="ac" className="cursor-pointer">AC</Label>
                   </div>
                   <div className="flex items-center gap-2 border p-3 rounded-lg">
                      <input type="checkbox" id="backup" checked={formData.powerBackup} onChange={(e) => setFormData({...formData, powerBackup: e.target.checked})} className="h-4 w-4 rounded border-gray-300 text-primary" />
                      <Label htmlFor="backup" className="cursor-pointer">Inverter</Label>
                   </div>
                </div>
                
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-start gap-3">
                   <Sparkles className="h-5 w-5 text-primary mt-1 shrink-0" />
                   <p className="text-xs text-muted-foreground leading-relaxed">
                     By publishing, RentoVerse's AI will automatically draft an optimized listing for social media and notify matching tenants.
                   </p>
                </div>

                <Button type="submit" className="w-full h-14 text-lg font-headline">
                  Publish & Share Everywhere
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
