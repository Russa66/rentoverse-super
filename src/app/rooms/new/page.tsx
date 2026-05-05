"use client";

import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, ShieldCheck, Camera, X, Image as ImageIcon, Loader2, Lock, ArrowRight, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";

export default function NewListing() {
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ id: string; title: string; rent: string } | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null, null, null]);
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([null, null, null, null, null]);
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
    description: "",
    // Admin fields for posting on behalf of others
    landlordName: "",
    landlordEmail: "",
    landlordPhone: ""
  });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      if (session?.user) {
        // Fetch if user is admin via admin_list table
        const { data } = await supabase.from('admin_list').select('user_id').eq('user_id', session.user.id).maybeSingle();
        setIsAdmin(!!data);
      }
      
      setLoadingUser(false);
    };
    fetchSession();
  }, [supabase]);

  const isRegistered = user != null;

  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
      return;
    }

    const newFiles = [...imageFiles];
    newFiles[index] = file;
    setImageFiles(newFiles);

    const reader = new FileReader();
    reader.onloadend = () => {
      const newPreviews = [...imagePreviews];
      newPreviews[index] = reader.result as string;
      setImagePreviews(newPreviews);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    newFiles[index] = null;
    newPreviews[index] = null;
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
    if (fileInputRefs[index].current) {
      fileInputRefs[index].current!.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({ title: "Registration Required", description: "Waiting for authenticated session...", variant: "destructive" });
      return;
    }

    const uploadedCount = imageFiles.filter(img => img !== null).length;
    if (uploadedCount < 1) {
      toast({ 
        title: "Photos Required", 
        description: `Please upload at least 1 photo of the property.`, 
        variant: "destructive" 
      });
      return;
    }

    setLoadingStep("Uploading Photos...");

    try {
      const listingId = uuidv4();
      const photoUrls: string[] = [];

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        if (file) {
           const fileExt = file.name.split('.').pop();
           const filePath = `${user.id}/${listingId}/${i}.${fileExt}`;
           
           const { error: uploadError } = await supabase.storage
             .from('properties')
             .upload(filePath, file);

           if (uploadError) throw uploadError;
           
           const { data: { publicUrl } } = supabase.storage
             .from('properties')
             .getPublicUrl(filePath);

           photoUrls.push(publicUrl);
        }
      }

      setLoadingStep("Publishing Postgres Listing...");

      const now = new Date().toISOString();
      let landlordId = user.id;

      // If admin is posting for someone else
      if (isAdmin && formData.landlordEmail) {
        // 1. Check if user already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', formData.landlordEmail)
          .single();

        if (existingUser) {
          landlordId = existingUser.id;
        } else {
          // 2. Create a new shadow user
          const newUserId = crypto.randomUUID();
          const { error: userError } = await supabase.from('users').insert({
            id: newUserId,
            name: formData.landlordName,
            email: formData.landlordEmail,
            phone_number: formData.landlordPhone,
            is_verified: true,
          });

          if (userError) throw new Error("Failed to create landlord profile: " + userError.message);
          landlordId = newUserId;
        }
      } else {
        // Find the internal ID of the currently logged in user
        const { data: currentUser } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();
        
        if (currentUser) {
          landlordId = currentUser.id;
        }
      }

      const listingData = {
        id: listingId,
        landlord_id: landlordId,
        title: `${formData.bhkCount !== 'N/A' ? formData.bhkCount + ' BHK ' : ''}${formData.propertyType} in ${formData.location}`,
        location: formData.location,
        locality: formData.location.split(',')[0].trim() || formData.location,
        area_sq_ft: Number(formData.areaSqFt),
        bhk_count: formData.bhkCount,
        property_type: formData.propertyType,
        nearest_communication: formData.transport,
        monthly_rent: Number(formData.rent),
        amenities: [formData.wifi && "WiFi", formData.ac && "AC", formData.powerBackup && "Inverter"].filter(Boolean),
        water_supply_condition: formData.waterSource,
        description: formData.description,
        ideal_for: formData.idealFor,
        is_active: true,
        photo_urls: photoUrls,
        created_at: now,
        updated_at: now,
      };

      const { error } = await supabase.from('room_listings').insert(listingData);
      if (error) throw error;

      setSuccessData({ 
        id: listingId, 
        title: listingData.title, 
        rent: formData.rent 
      });
      
    } catch (error: any) {
      console.error("Listing Submission Error:", error);
      toast({ 
        title: "Submission Error", 
        description: error.message || "Could not save listing.", 
        variant: "destructive" 
      });
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

  if (successData) {
    return (
      <div className="min-h-screen bg-muted/30 pb-12 flex items-center justify-center p-4">
        <Card className="max-w-xl w-full border-none shadow-2xl overflow-hidden">
          <div className="bg-primary p-12 text-center text-white">
            <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h2 className="text-3xl font-headline font-bold mb-2">Property Published!</h2>
            <p className="opacity-90">Your property is now live and visible to renters.</p>
          </div>
          <CardContent className="p-8 space-y-6">
             <div className="p-4 bg-muted/50 rounded-xl border border-border">
                <p className="text-sm font-bold">{successData.title}</p>
                <p className="text-sm text-primary font-bold">Rent: ₹{successData.rent}</p>
             </div>

             <div className="flex flex-col gap-2">
               <Button onClick={() => router.push(`/rooms/${successData.id}`)} className="h-12 font-headline">
                 View Listing
               </Button>
               <Button variant="ghost" onClick={() => router.push('/profile')} className="h-12">
                 Return to Dashboard
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
        {!isRegistered ? (
          <Card className="border-none shadow-xl text-center p-12 space-y-6 bg-white">
            <div className="bg-destructive/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <Lock className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-headline font-bold">Registration Required</h1>
              <p className="text-muted-foreground max-w-sm mx-auto">
                To list a property on RentoVerse, you must have a verified account. This helps us maintain a secure and trustworthy marketplace.
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
          <Card className="border-none shadow-lg overflow-hidden">
            <CardHeader className="text-center bg-primary/5 rounded-t-xl py-10">
              <CardTitle className="text-3xl font-headline font-bold text-primary">List Your Property</CardTitle>
              <CardDescription>Upload photos and details to start finding tenants.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {loadingStep ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
                  <Loader2 className="h-20 w-20 text-primary animate-spin" />
                  <div>
                    <p className="text-xl font-headline font-bold text-primary">{loadingStep}</p>
                    <p className="text-sm text-muted-foreground mt-2">Uploading property data...</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-10">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-headline font-bold">Property Photos</Label>
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" /> Min 1 photo required
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Similar upload UI, omitting standard upload UI bloat for brevity but keeping logic unchanged */}
                      <div className="col-span-2 row-span-2 relative aspect-square md:aspect-auto">
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRefs[0]} onChange={(e) => handleImageUpload(0, e)} />
                        {imagePreviews[0] ? (
                          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-md">
                            <Image src={imagePreviews[0]} alt="Featured" fill className="object-cover" />
                            <button type="button" onClick={() => removeImage(0)} className="absolute top-2 right-2 bg-destructive text-white p-1.5 rounded-full shadow-lg"><X className="h-4 w-4" /></button>
                          </div>
                        ) : (
                          <div onClick={() => fileInputRefs[0].current?.click()} className="w-full h-full border-2 border-dashed border-primary/30 rounded-2xl flex flex-col items-center justify-center bg-primary/5 hover:bg-primary/10 cursor-pointer">
                            <Camera className="h-8 w-8 text-primary mb-3" />
                            <span className="text-sm font-bold text-primary">Add Cover Photo</span>
                          </div>
                        )}
                      </div>

                      {[1, 2, 3, 4].map((idx) => (
                        <div key={idx} className="relative aspect-square">
                          <input type="file" accept="image/*" className="hidden" ref={fileInputRefs[idx]} onChange={(e) => handleImageUpload(idx, e)} />
                          {imagePreviews[idx] ? (
                            <div className="relative w-full h-full rounded-xl overflow-hidden shadow-sm">
                              <Image src={imagePreviews[idx]!} alt={`Property ${idx}`} fill className="object-cover" />
                              <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full"><X className="h-3 w-3" /></button>
                            </div>
                          ) : (
                            <div onClick={() => fileInputRefs[idx].current?.click()} className="w-full h-full border-2 border-dashed border-muted-foreground/20 bg-muted/30 rounded-xl flex flex-col items-center justify-center cursor-pointer">
                              <Camera className="h-5 w-5 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl space-y-6 mb-8 shadow-inner">
                      <div className="flex items-center gap-2 text-primary">
                        <ShieldCheck className="h-5 w-5" />
                        <h3 className="font-headline font-bold">Landlord Contact (Admin Only)</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                          <Input 
                            placeholder="e.g. Rahul Sharma" 
                            className="bg-white"
                            value={formData.landlordName} 
                            onChange={(e) => setFormData({...formData, landlordName: e.target.value})} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                          <Input 
                            type="email" 
                            placeholder="landlord@email.com" 
                            className="bg-white"
                            value={formData.landlordEmail} 
                            onChange={(e) => setFormData({...formData, landlordEmail: e.target.value})} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number</Label>
                          <Input 
                            placeholder="e.g. +91 9876543210" 
                            className="bg-white"
                            value={formData.landlordPhone} 
                            onChange={(e) => setFormData({...formData, landlordPhone: e.target.value})} 
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-white/50 rounded-lg border border-primary/10">
                         <Info className="h-4 w-4 text-primary shrink-0" />
                         <p className="text-[11px] text-muted-foreground leading-tight">
                           If these fields are filled, a new account will be prepared for this landlord. 
                           Properties listed here will automatically appear in their dashboard once they log in.
                         </p>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="font-bold">Full Address / Location</Label>
                      <Input required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g. 12B, Green Park, South Block" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="font-bold">Property Type</Label>
                      <Select required value={formData.propertyType} onValueChange={(v) => setFormData({...formData, propertyType: v})}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Room">Single Room</SelectItem>
                          <SelectItem value="Apartment">Apartment / Flat</SelectItem>
                          <SelectItem value="PG">PG / Hostel</SelectItem>
                          <SelectItem value="Commercial">Commercial Shop/Office</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold">BHK Configuration</Label>
                      <Select value={formData.bhkCount} onValueChange={(v) => setFormData({...formData, bhkCount: v})}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="N/A">N/A (Single Room/PG)</SelectItem>
                          <SelectItem value="1">1 BHK</SelectItem>
                          <SelectItem value="2">2 BHK</SelectItem>
                          <SelectItem value="3">3 BHK</SelectItem>
                          <SelectItem value="4+">4+ BHK</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold">Area (Sq Ft)</Label>
                      <Input required type="number" value={formData.areaSqFt} onChange={(e) => setFormData({...formData, areaSqFt: e.target.value})} placeholder="e.g. 1200" />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold">Monthly Rent (₹)</Label>
                      <Input required type="number" value={formData.rent} onChange={(e) => setFormData({...formData, rent: e.target.value})} placeholder="e.g. 15000" />
                    </div>

                    <div className="space-y-2">
                       <Label className="font-bold">Ideal For</Label>
                       <Select required onValueChange={(v) => setFormData({...formData, idealFor: v})}>
                         <SelectTrigger><SelectValue placeholder="Select target audience" /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="Bachelor">Bachelors / Students</SelectItem>
                           <SelectItem value="Family">Families</SelectItem>
                           <SelectItem value="Anyone">All Purpose</SelectItem>
                           <SelectItem value="Commercial">Commercial Clients</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold">Nearest Communication / Transport</Label>
                      <Input required value={formData.transport} onChange={(e) => setFormData({...formData, transport: e.target.value})} placeholder="e.g. Metro Station, Bus Stand" />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold">Water Supply Condition</Label>
                      <Input required value={formData.waterSource} onChange={(e) => setFormData({...formData, waterSource: e.target.value})} placeholder="e.g. 24/7 Corporation Water" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">Property Description</Label>
                    <textarea 
                      required 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})} 
                      placeholder="Describe your property (e.g. newly painted, ventilated rooms, floor level...)"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 border p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                        <input type="checkbox" id="wifi" checked={formData.wifi} onChange={(e) => setFormData({...formData, wifi: e.target.checked})} className="h-4 w-4" />
                        <Label htmlFor="wifi" className="cursor-pointer font-medium">WiFi</Label>
                    </div>
                    <div className="flex items-center gap-2 border p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                        <input type="checkbox" id="ac" checked={formData.ac} onChange={(e) => setFormData({...formData, ac: e.target.checked})} className="h-4 w-4" />
                        <Label htmlFor="ac" className="cursor-pointer font-medium">AC</Label>
                    </div>
                    <div className="flex items-center gap-2 border p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                        <input type="checkbox" id="backup" checked={formData.powerBackup} onChange={(e) => setFormData({...formData, powerBackup: e.target.checked})} className="h-4 w-4" />
                        <Label htmlFor="backup" className="cursor-pointer font-medium">Inverter</Label>
                    </div>
                  </div>

                  <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex items-start gap-4">
                    <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
                    <div>
                      <p className="font-headline font-bold text-primary">Secure Marketplace Access</p>
                      <p className="text-sm text-muted-foreground">
                        Property images are stored securely.
                      </p>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={!!loadingStep || !isRegistered} 
                    className="w-full h-16 text-xl font-headline shadow-xl hover:shadow-primary/20 transition-all"
                  >
                    {loadingStep || "Publish Listing"}
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
