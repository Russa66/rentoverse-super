"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import RoomCard from "@/components/RoomCard";
import { MOCK_ROOMS } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Search as SearchIcon, MapPin, SlidersHorizontal, Loader2, Database } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function SearchPage() {
  const supabase = createClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [filterType, setFilterType] = useState("All");
  
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      let query = supabase.from('room_listings').select('*').eq('is_active', true);
      
      if (filterType !== "All") {
        query = query.eq('property_type', filterType);
      }
      
      const { data } = await query;

      if (data && data.length > 0) {
        setListings(data);
        setIsLive(true);
      } else {
        setListings(MOCK_ROOMS);
      }
      setIsLoading(false);
    };

    fetchListings();
  }, [supabase, filterType]);

  const filteredRooms = listings.filter((room) => {
    const searchLower = searchTerm.toLowerCase();
    const loc = room.locality?.toLowerCase() || room.location?.toLowerCase() || '';
    const title = room.title?.toLowerCase() || '';
    const desc = room.description?.toLowerCase() || '';
    
    return loc.includes(searchLower) || title.includes(searchLower) || desc.includes(searchLower);
  });

  const sortedRooms = [...filteredRooms].sort((a, b) => {
    const rentA = a.monthly_rent || a.monthlyRent || 0;
    const rentB = b.monthly_rent || b.monthlyRent || 0;
    
    if (sortBy === "price_asc") return rentA - rentB;
    if (sortBy === "price_desc") return rentB - rentA;
    return 0;
  });

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />
      
      <div className="bg-white border-b shadow-sm sticky top-16 z-40">
        <div className="container px-4 py-4 mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            
            <div className="relative flex-1 w-full">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-destructive" />
              <Input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 h-14 rounded-xl text-lg font-medium shadow-inner bg-muted/30 focus-visible:ring-primary border-muted" 
                placeholder="Search by locality, area, or keywords..." 
              />
            </div>
            
            <div className="flex w-full md:w-auto gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-14 px-4 rounded-xl gap-2 font-bold w-1/2 md:w-auto shadow-sm">
                     <Filter className="h-4 w-4" /> Filters
                     {filterType !== "All" && (
                        <span className="ml-1 bg-primary text-primary-foreground text-[10px] w-5 h-5 rounded-full flex items-center justify-center">1</span>
                     )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <h4 className="font-headline font-bold mb-4 flex items-center gap-2">
                     <SlidersHorizontal className="h-4 w-4 text-primary" /> Filter Options
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Property Type</label>
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Properties</SelectItem>
                          <SelectItem value="Room">Single Room</SelectItem>
                          <SelectItem value="PG">PG / Hostel</SelectItem>
                          <SelectItem value="Apartment">Apartment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-14 w-1/2 md:w-[200px] rounded-xl font-bold shadow-sm">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Recommended</SelectItem>
                  <SelectItem value="price_asc">Lowest Price First</SelectItem>
                  <SelectItem value="price_desc">Highest Price First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground font-medium">
               Found {sortedRooms.length} results
            </p>
            {isLive ? (
              <Badge variant="outline" className="border-primary text-primary font-bold gap-1 bg-primary/5">
                <Database className="h-3 w-3" /> Supabase Database
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">Preview Mode</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container px-4 py-8 mx-auto flex-1">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-muted/60 animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : sortedRooms.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed text-muted-foreground">
            <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-2xl font-headline font-bold mb-2 text-gray-900">No properties found</h3>
            <p className="max-w-md mx-auto">Try adjusting your search criteria or changing the active filters to see more results.</p>
            <Button variant="outline" className="mt-6" onClick={() => {
              setSearchTerm("");
              setFilterType("All");
            }}>Clear All Filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedRooms.map((room) => (
              <RoomCard 
                key={room.id} 
                room={{
                  ...room,
                  monthlyRent: room.monthly_rent || room.monthlyRent,
                  areaSqFt: room.area_sq_ft || room.areaSqFt,
                  bhkCount: room.bhk_count || room.bhkCount,
                  propertyType: room.property_type || room.propertyType,
                  photoUrls: room.photo_urls || room.photoUrls,
                }} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
