"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Check, X, ShieldAlert, Loader2 } from "lucide-react";

interface AdminActionsProps {
  roomId: string;
  currentStatus: string;
}

export default function AdminActions({ roomId, currentStatus }: AdminActionsProps) {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  
  const [status, setStatus] = useState(currentStatus);
  const [updating, setUpdating] = useState(false);

  const handleUpdateStatus = async (newStatus: "Approved" | "Rejected") => {
    setUpdating(true);
    
    const { error } = await supabase
      .from("room_listings")
      .update({ approval_status: newStatus })
      .eq("id", roomId);

    if (error) {
      toast({
        title: "Moderation Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setStatus(newStatus);
      toast({
        title: `Property ${newStatus}`,
        description: `This listing has been successfully marked as ${newStatus.toLowerCase()}.`,
      });
      // Refresh the page data from Supabase server side
      router.refresh();
    }
    setUpdating(false);
  };

  return (
    <div className="w-full bg-slate-900 text-slate-100 py-4 px-6 shadow-xl border-b border-slate-800 animate-in slide-in-from-top duration-300">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Admin Badge & Title */}
        <div className="flex items-center gap-3">
          <div className="bg-primary p-1.5 rounded-lg text-primary-foreground">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Moderator Controls</span>
              <Badge className={`text-[10px] font-bold px-2 py-0.5 ${
                status === "Approved"
                  ? "bg-green-500/20 text-green-400 hover:bg-green-500/20"
                  : status === "Rejected"
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/20"
                  : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/20"
              }`}>
                {status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              As an administrator, you can approve or reject this listing directly from here.
            </p>
          </div>
        </div>

        {/* Approve/Reject Controls */}
        <div className="flex items-center gap-2.5">
          {updating ? (
            <div className="flex items-center gap-2 text-sm text-slate-400 font-headline">
              <Loader2 className="h-4 w-4 animate-spin text-primary" /> Updating Status...
            </div>
          ) : (
            <>
              {status !== "Approved" && (
                <Button
                  onClick={() => handleUpdateStatus("Approved")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-headline font-bold text-xs h-9 px-4 gap-1.5 shadow-md"
                >
                  <Check className="h-4 w-4" /> Approve Listing
                </Button>
              )}
              {status !== "Rejected" && (
                <Button
                  variant="destructive"
                  onClick={() => handleUpdateStatus("Rejected")}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-headline font-bold text-xs h-9 px-4 gap-1.5 shadow-md"
                >
                  <X className="h-4 w-4" /> Reject Listing
                </Button>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
