"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Train, Wifi, Zap, Wind, Droplets, Camera, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useFirestore, useUser } from "@/firebase";
import { collection, doc, query, getDocs, where } from "firebase/firestore";
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { composeSocialPost } from "@/ai/flows/ai-social-post-composer-flow";

export default function NewListing() {
  const [loading, setLoading] = useState(false);
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
    if (!user) {
      toast({ title: "Authentication Required", description: "Please sign in.", variant: "destructive" });
      return;
    }

    setLoading(true);

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

      // 2. AI Social Post
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
        postContent: aiPost.postContent,
        status: "POSTED",
        createdAt: new Date().toISOString()
      });

      // 3. Match with Tenants
      const q = query(collection(firestore, "saved_search_requests"), where("locationFilter", "==", formData.location));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((tenantDoc) => {
        const tenant = tenantDoc.data();
        addDocumentNonBlocking(collection(firestore, `users/${tenant.renterId}/notifications`), {
          recipientId: tenant.renterId,
          message: `New property match in ${formData.location}! Budget: ₹${formData.rent}`,
          notificationType: "ListingMatch",
          deliveryMethod: "InApp",
          status: "Pending",
          createdAt: new Date().toISOString()
        });
      });

      toast({ title: "Success!", description: "Listing live & Facebook post shared!" });
      router.push(`/rooms/${listingId}`);
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-12">
      <Navbar />
      <div className="container max-w-3xl px-4 py-8 mx-auto">
        <Card className="border-none shadow-lg">
          <CardHeader className="text-center bg-primary/5 rounded-t-xl py-10">
            <CardTitle className="text-3xl font-headline font-bold">List Your Room</CardTitle>
            <CardDescription>Share your property with thousands of verified renters.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
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
              </div>
              <Button type="submit" disabled={loading} className="w-full h-14 text-lg">
                {loading ? "Processing..." : "Publish & Share Listing"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
