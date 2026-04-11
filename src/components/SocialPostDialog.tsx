"use client";

import { useState } from "react";
import { Sparkles, Facebook, MessageCircle, Copy, Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { composeSocialPost } from "@/ai/flows/ai-social-post-composer-flow";
import { RoomListing } from "@/lib/mock-data";

interface SocialPostDialogProps {
  room: Partial<RoomListing>;
  trigger?: React.ReactNode;
}

export default function SocialPostDialog({ room, trigger }: SocialPostDialogProps) {
  const [loading, setLoading] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [platform, setPlatform] = useState<"facebook" | "whatsapp">("facebook");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async (target: "facebook" | "whatsapp") => {
    setLoading(true);
    setPlatform(target);
    try {
      const result = await composeSocialPost({
        location: room.location || "",
        nearestCommunication: room.nearestCommunication || "",
        wifiAvailable: room.wifiAvailable,
        inverterAvailable: room.inverterAvailable,
        acAvailable: room.acAvailable,
        waterSupplyCondition: room.waterSupplyCondition,
        monthlyRent: String(room.monthlyRent || ""),
        socialMediaType: target,
        type: "listing",
      });
      setPostContent(result.postContent);
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Could not generate social post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(postContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(postContent)}`;
    window.open(url, "_blank");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-headline">
            <Sparkles className="mr-2 h-4 w-4" /> AI Share Post
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-secondary" />
            AI Social Post Composer
          </DialogTitle>
          <DialogDescription>
            Generate an engaging post for Facebook or WhatsApp to quickly list your room.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="facebook" className="w-full mt-4" onValueChange={(v) => setPlatform(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="facebook" className="flex items-center gap-2">
              <Facebook className="h-4 w-4" /> Facebook
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-4 min-h-[200px] flex flex-col gap-4">
            {postContent ? (
              <Textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="h-48 resize-none text-sm"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg bg-muted/20">
                <Sparkles className="h-8 w-8 text-muted mb-2" />
                <p className="text-sm text-muted-foreground text-center px-8">
                  Click generate to create a custom post for {platform === 'facebook' ? 'Facebook groups' : 'WhatsApp status/chats'}.
                </p>
                <Button 
                  onClick={() => handleGenerate(platform)} 
                  disabled={loading}
                  className="mt-4"
                >
                  {loading ? "Generating..." : "Generate Post"}
                </Button>
              </div>
            )}
          </div>
        </Tabs>

        <DialogFooter className="flex flex-row gap-2 sm:justify-end mt-4">
          {postContent && (
            <>
              <Button variant="outline" onClick={handleCopy} className="flex-1 sm:flex-none">
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                <span className="ml-2">{copied ? "Copied" : "Copy"}</span>
              </Button>
              {platform === 'whatsapp' ? (
                <Button onClick={shareOnWhatsApp} className="flex-1 sm:flex-none bg-[#25D366] hover:bg-[#25D366]/90 text-white">
                  <Send className="mr-2 h-4 w-4" /> Send to WhatsApp
                </Button>
              ) : (
                <Button onClick={() => window.open('https://facebook.com', '_blank')} className="flex-1 sm:flex-none bg-[#1877F2] hover:bg-[#1877F2]/90 text-white">
                  <Facebook className="mr-2 h-4 w-4" /> Share on FB
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
