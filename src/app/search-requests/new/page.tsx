
"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useFirestore, useUser } from "@/firebase";
import { collection, doc, query, getDocs, where } from "firebase/firestore";
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { composeSocialPost } from "@/ai/flows/ai-social-post-composer-flow";
import { Search, Sparkles, Facebook, MessageCircle, Mail } from "lucide-react";

export default function PostRequirement() {
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { firestore } = useFirestore();
  const { user } = useUser();

  const [formData, setFormData] = useState({
    location: "",
    budget: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Authentication Required", description: "Please sign in to post a requirement.", variant: "destructive" });
      return;
    }

    setLoadingStep("Saving Requirement...");

    try {
      const requestId = doc(collection(firestore, "temp")).id;
      const requestData = {
        id: requestId,
        renterId: user.uid,
        locationFilter: formData.location,
        maxRent: Number(formData.budget),
        notificationPreference: "WhatsApp",
        createdAt: new Date().toISOString(),
      };

      // 1. Save Request
      setDocumentNonBlocking(doc(firestore, `users/${user.uid}/saved_search_requests/${requestId}`), requestData, { merge: true });
      setDocumentNonBlocking(doc(firestore, `saved_search_requests/${requestId}`), requestData, { merge: true });

      // 2. AI Social Post
      setLoadingStep("AI is Sharing to Facebook Groups...");
      const aiPost = await composeSocialPost({
        type: "requirement",
        location: formData.location,
        monthlyRent: `₹${formData.budget}`,
        socialMediaType: "facebook"
      });
      addDocumentNonBlocking(collection(firestore, "social_posts"), {
        authorId: user.uid,
        savedSearchRequestId: requestId,
        platform: "facebook",
        postContent: aiPost.postContent,
        status: "POSTED",
        createdAt: new Date().toISOString()
      });

      // 3. Match with Landlords
      setLoadingStep("Searching for Matching Property Owners...");
      const q = query(collection(firestore, "published_room_listings"), where("location", "==", formData.location));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((listingDoc) => {
        const listing = listingDoc.data();
        const msg = `A tenant is looking for a room in ${formData.location} with budget ₹${formData.budget}. Your property is a match!`;
        
        // Multi-channel notifications for Landlord
        ["InApp", "WhatsApp", "Email"].forEach(method => {
          addDocumentNonBlocking(collection(firestore, `users/${listing.landlordId}/notifications`), {
            recipientId: listing.landlordId,
            message: msg,
            notificationType: "RequirementMatch",
            deliveryMethod: method,
            status: "Pending",
            createdAt: new Date().toISOString()
          });
        });
      });

      toast({ title: "Requirement Posted!", description: "AI shared to Facebook and notified matching landlords via WhatsApp/Email." });
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
      <div className="container max-w-xl px-4 py-12 mx-auto">
        <Card className="border-none shadow-xl">
          <CardHeader className="text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold text-primary">Post Your Requirement</CardTitle>
            <CardDescription>Can't find a room? Let RentiPedia find landlords for you.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {loadingStep ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-6">
                 <div className="relative">
                   <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                   <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
                 </div>
                 <p className="text-lg font-headline font-bold text-primary">{loadingStep}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label>Where are you looking to stay?</Label>
                  <Input required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g. Indiranagar, Bangalore" />
                </div>
                <div className="space-y-2">
                  <Label>Maximum Monthly Budget (INR)</Label>
                  <Input required type="number" value={formData.budget} onChange={(e) => setFormData({...formData, budget: e.target.value})} placeholder="12000" />
                </div>
                
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-start gap-3">
                   <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                   <p className="text-[10px] text-muted-foreground leading-relaxed">
                     RentiPedia will automatically post this requirement to relevant Facebook groups and alert matching property owners via WhatsApp/Email.
                   </p>
                </div>

                <Button type="submit" className="w-full h-14 text-lg font-headline">
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
