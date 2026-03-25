
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
  const logo = PlaceHolderImages.find(img => img.id === 'logo');
  const { firestore } = useFirestore();

  const featuredQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "room_listings"),
      limit(20)
    );
  }, [firestore]);

  const { data: listings, isLoading } = useCollection(featuredQuery);
  const [randomizedListings, setRandomizedListings] = useState<any[]>([]);

  useEffect(() => {
    const baseListings = (listings && listings.length > 0) ? listings : MOCK_ROOMS;
    const shuffled = [...baseListings].sort(() => 0.5 - Math.random());
    setRandomizedListings(shuffled.slice(0, 10));
  }, [listings]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <section className="relative h-[650px] md:h-[600px] flex items-center justify-center overflow-hidden">
        <Image 
          src={heroImage?.imageUrl || "https://picsum.photos/seed/city/1200/800"} 
          alt="Hero" 
          fill 
          className="object-cover brightness-[0.4]"
          priority
        />
        <div className="container relative z-10 px-4 text-center text-white">
          <h1 className="text-4xl md:text-7xl font-headline font-bold mb-6 tracking-tight">
            Find your <span className="text-secondary italic">perfect</span> room and property.
          </h1>
          <p className="text-base md:text-xl mb-10 max-w-3xl mx-auto font-body opacity-90 leading-relaxed">
            RentoVerse makes finding, listing, and sharing your next property effortless with intuitive search and AI-powered tools.
          </p>
          
          <div className="bg-white p-3 md:p-2 rounded-2xl md:rounded-full shadow-2xl max-w-3xl mx-auto flex flex-col md:flex-row gap-3 md:gap-2">
            <div className="flex-1 flex items-start md:items-center px-4 md:px-6 gap-3">
              <MapPin className="h-5 w-5 text-destructive shrink-0 mt-3 md:mt-0" />
              <div className="flex-1 w-full text-left">
                <textarea 
                  className="block md:hidden w-full border-none focus:ring-0 text-gray-900 placeholder:text-gray-400 bg-transparent text-lg resize-none min-h-[80px] py-2 outline-none" 
                  placeholder="Where do you want to live?" 
                />
                <input 
                  className="hidden md:block border-none focus-visible:ring-0 text-gray-900 placeholder:text-gray-400 h-12 text-lg w-full bg-transparent outline-none" 
                  placeholder="Where do you want to live?" 
                />
              </div>
            </div>
            <Link href="/search" className="w-full md:w-auto">
              <Button size="lg" className="h-14 md:h-12 px-10 rounded-xl md:rounded-full w-full font-headline text-lg">
                <Search className="mr-2 h-5 w-5" /> Search
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 container px-4 mx-auto flex-1">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-headline font-bold mb-2">Explore Featured Properties</h2>
            <p className="text-muted-foreground">Fresh picks for you in RentoVerse today.</p>
          </div>
          <Link href="/search" className="text-primary font-bold hover:underline">
            View all &rarr;
          </Link>
        </div>

        {isLoading && randomizedListings.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {randomizedListings.map((room: any) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </section>

      <section className="py-24 bg-primary/5 border-y border-primary/10">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-headline font-bold mb-6">Are you a Landlord?</h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Create high-converting listings in minutes. Use our AI to draft perfectly optimized posts for your social groups.
          </p>
          <Link href="/rooms/new">
            <Button size="lg" className="font-headline px-12 rounded-xl h-16 text-xl">
              List Property
            </Button>
          </Link>
        </div>
      </section>

      <footer className="py-16 bg-white border-t">
        <div className="container px-4 mx-auto flex flex-col items-center">
          <div className="relative w-48 h-16 mb-6 flex justify-center items-center">
            <Home className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">© 2026 RentoVerse. Your trustworthy property companion.</p>
        </div>
      </footer>
    </div>
  );
}
