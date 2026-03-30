
"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, CheckCircle2, MessageCircle, ShieldCheck, Camera, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useFirestore, useUser, useAuth } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { composeSocialPost } from "@/ai/flows/ai-social-post-composer-flow";
import Image from "next/image";

export default function NewListing() {
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ id: string; postContent: string; title: string; rent: string } | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const [images, setImages] = useState<(string | null)[]>([null, null, null, null, null]);
  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

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

  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 2MB.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const newImages = [...images];
      newImages[index] = reader.result as string;
      setImages(newImages);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages[index] = null;
    setImages(newImages);
    if (fileInputRefs[index].current) {
      fileInputRefs[index].current!.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const uploadedCount = images.filter(img => img !== null).length;
    if (uploadedCount < 2) {
      toast({ 
        title: "Photos Required", 
        description: `Please upload at least 2 photos of the property. You have ${uploadedCount} uploaded.`, 
        variant: "destructive" 
      });
      return;
    }

    if (!user || !firestore) {
      toast({ title: "Connecting...", description: "Setting up your secure workspace.", variant: "default" });
      return;
    }

    setLoadingStep("Authenticating & Preparing...");

    try {
      const listingId = doc(collection(firestore, "temp")).id;
      const now = new Date().toISOString();
      const validImages = images.filter(img => img !== null) as string[];

      const listingData = {
        id: listingId,
        landlordId: user.uid,
        title: `${formData.bhkCount !== 'N/A' ? formData.bhkCount + ' BHK ' : ''}${formData.propertyType} in ${formData.location}`,
        location: formData.location,
        locality: formData.location.split(',')[0].trim(),
        areaSqFt: Number(formData.areaSqFt),
        bhkCount: formData.bhkCount,
        propertyType: formData.propertyType,
        nearestCommunication: formData.transport,
        monthlyRent: Number(formData.rent),
        amenities: [formData.wifi && "WiFi", formData.ac && "AC", formData.powerBackup && "Inverter"].filter(Boolean),
        waterSupplyCondition: formData.waterSource,
        description: formData.description,
        idealFor: formData.idealFor,
        isActive: true,
        photoUrls: validImages,
        createdAt: now,
        updatedAt: now,
      };

      setLoadingStep("Publishing to RentoVerse Database...");

      setDocumentNonBlocking(doc(firestore, `users/${user.uid}/listings/${listingId}`), listingData, { merge: true });
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
    const message = `Property: ${successData.title}\nRent: ₹${successData.rent}\n\nAI Prepared Social Post:\n\n${successData.postContent}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
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
            <p className="opacity-90">Your property is live on RentoVerse.</p>
          </div>
          <CardContent className="p-8 space-y-6">
             <div className="p-4 bg-muted/50 rounded-xl border border-border">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" /> AI Prepared Social Post
                </p>
                <p className="text-sm italic text-gray-700 whitespace-pre-wrap">{successData.postContent}</p>
             </div>

             <Button onClick={sendWhatsAppConfirmation} className="w-full bg-green-600 hover:bg-green-700 h-12 gap-2">
                <MessageCircle className="h-4 w-4" /> Share to WhatsApp
             </Button>

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
      <div className="container max-w-4xl px-4 py-8 mx-auto">
        <Card className="border-none shadow-lg overflow-hidden">
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
              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-headline font-bold">Property Photos</Label>
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" /> Minimum 2, Maximum 5 photos
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2 row-span-2 relative group aspect-square md:aspect-auto">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRefs[0]} 
                        onChange={(e) => handleImageUpload(0, e)} 
                      />
                      {images[0] ? (
                        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-md">
                          <Image src={images[0]} alt="Featured" fill className="object-cover" />
                          <button 
                            type="button" 
                            onClick={() => removeImage(0)}
                            className="absolute top-2 right-2 bg-destructive text-white p-1.5 rounded-full shadow-lg hover:bg-destructive/90 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] font-bold uppercase py-1 text-center">Featured Photo</div>
                        </div>
                      ) : (
                        <div 
                          onClick={() => fileInputRefs[0].current?.click()}
                          className="w-full h-full border-2 border-dashed border-primary/30 rounded-2xl flex flex-col items-center justify-center bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group"
                        >
                          <div className="bg-primary/20 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                            <Camera className="h-8 w-8 text-primary" />
                          </div>
                          <span className="text-sm font-bold text-primary">Upload Featured Photo</span>
                          <span className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-widest">(Required)</span>
                        </div>
                      )}
                    </div>

                    {[1, 2, 3, 4].map((idx) => (
                      <div key={idx} className="relative aspect-square">
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          ref={fileInputRefs[idx]} 
                          onChange={(e) => handleImageUpload(idx, e)} 
                        />
                        {images[idx] ? (
                          <div className="relative w-full h-full rounded-xl overflow-hidden shadow-sm">
                            <Image src={images[idx]!} alt={`Property ${idx}`} fill className="object-cover" />
                            <button 
                              type="button" 
                              onClick={() => removeImage(idx)}
                              className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full shadow-md"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => fileInputRefs[idx].current?.click()}
                            className={`w-full h-full border-2 border-dashed ${idx === 1 ? 'border-primary/30 bg-primary/5' : 'border-muted-foreground/20 bg-muted/30'} rounded-xl flex flex-col items-center justify-center hover:bg-muted/50 transition-all cursor-pointer`}
                          >
                            <Camera className={`h-5 w-5 ${idx === 1 ? 'text-primary' : 'text-muted-foreground/40'}`} />
                            {idx === 1 && <span className="text-[8px] text-primary font-bold uppercase mt-1">Required</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {images.filter(img => img !== null).length < 2 && (
                    <div className="flex items-center gap-2 text-destructive text-xs font-medium bg-destructive/5 p-3 rounded-lg border border-destructive/10">
                      <AlertCircle className="h-4 w-4" />
                      Please upload at least 2 photos (Featured + Slot 2) to publish.
                    </div>
                  )}
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="font-bold">Precise Location</Label>
                    <Input required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g. Poabagan, Heavir More" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-bold">Property Type</Label>
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
                    <Label className="font-bold">BHK Number</Label>
                    <Select value={formData.bhkCount} onValueChange={(v) => setFormData({...formData, bhkCount: v})}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="N/A">N/A</SelectItem>
                        <SelectItem value="1">1 BHK</SelectItem>
                        <SelectItem value="2">2 BHK</SelectItem>
                        <SelectItem value="3">3 BHK</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">Area (Sq Ft)</Label>
                    <Input required type="number" value={formData.areaSqFt} onChange={(e) => setFormData({...formData, areaSqFt: e.target.value})} placeholder="e.g. 1200" />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">Monthly Rent (INR)</Label>
                    <Input required type="number" value={formData.rent} onChange={(e) => setFormData({...formData, rent: e.target.value})} placeholder="15000" />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label className="font-bold">Ideal For</Label>
                    <Select required onValueChange={(v) => setFormData({...formData, idealFor: v})}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single Tenant">Single Tenant</SelectItem>
                        <SelectItem value="PG">PG Users</SelectItem>
                        <SelectItem value="Family">Family</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">Water Source</Label>
                    <Input required value={formData.waterSource} onChange={(e) => setFormData({...formData, waterSource: e.target.value})} placeholder="e.g. Municipal" />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">Transport</Label>
                    <Input required value={formData.transport} onChange={(e) => setFormData({...formData, transport: e.target.value})} placeholder="e.g. 5 mins from station" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                   <div className="flex items-center gap-2 border p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <input type="checkbox" id="wifi" checked={formData.wifi} onChange={(e) => setFormData({...formData, wifi: e.target.checked})} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      <Label htmlFor="wifi" className="cursor-pointer font-medium">WiFi</Label>
                   </div>
                   <div className="flex items-center gap-2 border p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <input type="checkbox" id="ac" checked={formData.ac} onChange={(e) => setFormData({...formData, ac: e.target.checked})} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      <Label htmlFor="ac" className="cursor-pointer font-medium">AC</Label>
                   </div>
                   <div className="flex items-center gap-2 border p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <input type="checkbox" id="backup" checked={formData.powerBackup} onChange={(e) => setFormData({...formData, powerBackup: e.target.checked})} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      <Label htmlFor="backup" className="cursor-pointer font-medium">Inverter</Label>
                   </div>
                </div>

                <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex items-start gap-4">
                  <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-headline font-bold text-primary">Secured Submission</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      By publishing, your listing will be verified by our team. Our AI will also draft a professional post for your WhatsApp and Facebook groups instantly.
                    </p>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={!!loadingStep || images.filter(img => img !== null).length < 2} 
                  className="w-full h-16 text-xl font-headline shadow-xl hover:shadow-primary/20 transition-all"
                >
                  {loadingStep || "Publish Property Listing"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
