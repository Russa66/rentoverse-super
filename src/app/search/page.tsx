
"use client";

import Navbar from "@/components/Navbar";
import RoomCard from "@/components/RoomCard";
import { MOCK_ROOMS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, SlidersHorizontal, MapPin, Info } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SearchPage() {
  const [priceRange, setPriceRange] = useState([5000, 50000]);
  const firestore = useFirestore();

  const listingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "room_listings");
  }, [firestore]);

  const { data: listings, isLoading, error } = useCollection(listingsQuery);

  const hasRealData = listings && listings.length > 0;
  const displayListings = hasRealData ? listings : MOCK_ROOMS;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <Navbar />
      
      <div className="bg-white border-b py-6 sticky top-16 z-40">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center px-4 border rounded-xl bg-white shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <MapPin className="h-5 w-5 text-destructive shrink-0" />
              <Input 
                className="border-none focus-visible:ring-0 text-sm h-12" 
                placeholder="Enter city, neighborhood or station..." 
              />
            </div>
            <Button size="lg" className="md:w-32 h-12 rounded-xl font-headline">
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container px-4 mx-auto py-8 flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-72 shrink-0 space-y-8">
          <div className="flex items-center justify-between border-b pb-4">
             <h2 className="font-headline font-bold text-xl flex items-center gap-2">
               <SlidersHorizontal className="h-5 w-5" /> Filters
             </h2>
             <Button variant="ghost" size="sm" className="text-primary h-8 p-0">Clear all</Button>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="font-bold mb-4 block">Price Range (Monthly)</Label>
              <Slider 
                defaultValue={[5000, 50000]} 
                max={100000} 
                step={1000} 
                onValueChange={setPriceRange}
                className="my-6"
              />
              <div className="flex items-center justify-between text-sm font-medium">
                <span className="border px-3 py-1 rounded-md bg-white">₹{priceRange[0]}</span>
                <span className="border px-3 py-1 rounded-md bg-white">₹{priceRange[1]}</span>
              </div>
            </div>

            <div>
              <Label className="font-bold mb-4 block">Ideal For</Label>
              <div className="space-y-3">
                {['Single Tenant', 'Family', 'Commercial'].map((item) => (
                  <div key={item} className="flex items-center space-x-2">
                    <Checkbox id={`ideal-${item}`} className="rounded-sm" />
                    <label htmlFor={`ideal-${item}`} className="text-sm font-medium leading-none cursor-pointer">{item}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="font-bold mb-4 block">Essential Amenities</Label>
              <div className="space-y-3">
                {['WiFi Included', 'Air Conditioning', 'Inverter', 'Purified Water', 'Private Washroom'].map((item) => (
                  <div key={item} className="flex items-center space-x-2">
                    <Checkbox id={item} className="rounded-sm" />
                    <label htmlFor={item} className="text-sm font-medium leading-none cursor-pointer">{item}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <Info className="h-4 w-4" />
              <AlertTitle>Connection Note</AlertTitle>
              <AlertDescription>
                We're showing preview results while the live database synchronizes.
              </AlertDescription>
            </Alert>
          )}

          {!hasRealData && !isLoading && !error && (
            <div className="bg-white rounded-xl p-8 mb-6 text-center border-dashed border-2">
               <h3 className="font-headline font-bold text-lg mb-2">Be the first to list here!</h3>
               <p className="text-sm text-muted-foreground mb-4">No live properties in this area yet. Showing examples.</p>
               <Link href="/rooms/new">
                 <Button variant="outline" size="sm">List Property</Button>
               </Link>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-headline font-bold">
              {hasRealData ? (
                <>Showing <span className="text-primary">{listings.length}</span> live results</>
              ) : (
                <>Explore <span className="text-primary">Featured</span> Properties</>
              )}
            </h1>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {displayListings.map((room: any) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
