"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Search, MapPin, Loader2, Phone, User as UserIcon, Lock, ChevronLeft, Save, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function EditRequirement() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [formData, setFormData] = useState({
    location: "",
    budget: "",
    contactPreference: "WhatsApp",
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

      // 3. Fetch Requirement
      const { data: req, error } = await supabase
        .from('saved_search_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !req) {
        toast({ title: "Error", description: "Requirement not found.", variant: "destructive" });
        router.push('/admin');
        return;
      }

      // 4. Populate Form
      setFormData({
        location: req.location_filter || "",
        budget: String(req.max_rent || ""),
        contactPreference: req.notification_preference || "WhatsApp",
      });
      
      setLoading(false);
    };

    fetchData();
  }, [supabase, id, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('saved_search_requests')
        .update({
          location_filter: formData.location,
          max_rent: Number(formData.budget),
          notification_preference: formData.contactPreference,
        })
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Requirement Updated", description: "Changes have been saved successfully." });
      router.push('/admin');
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Admin Access</span>
          </div>
        </div>

        <Card className="border-none shadow-xl overflow-hidden">
          <CardHeader className="text-center space-y-2 pb-8 bg-primary/5 border-b">
            <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold text-primary">Edit Requirement</CardTitle>
            <CardDescription>
              Modifying requirement ID: {id}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSave} className="space-y-6">
              
              <div className="space-y-2">
                <Label className="font-bold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Preferred Locations
                </Label>
                <Input 
                  required 
                  value={formData.location} 
                  onChange={(e) => setFormData({...formData, location: e.target.value})} 
                  placeholder="e.g. Sector 62, Indirapuram" 
                  className="h-12"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="font-bold">Max Monthly Budget (INR)</Label>
                  <Input required type="number" value={formData.budget} onChange={(e) => setFormData({...formData, budget: e.target.value})} className="h-12" />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold">Contact Method</Label>
                  <Select value={formData.contactPreference} onValueChange={(v) => setFormData({...formData, contactPreference: v})}>
                    <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Call">Direct Call</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={saving} className="flex-1 h-14 text-lg font-headline shadow-lg">
                  {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                  Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/admin')} className="flex-1 h-14">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
