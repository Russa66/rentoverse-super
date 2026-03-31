"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import RoomCard from "@/components/RoomCard";
import { MOCK_ROOMS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Home } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, limit } from "firebase/firestore";

export default function HomePage() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero');
  const firestore = useFirestore();

  // Query for featured listings from Firestore
  const featuredQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "room_listings"),
      limit(20)
    );
  }, [firestore]);

  const { data: listings, isLoading } = useCollection(featuredQuery);
  const [randomizedListings, setRandomizedListings] = useState<any[]>([]);

  // Handle fallback to mock data if Firestore is empty or loading
  useEffect(() => {
    if (isLoading) return;

    // Use Firestore data if available, otherwise use mock data
    const baseListings = (listings && listings.length > 0) ? listings : MOCK_ROOMS;
    
    // Simple sort to keep order consistent during session
    const sorted = [...baseListings].sort((a, b) => String(a.id).localeCompare(String(b.id)));
    setRandomizedListings(sorted.slice(0, 10));
  }, [listings, isLoading]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <Image 
          src={heroImage?.imageUrl || "https://picsum.photos/seed/city/1200/800"} 
          alt="Hero" 
          fill 
          className="object-cover brightness-[0.4]"
          priority
          data-ai-hint="city apartment"
        />
        <div className="container relative z-10 px-4 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-headline font-bold mb-6 tracking-tight">
            Find your <span className="text-secondary italic">perfect</span> room.
          </h1>
          <p className="text-base md:text-lg mb-10 max-w-2xl mx-auto font-body opacity-90 leading-relaxed">
            RentoVerse makes finding and listing your next property effortless with intuitive search and reliable tools.
          </p>
          
          <div className="bg-white p-2 rounded-full shadow-2xl max-w-2xl mx-auto flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center px-6 gap-3">
              <MapPin className="h-5 w-5 text-destructive shrink-0" />
              <input 
                className="border-none focus-visible:ring-0 text-gray-900 placeholder:text-gray-400 h-12 text-sm w-full bg-transparent outline-none" 
                placeholder="Where do you want to live?" 
              />
            </div>
            <Link href="/search">
              <Button size="lg" className="h-12 px-8 rounded-full font-headline">
                <Search className="mr-2 h-4 w-4" /> Search
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 container px-4 mx-auto flex-1">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-headline font-bold mb-2">Explore Properties</h2>
            <p className="text-muted-foreground">Fresh picks for you in RentoVerse today.</p>
          </div>
          <Link href="/search" className="text-primary font-bold hover:underline">
            View all &rarr;
          </Link>
        </div>

        {isLoading && randomizedListings.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {randomizedListings.map((room: any) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </section>

      <footer className="py-12 bg-white border-t mt-auto">
        <div className="container px-4 mx-auto text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Home className="h-6 w-6 text-primary" />
            <span className="text-xl font-headline font-bold text-primary">RentoVerse</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2026 RentoVerse. Trustworthy property companion.</p>
        </div>
      </footer>
    </div>
  );
}