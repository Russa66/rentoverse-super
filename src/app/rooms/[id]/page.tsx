
"use client";

import { use } from "react";
import Navbar from "@/components/Navbar";
import { MOCK_ROOMS } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Wifi, Zap, Wind, Droplets, Train, MessageCircle, Phone, Users, ShieldCheck, Lock } from "lucide-react";
import Image from "next/image";
import SocialPostDialog from "@/components/SocialPostDialog";
import Link from "next/link";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

export default function RoomDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { firestore } = useFirestore();

  const roomRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, "published_room_listings", id);
  }, [firestore, id]);

  const { data: firestoreRoom, isLoading } = useDoc(roomRef);

  // Fallback to mock data if Firestore record not found (for demonstration)
  const room = firestoreRoom || MOCK_ROOMS.find((r) => r.id === id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/20">
        <Navbar />
        <div className="container px-4 mx-auto py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground font-headline">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/20">
        <Navbar />
        <div className="container px-4 mx-auto py-20 text-center">
          <h1 className="text-3xl font-headline font-bold mb-4">Property Not Found</h1>
          <p className="text-muted-foreground mb-8">The listing you are looking for might have been moved or deleted.</p>
          <Link href="/search">
            <Button>Back to Search</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Handle differences between mock data and firestore schema
  const photos = room.photoUrls || room.photos || ["https://picsum.photos/seed/room/800/600"];
  const amenities = room.amenities || [];
  const hasWifi = amenities.includes("WiFi") || !!room.wifiAvailable;
  const hasAc = amenities.includes("AC") || !!room.acAvailable;
  const hasBackup = amenities.includes("Inverter") || !!room.inverterAvailable;
  const rentDisplay = typeof room.monthlyRent === 'number' ? `₹${room.monthlyRent}` : room.monthlyRent;
  const whatsapp = room.landlord?.whatsapp || "";
  const landlordName = room.landlord?.name || "Verified Landlord";

  // Hide exact location, show general locality
  const publicLocation = room.locality || "Contact owner for exact address";

  return (
    <div className="min-h-screen flex flex-col bg-muted/20 pb-20">
      <Navbar />
      
      <div className="container px-4 mx-auto py-8">
        {/* Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-3 h-[300px] md:h-[500px] mb-8 rounded-2xl overflow-hidden shadow-lg">
          <div className="md:col-span-2 md:row-span-2 relative">
            <Image src={photos[0]} alt={room.title} fill className="object-cover" />
          </div>
          <div className="relative hidden md:block">
            <Image src={photos[1] || photos[0]} alt={room.title} fill className="object-cover" />
          </div>
          <div className="relative hidden md:block">
            <Image src={photos[0]} alt={room.title} fill className="object-cover brightness-75" />
            <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
              +{photos.length > 2 ? photos.length - 2 : 0} More
            </div>
          </div>
          <div className="md:col-span-2 relative hidden md:block">
            <Image src={photos[1] || photos[0]} alt={room.title} fill className="object-cover" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h1 className="text-3xl md:text-4xl font-headline font-bold tracking-tight">{room.title}</h1>
                <div className="flex items-center gap-2">
                   <Badge className="bg-primary hover:bg-primary font-bold px-3 py-1 flex items-center gap-1">
                     <Users className="h-3 w-3" /> {room.idealFor || "Verified"}
                   </Badge>
                   <Badge variant="outline" className="border-secondary text-secondary-foreground font-bold px-3 py-1">Live</Badge>
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

              <Separator className="my-6" />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                 <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <Wifi className={`h-8 w-8 ${hasWifi ? 'text-primary' : 'text-muted/30'}`} />
                    <span className="text-xs font-bold uppercase tracking-wider">WiFi</span>
                 </div>
                 <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/5 border border-secondary/10">
                    <Wind className={`h-8 w-8 ${hasAc ? 'text-secondary' : 'text-muted/30'}`} />
                    <span className="text-xs font-bold uppercase tracking-wider">AC</span>
                 </div>
                 <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-yellow-50 border border-yellow-100">
                    <Zap className={`h-8 w-8 ${hasBackup ? 'text-yellow-600' : 'text-muted/30'}`} />
                    <span className="text-xs font-bold uppercase tracking-wider">Backup</span>
                 </div>
                 <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <Droplets className="h-8 w-8 text-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-wider">Water</span>
                 </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm">
               <h2 className="text-2xl font-headline font-bold mb-4">Property Description</h2>
               <p className="text-muted-foreground leading-relaxed mb-6">
                 {room.description}
               </p>
               
               {(room.nearestCommunicationOptions?.length > 0 || room.nearestCommunication) && (
                 <>
                   <h3 className="text-xl font-headline font-bold mb-4 flex items-center gap-2">
                     <Train className="h-5 w-5 text-primary" /> Transportation
                   </h3>
                   <p className="text-muted-foreground mb-6">
                     Nearby transport: {room.nearestCommunicationOptions?.join(", ") || room.nearestCommunication}
                   </p>
                 </>
               )}
               
               <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
                 <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
                 <div>
                   <p className="font-bold text-sm">Verified Property</p>
                   <p className="text-xs text-muted-foreground">This property has been published via RentiPedia's secure platform.</p>
                 </div>
               </div>
            </div>
          </div>

          {/* Sidebar - Contact & Actions */}
          <div className="space-y-6">
            <Card className="sticky top-24 border-none shadow-xl overflow-hidden">
              <div className="bg-primary p-6 text-primary-foreground">
                <div className="text-sm font-semibold opacity-80 uppercase tracking-widest mb-1">Monthly Rent</div>
                <div className="text-4xl font-headline font-bold">{rentDisplay}</div>
              </div>
              <CardContent className="p-6 space-y-4">
                {whatsapp ? (
                  <Button className="w-full h-12 text-lg font-headline bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                    <a href={`https://wa.me/${whatsapp}`} target="_blank">
                      <MessageCircle className="mr-2 h-5 w-5" /> Chat on WhatsApp
                    </a>
                  </Button>
                ) : (
                  <Button className="w-full h-12 text-lg font-headline bg-primary text-primary-foreground hover:bg-primary/90">
                    <MessageCircle className="mr-2 h-5 w-5" /> Contact Owner
                  </Button>
                )}
                
                <Button variant="outline" className="w-full h-12 border-primary text-primary hover:bg-primary/10 font-headline">
                  <Phone className="mr-2 h-5 w-5" /> Call {landlordName}
                </Button>
                
                <Separator className="my-4" />
                
                <div className="space-y-4">
                   <p className="text-sm font-semibold text-center text-muted-foreground italic">Share this listing to attract more interest:</p>
                   <SocialPostDialog room={{
                     ...room,
                     monthlyRent: rentDisplay,
                     wifiAvailable: hasWifi,
                     acAvailable: hasAc,
                     inverterAvailable: hasBackup
                   }} />
                </div>

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
