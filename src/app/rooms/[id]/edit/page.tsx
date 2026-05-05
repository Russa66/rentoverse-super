"use client";

import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, ShieldCheck, Camera, X, Image as ImageIcon, Loader2, Lock, ArrowRight, Info, Save, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import Link from "next/link";

export default function EditListing() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null, null, null]);
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([null, null, null, null, null]);
  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const [formData, setFormData] = useState({
    title: "",
    location: "",
    locality: "",
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
  });

  useEffect(() => {
    const fetchData = async () => {
      // 1. Get Session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);

      // 2. Get Profile/Admin Status via admin_list
      const { data: adminCheck } = await supabase.from('admin_list').select('user_id').eq('user_id', session.user.id).maybeSingle();
      setIsAdmin(!!adminCheck);

      // 3. Fetch Listing
      const { data: room, error } = await supabase
        .from('room_listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !room) {
        toast({ title: "Error", description: "Property not found.", variant: "destructive" });
        router.push('/admin');
        return;
      }

      // 4. Populate Form
      setFormData({
        title: room.title || "",
        location: room.location || "",
        locality: room.locality || "",
        transport: room.nearest_communication || "",
        rent: String(room.monthly_rent || ""),
        idealFor: room.ideal_for || "",
        propertyType: room.property_type || "Room",
        areaSqFt: String(room.area_sq_ft || ""),
        bhkCount: room.bhk_count || "N/A",
        wifi: room.amenities?.includes('WiFi') || false,
        ac: room.amenities?.includes('AC') || false,
        powerBackup: room.amenities?.includes('Inverter') || false,
        waterSource: room.water_supply_condition || "",
        description: room.description || "",
      });

      // 5. Populate Photo Previews
      const previews = [null, null, null, null, null];
      const urls = room.photo_urls || [];
      urls.forEach((url: string, i: number) => {
        if (i < 5) previews[i] = url;
      });
      setImagePreviews(previews as (string | null)[]);
      
      setLoading(false);
    };

    fetchData();
  }, [supabase, id, router]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setLoadingStep("Processing Photos...");

    try {
      const finalPhotoUrls: string[] = [];

      // Loop through previews to determine what to keep/upload
      for (let i = 0; i < imagePreviews.length; i++) {
        const preview = imagePreviews[i];
        const file = imageFiles[i];

        if (file) {
          // New file upload
          const fileExt = file.name.split('.').pop();
          const filePath = `${user.id}/${id}/${Date.now()}_${i}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('properties')
            .upload(filePath, file);

          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('properties')
            .getPublicUrl(filePath);

          finalPhotoUrls.push(publicUrl);
        } else if (preview && preview.startsWith('http')) {
          // Existing URL
          finalPhotoUrls.push(preview);
        }
      }

      setLoadingStep("Updating Database...");

      const updateData = {
        title: formData.title,
        location: formData.location,
        locality: formData.locality || formData.location.split(',')[0].trim(),
        area_sq_ft: Number(formData.areaSqFt),
        bhk_count: formData.bhkCount,
        property_type: formData.propertyType,
        nearest_communication: formData.transport,
        monthly_rent: Number(formData.rent),
        amenities: [formData.wifi && "WiFi", formData.ac && "AC", formData.powerBackup && "Inverter"].filter(Boolean),
        water_supply_condition: formData.waterSource,
        description: formData.description,
        ideal_for: formData.idealFor,
        photo_urls: finalPhotoUrls,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('room_listings')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Property Updated Successfully", description: "All changes have been saved to Postgres." });
      router.push('/admin');
      
    } catch (error: any) {
      console.error("Update Error:", error);
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
      setLoadingStep(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-medium">Fetching listing details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-12">
      <Navbar />
      <div className="container max-w-4xl px-4 py-8 mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Admin Management Mode</span>
          </div>
        </div>

        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-primary/5 border-b py-8">
            <CardTitle className="text-2xl font-headline font-bold">Edit Property Details</CardTitle>
            <CardDescription>Updating property ID: {id}</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {loadingStep ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
                <Loader2 className="h-20 w-20 text-primary animate-spin" />
                <div>
                  <p className="text-xl font-headline font-bold text-primary">{loadingStep}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-10">
                {/* Photos Section */}
                <div className="space-y-4">
                  <Label className="text-lg font-headline font-bold">Property Photos</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2 row-span-2 relative aspect-[16/10] md:aspect-auto">
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

                {/* Info Fields */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="font-bold">Listing Title</Label>
                    <Input required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label className="font-bold">Full Address</Label>
                    <Input required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">Public Locality</Label>
                    <Input required value={formData.locality} onChange={(e) => setFormData({...formData, locality: e.target.value})} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-bold">Property Type</Label>
                    <Select value={formData.propertyType} onValueChange={(v) => setFormData({...formData, propertyType: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Room">Single Room</SelectItem>
                        <SelectItem value="Apartment">Apartment / Flat</SelectItem>
                        <SelectItem value="PG">PG / Hostel</SelectItem>
                        <SelectItem value="Commercial">Commercial Shop/Office</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">Monthly Rent (₹)</Label>
                    <Input required type="number" value={formData.rent} onChange={(e) => setFormData({...formData, rent: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">BHK Count</Label>
                    <Select value={formData.bhkCount} onValueChange={(v) => setFormData({...formData, bhkCount: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="N/A">N/A</SelectItem>
                        <SelectItem value="1">1 BHK</SelectItem>
                        <SelectItem value="2">2 BHK</SelectItem>
                        <SelectItem value="3">3 BHK</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold">Description</Label>
                  <textarea 
                    required 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  />
                </div>

                {/* Amenities */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 border p-3 rounded-lg">
                      <input type="checkbox" id="wifi" checked={formData.wifi} onChange={(e) => setFormData({...formData, wifi: e.target.checked})} className="h-4 w-4" />
                      <Label htmlFor="wifi">WiFi</Label>
                  </div>
                  <div className="flex items-center gap-2 border p-3 rounded-lg">
                      <input type="checkbox" id="ac" checked={formData.ac} onChange={(e) => setFormData({...formData, ac: e.target.checked})} className="h-4 w-4" />
                      <Label htmlFor="ac">AC</Label>
                  </div>
                  <div className="flex items-center gap-2 border p-3 rounded-lg">
                      <input type="checkbox" id="backup" checked={formData.powerBackup} onChange={(e) => setFormData({...formData, powerBackup: e.target.checked})} className="h-4 w-4" />
                      <Label htmlFor="backup">Inverter</Label>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    type="submit" 
                    disabled={saving} 
                    className="flex-1 h-14 text-lg font-headline shadow-lg"
                  >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                    Save Changes
                  </Button>
                  <Link href="/admin" className="flex-1">
                    <Button type="button" variant="outline" className="w-full h-14 text-lg">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
