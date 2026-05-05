"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Lock, ShieldCheck } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function NegotiationForm({ 
  roomId, 
  userId, 
  initialHasSubmitted 
}: { 
  roomId: string, 
  userId: string | undefined, 
  initialHasSubmitted: boolean 
}) {
  const supabase = createClient();
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [offerDetails, setOfferDetails] = useState({ price: "", message: "I am interested in this property!" });
  const [hasSubmitted, setHasSubmitted] = useState(initialHasSubmitted);

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
       alert("You must be signed in to make an offer!");
       return;
    }
    
    setIsSubmittingOffer(true);
    const { error } = await supabase.from('property_negotiations').insert({
      room_id: roomId,
      applicant_id: userId,
      offered_price: Number(offerDetails.price) || 0,
      message: offerDetails.message
    });

    setIsSubmittingOffer(false);

    if (error) {
      alert("Failed to submit offer: " + error.message);
    } else {
      setHasSubmitted(true);
      setIsNegotiating(false);
    }
  };

  if (hasSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-center">
        <ShieldCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
        <p className="font-bold text-green-800">Offer Submitted!</p>
        <p className="text-xs text-green-700 mt-1">The landlord has been notified and will review your securely placed offer soon.</p>
      </div>
    );
  }

  if (isNegotiating) {
    return (
      <form onSubmit={handleOfferSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
         <div>
           <label className="text-xs font-bold uppercase text-muted-foreground">Your Bargained Rate (₹)</label>
           <input 
             type="number" 
             required 
             placeholder="e.g. 15000"
             className="w-full mt-1 p-2 border rounded-md"
             value={offerDetails.price}
             onChange={e => setOfferDetails({...offerDetails, price: e.target.value})}
           />
         </div>
         <div>
           <label className="text-xs font-bold uppercase text-muted-foreground">Message to Landlord</label>
           <textarea 
             required 
             rows={2}
             className="w-full mt-1 p-2 border rounded-md text-sm"
             value={offerDetails.message}
             onChange={e => setOfferDetails({...offerDetails, message: e.target.value})}
           />
         </div>
         <div className="flex gap-2 pt-2">
           <Button type="button" variant="outline" className="flex-1" onClick={() => setIsNegotiating(false)}>Cancel</Button>
           <Button type="submit" className="flex-1 bg-primary text-white" disabled={isSubmittingOffer}>{isSubmittingOffer ? 'Sending...' : 'Submit Offer'}</Button>
         </div>
      </form>
    );
  }

  return (
    <>
      <Button className="w-full h-12 text-lg font-headline bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setIsNegotiating(true)}>
        <MessageCircle className="mr-2 h-5 w-5" /> I am interested
      </Button>
      <Button variant="outline" className="w-full h-12 border-primary text-primary hover:bg-primary/10 font-headline pointer-events-none opacity-50">
        <Lock className="mr-2 h-4 w-4" /> Contact Protected
      </Button>
    </>
  );
}
