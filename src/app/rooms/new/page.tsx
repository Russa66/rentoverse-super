
"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Facebook, MessageCircle, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useFirestore, useUser } from "@/firebase";
import { collection, doc, query, getDocs, where } from "firebase/firestore";
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { composeSocialPost } from "@/ai/flows/ai-social-post-composer-flow";

export default function NewListing() {
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { firestore } = useFirestore();
  const { user } = useUser();

  const [formData, setFormData] = useState({
    location: "",
    transport: "",
    rent: "",
    idealFor: "",
    wifi: false,
    ac: false,
    powerBackup: false,
    water247: false,
    waterDetails: "",
    description: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) {
      toast({ title: "Authentication Required", description: "Please sign in to list a room.", variant: "destructive" });
      return;
    }

    setLoadingStep("Saving Listing...");

    try {
      const listingId = doc(collection(firestore, "temp")).id;
      const listingData = {
        id: listingId,
        landlordId: user.uid,
        title: `${formData.idealFor} Room in ${formData.location}`,
        location: formData.location,
        nearestCommunicationOptions: [formData.transport],
        monthlyRent: Number(formData.rent),
        currency: "INR",
        amenities: [formData.wifi && "WiFi", formData.ac && "AC", formData.powerBackup && "Inverter"].filter(Boolean),
        waterSupplyCondition: formData.waterDetails,
        description: formData.description,
        availabilityStatus: "PUBLISHED",
        createdAt: new Date().toISOString(),
      };

      // 1. Save Listings
      setDocumentNonBlocking(doc(firestore, `users/${user.uid}/listings/${listingId}`), listingData, { merge: true });
      setDocumentNonBlocking(doc(firestore, `published_room_listings/${listingId}`), listingData, { merge: true });

      // 2. AI Social Post Configuration Check
      setLoadingStep("AI is Formatting for Facebook Page...");
      const channelQuery = query(collection(firestore, `users/${user.uid}/social_channel_configurations`), where("platform", "==", "Facebook"), where("enabled", "==", true));
      const channelSnapshot = await getDocs(channelQuery);
      const configuredChannel = channelSnapshot.docs[0]?.data();

      const aiPost = await composeSocialPost({
        type: "listing",
        location: formData.location,
        nearestCommunication: formData.transport,
        monthlyRent: `₹${formData.rent}`,
        socialMediaType: "facebook"
      });

      addDocumentNonBlocking(collection(firestore, "social_posts"), {
        authorId: user.uid,
        listingId,
        platform: "facebook",
        channelIdentifier: configuredChannel?.channelIdentifier || null,
        postContent: aiPost.postContent,
        status: "POSTED",
        createdAt: new Date().toISOString()
      });

      // 3. Match with Tenants
      setLoadingStep("Matching with Prospective Tenants...");
      const q = query(collection(firestore, "saved_search_requests"), where("locationFilter", "==", formData.location));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((tenantDoc) => {
        const tenant = tenantDoc.data();
        const msg = `New property match in ${formData.location}! Budget: ₹${formData.rent}`;
        
        // Multi-channel notifications
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

      toast({ title: "Success!", description: `Listing live ${configuredChannel ? 'and posted to your FB Page!' : 'and shared to FB Groups!'}` });
      router.push(`/rooms/${listingId}`);
    } catch (error) {
      toast({ title: "Error", description: "Failed to publish listing.", variant: "destructive" });
    } finally {
      setLoadingStep(null);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-12">
      <Navbar />
      <div className="container max-w-3xl px-4 py-8 mx-auto">
        <Card className="border-none shadow-lg">
          <CardHeader className="text-center bg-primary/5 rounded-t-xl py-10">
            <CardTitle className="text-3xl font-headline font-bold text-primary">List Your Room</CardTitle>
            <CardDescription>Share your property with thousands of verified renters on RentiPedia.</CardDescription>
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
                   <p className="text-sm text-muted-foreground mt-2">Hang tight, RentiPedia's AI is working for you.</p>
                 </div>
                 <div className="flex gap-4 opacity-50">
                    <Facebook className="h-6 w-6" />
                    <MessageCircle className="h-6 w-6" />
                    <Mail className="h-6 w-6" />
                 </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Precise Location</Label>
                    <Input required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g. Koramangala, Bangalore" />
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
                        <SelectItem value="Family">Family</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Nearest Transportation / Landmarks</Label>
                    <Input required value={formData.transport} onChange={(e) => setFormData({...formData, transport: e.target.value})} placeholder="e.g. 5 mins from Indiranagar Metro" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Water Supply Conditions</Label>
                    <Input required value={formData.waterDetails} onChange={(e) => setFormData({...formData, waterDetails: e.target.value})} placeholder="e.g. 24/7 Municipal & Borewell" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Detailed Description</Label>
                    <textarea 
                      required 
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})} 
                      placeholder="Describe the room, furniture, roommates, etc." 
                    />
                  </div>
                </div>
                
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-start gap-3">
                   <Sparkles className="h-5 w-5 text-primary mt-1 shrink-0" />
                   <p className="text-xs text-muted-foreground leading-relaxed">
                     By publishing, RentiPedia's AI will automatically draft and post an optimized listing to your configured Facebook page or groups and notify matching tenants via WhatsApp and Email.
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
