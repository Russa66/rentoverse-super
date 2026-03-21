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
import { Search, Sparkles } from "lucide-react";

export default function PostRequirement() {
  const [loading, setLoading] = useState(false);
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
      toast({ title: "Auth Required", description: "Sign in to post requirement.", variant: "destructive" });
      return;
    }

    setLoading(true);

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
      // Duplicate to root for easier querying in matching logic
      setDocumentNonBlocking(doc(firestore, `saved_search_requests/${requestId}`), requestData, { merge: true });

      // 2. AI Social Post for requirement
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
      const q = query(collection(firestore, "published_room_listings"), where("location", "==", formData.location));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((listingDoc) => {
        const listing = listingDoc.data();
        addDocumentNonBlocking(collection(firestore, `users/${listing.landlordId}/notifications`), {
          recipientId: listing.landlordId,
          message: `A tenant is looking for a room in ${formData.location} with budget ₹${formData.budget}. Your listing matches!`,
          notificationType: "RequirementMatch",
          deliveryMethod: "InApp",
          status: "Pending",
          createdAt: new Date().toISOString()
        });
      });

      toast({ title: "Requirement Posted!", description: "We've notified matching landlords and shared to Facebook." });
      router.push("/profile");
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoading(false);
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
            <CardTitle className="text-3xl font-headline font-bold">Post Your Requirement</CardTitle>
            <CardDescription>Can't find what you're looking for? Let landlords find you.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Where are you looking?</Label>
                <Input required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g. Indiranagar, Bangalore" />
              </div>
              <div className="space-y-2">
                <Label>Maximum Monthly Budget (INR)</Label>
                <Input required type="number" value={formData.budget} onChange={(e) => setFormData({...formData, budget: e.target.value})} placeholder="12000" />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-14 text-lg">
                <Sparkles className="mr-2 h-5 w-5" /> {loading ? "Matching..." : "Find Matching Rooms"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
