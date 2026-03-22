
"use client";

import Navbar from "@/components/Navbar";
import RoomCard from "@/components/RoomCard";
import { MOCK_ROOMS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, limit, orderBy } from "firebase/firestore";

export default function HomePage() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero');
  const logo = PlaceHolderImages.find(img => img.id === 'logo');
  const { firestore } = useFirestore();

  const featuredQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "published_room_listings"),
      orderBy("createdAt", "desc"),
      limit(6)
    );
  }, [firestore]);

  const { data: listings, isLoading } = useCollection(featuredQuery);

  const displayListings = listings && listings.length > 0 ? listings : MOCK_ROOMS;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <Image 
          src={heroImage?.imageUrl || "https://picsum.photos/seed/paris/1200/800"} 
          alt={heroImage?.description || "City view"} 
          fill 
          className="object-cover brightness-[0.4]"
          priority
          data-ai-hint="city view"
        />
        <div className="container relative z-10 px-4 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-headline font-bold mb-6 tracking-tight">
            Find your <span className="text-secondary italic">perfect</span> room and property.
          </h1>
          <p className="text-lg md:text-xl mb-10 max-w-3xl mx-auto font-body opacity-90 leading-relaxed">
            RentoVerse makes finding, listing, and sharing your next property effortless with intuitive search and AI-powered tools.
          </p>
          
          <div className="bg-white p-2 rounded-full shadow-2xl max-w-3xl mx-auto flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center px-6 gap-3">
              <MapPin className="h-5 w-5 text-destructive shrink-0" />
              <Input 
                className="border-none focus-visible:ring-0 text-gray-900 placeholder:text-gray-400 h-12 text-lg" 
                placeholder="Search in Poabagan, Heavir More..." 
              />
            </div>
            <Link href="/search">
              <Button size="lg" className="h-12 px-10 rounded-full w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-headline text-lg">
                <Search className="mr-2 h-5 w-5" /> Search
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container px-4 mx-auto">
          <h2 className="text-center text-2xl font-headline font-bold mb-8">Browse by Property Type</h2>
          <div className="flex flex-wrap justify-center gap-4">
             {['Single Room', '1 BHK', '2 BHK', 'Studio', 'Shared Room', 'Commercial'].map((tag) => (
               <Button key={tag} variant="outline" className="rounded-full border-gray-200 hover:border-primary hover:text-primary text-sm px-6 h-10">
                 {tag}
               </Button>
             ))}
          </div>
        </div>
      </section>

      <section className="py-16 container px-4 mx-auto flex-1">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-headline font-bold mb-2">Popular Nearby Rooms</h2>
            <p className="text-muted-foreground">Handpicked properties with the best amenities in your city.</p>
          </div>
          <Link href="/search" className="text-primary font-bold hover:underline flex items-center gap-1">
            View all properties <span className="text-xl">&rarr;</span>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayListings.map((room: any) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </section>

      <section className="py-24 bg-primary/5 border-y border-primary/10">
        <div className="container px-4 mx-auto text-center">
          <div className="bg-primary/10 inline-flex items-center gap-2 px-4 py-2 rounded-full text-primary font-bold text-sm mb-6">
            <Sparkles className="h-4 w-4" /> AI Powered Listing
          </div>
          <h2 className="text-4xl md:text-5xl font-headline font-bold mb-6">Are you a Landlord?</h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Create high-converting listings in minutes. Use our AI to draft perfectly optimized posts for your social groups.
          </p>
          <Link href="/rooms/new">
            <Button size="lg" className="font-headline px-12 rounded-xl h-16 text-xl bg-primary hover:bg-primary/90">
              Start Listing Today
            </Button>
          </Link>
        </div>
      </section>

      <footer className="py-16 bg-white border-t">
        <div className="container px-4 mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="relative w-24 h-24">
              <Image 
                src={logo?.imageUrl || ""} 
                alt="RentoVerse Logo" 
                fill 
                className="object-contain"
              />
            </div>
            <span className="font-headline font-bold text-2xl tracking-tighter text-primary">RentoVerse</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2024 RentoVerse. Your trustworthy property companion.</p>
        </div>
      </footer>
    </div>
  );
}
