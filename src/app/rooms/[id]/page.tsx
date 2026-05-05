import Navbar from "@/components/Navbar";
import { MOCK_ROOMS } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Wifi, Zap, Wind, Droplets, ShieldCheck, Lock, Maximize2, Users } from "lucide-react";
import Image from "next/image";
import SocialPostDialog from "@/components/SocialPostDialog";
import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import NegotiationForm from "./NegotiationForm";

export default async function RoomDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  let room = null;
  let user = null;
  let initialHasSubmitted = false;

  const { data } = await supabase.from('room_listings').select('*').eq('id', id).single();
  
  if (data) {
    room = data;
  } else {
    const fallback = MOCK_ROOMS.find((r) => r.id === id);
    if (fallback) room = fallback;
  }

  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.user) {
    user = session.user;
    if (data) {
       const { data: existingOffer } = await supabase.from('property_negotiations').select('*').eq('room_id', id).eq('applicant_id', session.user.id).single();
       if (existingOffer) initialHasSubmitted = true;
    }
  }

  if (!room) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/20">
        <Navbar />
        <div className="container px-4 mx-auto py-20 text-center">
          <h1 className="text-3xl font-headline font-bold mb-4">Property Not Found</h1>
          <p className="text-muted-foreground mb-8">The listing you are looking for might have been moved or deleted.</p>
          <Link href="/search">
            <button className="px-4 py-2 bg-primary text-white rounded-md">Back to Search</button>
          </Link>
        </div>
      </div>
    );
  }

  const photos = room.photo_urls || room.photoUrls || room.photos || ["https://picsum.photos/seed/room/800/600"];
  const amenities = room.amenities || [];
  const hasWifi = amenities.includes("WiFi") || !!room.wifiAvailable;
  const hasAc = amenities.includes("AC") || !!room.acAvailable;
  const hasInverter = amenities.includes("Inverter") || !!room.inverterAvailable;
  const rentNumber = room.monthly_rent || room.monthlyRent;
  const rentDisplay = typeof rentNumber === 'number' ? `₹${rentNumber.toLocaleString('en-IN')}` : rentNumber;
  
  const publicLocation = room.locality || room.location || "Contact owner for exact address";

  return (
    <div className="min-h-screen flex flex-col bg-muted/20 pb-20">
      <Navbar />
      
      <div className="container px-4 mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-3 h-[300px] md:h-[500px] mb-8 rounded-2xl overflow-hidden shadow-lg">
          <div className="md:col-span-2 md:row-span-2 relative">
            <Image src={photos[0]} alt={room.title || "Room"} fill className="object-cover" />
          </div>
          <div className="relative hidden md:block">
            <Image src={photos[1] || photos[0]} alt={room.title || "Room"} fill className="object-cover" />
          </div>
          <div className="relative hidden md:block">
            <Image src={photos[0]} alt={room.title || "Room"} fill className="object-cover brightness-75" />
            <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
              +{photos.length > 2 ? photos.length - 2 : 0} More
            </div>
          </div>
          <div className="md:col-span-2 relative hidden md:block">
            <Image src={photos[1] || photos[0]} alt={room.title || "Room"} fill className="object-cover" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h1 className="text-3xl md:text-4xl font-headline font-bold tracking-tight">{room.title}</h1>
                <div className="flex items-center gap-2">
                   <Badge className="bg-primary hover:bg-primary font-bold px-3 py-1 flex items-center gap-1">
                     <Users className="h-3 w-3" /> {room.ideal_for || room.idealFor || "Verified"}
                   </Badge>
                   {(room.bhk_count || room.bhkCount) && (room.bhk_count || room.bhkCount) !== 'N/A' && (
                     <Badge variant="outline" className="border-primary text-primary font-bold px-3 py-1">
                       {room.bhk_count || room.bhkCount} BHK
                     </Badge>
                   )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground mb-6">
                <MapPin className="h-5 w-5 text-destructive shrink-0" />
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-primary">{publicLocation}</span>
                  <span className="text-xs flex items-center gap-1 text-muted-foreground mt-0.5">
                    <Lock className="h-3 w-3" /> Precise address hidden for privacy
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="p-4 rounded-xl bg-muted/50 flex items-center gap-3">
                    <Maximize2 className="h-5 w-5 text-primary" />
                    <div>
                       <p className="text-[10px] uppercase font-bold text-muted-foreground">Area</p>
                       <p className="font-headline font-bold">{room.area_sq_ft || room.areaSqFt || '---'} Sq Ft</p>
                    </div>
                 </div>
                 <div className="p-4 rounded-xl bg-muted/50 flex items-center gap-3">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    <div>
                       <p className="text-[10px] uppercase font-bold text-muted-foreground">Water Source</p>
                       <p className="font-headline font-bold">{room.water_supply_condition || room.waterSupplyCondition || 'Standard'}</p>
                    </div>
                 </div>
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                 <div className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${hasWifi ? 'bg-primary/10 border border-primary/20 scale-100' : 'bg-muted/30 border border-transparent opacity-40 grayscale scale-95'}`}>
                    <Wifi className={`h-8 w-8 ${hasWifi ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${hasWifi ? 'text-foreground' : 'text-muted-foreground line-through decoration-muted-foreground/30'}`}>WiFi</span>
                 </div>
                 <div className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${hasAc ? 'bg-secondary/10 border border-secondary/20 scale-100' : 'bg-muted/30 border border-transparent opacity-40 grayscale scale-95'}`}>
                    <Wind className={`h-8 w-8 ${hasAc ? 'text-secondary' : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${hasAc ? 'text-foreground' : 'text-muted-foreground line-through decoration-muted-foreground/30'}`}>AC</span>
                 </div>
                 <div className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${hasInverter ? 'bg-yellow-50 border border-yellow-200 scale-100 shadow-sm' : 'bg-muted/30 border border-transparent opacity-40 grayscale scale-95'}`}>
                    <Zap className={`h-8 w-8 ${hasInverter ? 'text-yellow-600' : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${hasInverter ? 'text-foreground' : 'text-muted-foreground line-through decoration-muted-foreground/30'}`}>Inverter</span>
                 </div>
                 <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 border border-blue-100 shadow-sm">
                    <Droplets className="h-8 w-8 text-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">Water</span>
                 </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm">
               <h2 className="text-2xl font-headline font-bold mb-4">Property Description</h2>
               <p className="text-muted-foreground leading-relaxed mb-6">
                 {room.description}
               </p>
               
               <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
                 <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
                 <div>
                   <p className="font-bold text-sm">Verified Property</p>
                   <p className="text-xs text-muted-foreground">This property has been published via RentoVerse's secure Postgres platform.</p>
                 </div>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-24 border-none shadow-xl overflow-hidden">
              <div className="bg-primary p-6 text-primary-foreground">
                <div className="text-sm font-semibold opacity-80 uppercase tracking-widest mb-1">Monthly Rent</div>
                <div className="text-4xl font-headline font-bold">{rentDisplay}</div>
              </div>
              <CardContent className="p-6 space-y-4">
                <NegotiationForm 
                  roomId={room.id} 
                  userId={user?.id} 
                  initialHasSubmitted={initialHasSubmitted} 
                />
                
                <Separator className="my-4" />
                <SocialPostDialog room={{
                  ...room,
                  monthlyRent: rentDisplay,
                  wifiAvailable: hasWifi,
                  acAvailable: hasAc,
                  inverterAvailable: hasInverter
                }} />
                <div className="pt-4 border-t mt-4">
                   <Link href="/legal-form" className="flex items-center justify-center gap-2 text-sm text-primary font-bold hover:underline">
                     <ShieldCheck className="h-4 w-4" /> View Rental Agreement
                   </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}