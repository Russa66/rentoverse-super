"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Train, Users, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function RoomCard({ room, initialFavorite = false }: { room: any, initialFavorite?: boolean }) {
  const supabase = createClient();
  const { toast } = useToast();
  
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isLiking, setIsLiking] = useState(false);

  // Use locality for public display, fallback to a neighborhood extraction if locality is missing
  const publicLocation = room.locality || (room.location ? room.location.split(',')[1]?.trim() || room.location.split(',')[0] : "Location hidden");

  // Handle currency display mapping
  const rentNumber = room.monthly_rent ?? room.monthlyRent ?? 0;
  const rentDisplay = typeof rentNumber === 'number' 
    ? `₹${rentNumber.toLocaleString('en-IN')}` 
    : rentNumber;

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to /rooms/[id]
    
    setIsLiking(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      toast({ title: "Login Required", description: "You must be signed in to favorite properties.", variant: "destructive" });
      setIsLiking(false);
      return;
    }
    const userId = session.user.id;
    if (isFavorite) {
      // Remove favorite
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('room_id', room.id)
        .eq('user_id', userId);
        
      if (!error) {
         setIsFavorite(false);
         toast({ title: "Removed from Shortlist" });
      } else {
         toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      // Add favorite
      const { error } = await supabase
        .from('user_favorites')
        .insert({ room_id: room.id, user_id: userId });
        
      if (!error) {
         setIsFavorite(true);
         toast({ title: "Property Shortlisted!", description: "Saved to your profile." });
      } else {
         toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    }
    setIsLiking(false);
  };

  return (
    <Link href={`/rooms/${room.id}`}>
      <Card className="group overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col bg-card rounded-2xl relative">
        
        {/* Favorite Button Overlay */}
        <button 
          onClick={toggleFavorite}
          disabled={isLiking}
          className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur shadow-sm p-2 rounded-full hover:scale-110 transition-transform active:scale-95 disabled:opacity-50"
        >
           <Heart className={`h-5 w-5 transition-colors ${isFavorite ? 'fill-destructive text-destructive' : 'text-gray-500 hover:text-destructive'}`} />
        </button>

        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={(room.photoUrls && room.photoUrls[0]) || (room.photo_urls && room.photo_urls[0]) || (room.photos && room.photos[0]) || "https://picsum.photos/seed/room/800/600"}
            alt={room.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 flex flex-wrap gap-2 pr-12">
            {(room.ideal_for || room.idealFor) && (
              <Badge className="bg-white text-primary border-primary flex items-center gap-1 font-bold shadow-sm">
                <Users className="h-3 w-3" /> {room.ideal_for || room.idealFor}
              </Badge>
            )}
            {(room.acAvailable || (room.amenities && room.amenities.includes('AC'))) && (
              <Badge className="bg-secondary text-secondary-foreground flex items-center gap-1 border-none font-bold shadow-sm">
                AC
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-5 flex-1 space-y-3">
          <h3 className="font-headline font-bold text-xl leading-tight group-hover:text-primary transition-colors">
            {room.title}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center text-muted-foreground text-sm gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-destructive" />
              <span className="truncate font-medium">{publicLocation}</span>
            </div>
            {(room.nearest_communication || room.nearestCommunication || room.nearestCommunicationOptions?.[0]) && (
              <div className="flex items-center text-muted-foreground text-sm gap-2">
                <Train className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{room.nearest_communication || room.nearestCommunication || room.nearestCommunicationOptions?.[0]}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-5 pt-0 flex items-center justify-between border-t border-gray-50 mt-auto bg-gray-50/30">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Monthly Rent</span>
            <span className="text-2xl font-bold text-primary font-headline">{rentDisplay}</span>
          </div>
          <Button variant="outline" className="rounded-full border-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors font-bold h-9 pointer-events-none">
            View Details
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
