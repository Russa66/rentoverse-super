"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import RoomCard from "@/components/RoomCard";
import { MOCK_ROOMS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Home, Sparkles } from "lucide-react";
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
  const [displayListings, setDisplayListings] = useState<any[]>([]);

  useEffect(() => {
    if (isLoading) return;
    // Use Firestore data if available, otherwise use mock data
    const baseListings = (listings && listings.length > 0) ? listings : MOCK_ROOMS;
    setDisplayListings(baseListings.slice(0, 10));
  }, [listings, isLoading]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <section className="relative h-[550px] flex items-center justify-center overflow-hidden">
        <Image 
          src={heroImage?.imageUrl || "https://picsum.photos/seed/city/1200/800"} 
          alt="RentoVerse Hero" 
          fill 
          className="object-cover brightness-[0.35]"
          priority
          data-ai-hint="modern city"
        />
        <div className="container relative z-10 px-4 text-center text-white">
          <Badge className="mb-4 bg-secondary text-secondary-foreground hover:bg-secondary font-headline py-1 px-4 text-xs uppercase tracking-widest">
            <Sparkles className="h-3 w-3 mr-2" /> AI-Powered Marketplace
          </Badge>
          <h1 className="text-5xl md:text-7xl font-headline font-bold mb-6 tracking-tight">
            Find Your <span className="text-primary">Perfect</span> Stay.
          </h1>
          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto font-body opacity-90 leading-relaxed">
            RentoVerse connects landlords and tenants with trust, legal transparency, and AI-driven social sharing.
          </p>
          
          <div className="bg-white p-2 rounded-2xl shadow-2xl max-w-3xl mx-auto flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center px-6 gap-3">
              <MapPin className="h-5 w-5 text-destructive shrink-0" />
              <input 
                className="border-none focus-visible:ring-0 text-gray-900 placeholder:text-gray-400 h-14 text-sm w-full bg-transparent outline-none" 
                placeholder="Which locality are you looking in?" 
              />
            </div>
            <Link href="/search">
              <Button size="lg" className="h-14 px-10 rounded-xl font-headline text-lg">
                <Search className="mr-2 h-5 w-5" /> Find Rooms
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 container px-4 mx-auto flex-1">
        <div className="flex items-end justify-between mb-12 border-b pb-6">
          <div>
            <h2 className="text-3xl font-headline font-bold mb-2">Featured Properties</h2>
            <p className="text-muted-foreground">Handpicked rooms and apartments verified by RentoVerse.</p>
          </div>
          <Link href="/search">
            <Button variant="link" className="text-primary font-bold text-lg p-0">
              Browse All Listings &rarr;
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-72 bg-muted animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {displayListings.map((room: any) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </section>

      <footer className="py-16 bg-white border-t mt-auto">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center text-center md:text-left">
            <div>
              <div className="flex justify-center md:justify-start items-center gap-2 mb-4">
                <Home className="h-6 w-6 text-primary" />
                <span className="text-2xl font-headline font-bold text-primary tracking-tighter">RentoVerse</span>
              </div>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto md:mx-0">
                The most reliable property companion for students, families, and professionals.
              </p>
            </div>
            <div className="flex justify-center gap-8 font-medium text-sm">
              <Link href="/search" className="hover:text-primary">Browse</Link>
              <Link href="/legal-form" className="hover:text-primary">Legal</Link>
              <Link href="/search-requests/new" className="hover:text-primary">Requirements</Link>
            </div>
            <div className="text-center md:text-right">
              <p className="text-muted-foreground text-xs">© 2026 RentoVerse Inc. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </span>
  );
}