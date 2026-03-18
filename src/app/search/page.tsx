"use client";

import Navbar from "@/components/Navbar";
import RoomCard from "@/components/RoomCard";
import { MOCK_ROOMS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, SlidersHorizontal, MapPin } from "lucide-react";
import { useState } from "react";

export default function SearchPage() {
  const [priceRange, setPriceRange] = useState([5000, 50000]);

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <Navbar />
      
      {/* Search Header */}
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
        {/* Filters Sidebar */}
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
                {['WiFi Included', 'Air Conditioning', 'Power Backup', 'Purified Water', 'Private Washroom'].map((item) => (
                  <div key={item} className="flex items-center space-x-2">
                    <Checkbox id={item} className="rounded-sm" />
                    <label htmlFor={item} className="text-sm font-medium leading-none cursor-pointer">{item}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results Grid */}
        <main className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-headline font-bold">Showing <span className="text-primary">{MOCK_ROOMS.length}</span> results in Metropolis</h1>
            <select className="bg-transparent text-sm font-medium border-none focus:ring-0 cursor-pointer">
              <option>Sort by: Recommended</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Newest First</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {MOCK_ROOMS.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
            {/* Repeat for visual fill if needed */}
            {MOCK_ROOMS.slice(0, 3).map((room) => (
              <RoomCard key={`${room.id}-dup`} room={room} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
