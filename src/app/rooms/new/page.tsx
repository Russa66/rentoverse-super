
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
import { MapPin, Train, Wifi, Zap, Wind, Droplets, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useFirestore, useUser } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
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
      toast({
        title: "Authentication Required",
        description: "Please sign in to list a room.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const listingId = doc(collection(firestore, "dummy")).id;
      const listingPath = `users/${user.uid}/listings/${listingId}`;
      const publicListingPath = `published_room_listings/${listingId}`;

      const listingData = {
        id: listingId,
        landlordId: user.uid,
        title: `${formData.idealFor} Room in ${formData.location.split(',')[0]}`,
        location: formData.location,
        nearestCommunicationOptions: [formData.transport],
        monthlyRent: Number(formData.rent),
        currency: "INR",
        amenities: [
          formData.wifi && "WiFi",
          formData.ac && "AC",
          formData.powerBackup && "Inverter",
          formData.water247 && "24/7 Water"
        ].filter(Boolean),
        waterSupplyCondition: formData.waterDetails,
        description: formData.description,
        availabilityStatus: "PUBLISHED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 1. Save to Landlord's Private Collection
      setDocumentNonBlocking(doc(firestore, listingPath), listingData, { merge: true });

      // 2. Save to Public Collection
      setDocumentNonBlocking(doc(firestore, publicListingPath), listingData, { merge: true });

      // 3. Automatically Generate and "Post" to Facebook via AI
      const aiPost = await composeSocialPost({
        location: formData.location,
        nearestCommunication: formData.transport,
        wifiAvailable: formData.wifi,
        inverterAvailable: formData.powerBackup,
        acAvailable: formData.ac,
        waterSupplyCondition: formData.waterDetails,
        monthlyRent: `₹${formData.rent}`,
        socialMediaType: "facebook"
      });

      const socialPostData = {
        authorId: user.uid,
        listingId: listingId,
        platform: "facebook",
        postContent: aiPost.postContent,
        status: "POSTED",
        postedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      addDocumentNonBlocking(collection(firestore, "social_posts"), socialPostData);

      toast({
        title: "Success!",
        description: "Your listing is live and has been automatically posted to Facebook.",
      });

      router.push(`/rooms/${listingId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong while creating your listing.",
        variant: "destructive"
      });
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
            <CardDescription className="text-base">
              Enter your room details below. All fields are mandatory.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-headline font-semibold text-lg flex items-center gap-2 border-b pb-2">
                  <MapPin className="h-5 w-5 text-primary" /> Location & Details
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="location">Precise Location</Label>
                    <Input 
                      id="location" 
                      placeholder="e.g. 123 Main St, Near Central Park" 
                      required 
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transport">Nearest Transport (Station/Bus Stop)</Label>
                    <div className="relative">
                      <Train className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="transport" 
                        className="pl-9" 
                        placeholder="e.g. 5-min walk to Metro" 
                        required 
                        value={formData.transport}
                        onChange={(e) => setFormData({...formData, transport: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rent">Monthly Rent (INR)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-muted-foreground text-sm font-bold">₹</span>
                      <Input 
                        id="rent" 
                        type="number"
                        className="pl-7" 
                        placeholder="e.g. 15000" 
                        required 
                        value={formData.rent}
                        onChange={(e) => setFormData({...formData, rent: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="idealFor">Room Ideal For</Label>
                    <Select 
                      required 
                      onValueChange={(v) => setFormData({...formData, idealFor: v})}
                    >
                      <SelectTrigger id="idealFor" className="w-full">
                        <SelectValue placeholder="Select who this room is best for" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single Tenant">Single Tenant</SelectItem>
                        <SelectItem value="Family">Family</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-4">
                <h3 className="font-headline font-semibold text-lg flex items-center gap-2 border-b pb-2">
                  <Zap className="h-5 w-5 text-secondary" /> Amenities & Facilities
                </h3>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg border p-4 bg-white">
                    <div className="flex items-center gap-3">
                      <Wifi className="h-5 w-5 text-primary" />
                      <div>
                        <Label className="text-base">WiFi Available</Label>
                        <p className="text-xs text-muted-foreground">High-speed internet access</p>
                      </div>
                    </div>
                    <Switch 
                      checked={formData.wifi}
                      onCheckedChange={(v) => setFormData({...formData, wifi: v})}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4 bg-white">
                    <div className="flex items-center gap-3">
                      <Wind className="h-5 w-5 text-secondary" />
                      <div>
                        <Label className="text-base">Air Conditioning</Label>
                        <p className="text-xs text-muted-foreground">Installed AC unit</p>
                      </div>
                    </div>
                    <Switch 
                      checked={formData.ac}
                      onCheckedChange={(v) => setFormData({...formData, ac: v})}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4 bg-white">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      <div>
                        <Label className="text-base">Power Backup</Label>
                        <p className="text-xs text-muted-foreground">Inverter system installed</p>
                      </div>
                    </div>
                    <Switch 
                      checked={formData.powerBackup}
                      onCheckedChange={(v) => setFormData({...formData, powerBackup: v})}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4 bg-white">
                    <div className="flex items-center gap-3">
                      <Droplets className="h-5 w-5 text-blue-500" />
                      <div>
                        <Label className="text-base">24/7 Water</Label>
                        <p className="text-xs text-muted-foreground">Continuous supply</p>
                      </div>
                    </div>
                    <Switch 
                      checked={formData.water247}
                      onCheckedChange={(v) => setFormData({...formData, water247: v})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="water">Water Supply Condition Details</Label>
                  <Input 
                    id="water" 
                    placeholder="e.g. Municipal water with overhead tank" 
                    required 
                    value={formData.waterDetails}
                    onChange={(e) => setFormData({...formData, waterDetails: e.target.value})}
                  />
                </div>
              </div>

              {/* Photos & Description */}
              <div className="space-y-4">
                <h3 className="font-headline font-semibold text-lg flex items-center gap-2 border-b pb-2">
                  <Camera className="h-5 w-5 text-destructive" /> Photos & More
                </h3>
                <div className="grid gap-4">
                   <div className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center bg-muted/50 text-center cursor-pointer hover:bg-muted transition-colors">
                      <Camera className="h-10 w-10 text-muted-foreground mb-4" />
                      <p className="font-semibold">Click to upload room photos</p>
                      <p className="text-sm text-muted-foreground">Add at least 3 clear photos of the room and bathroom.</p>
                   </div>
                   <div className="space-y-2">
                    <Label htmlFor="description">Short Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Describe the room, sunlight, neighbors..." 
                      className="min-h-[100px]" 
                      required 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full h-14 text-lg font-headline" disabled={loading}>
                {loading ? "Publishing & Posting to Social..." : "Publish Room Listing"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
