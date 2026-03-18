
import Navbar from "@/components/Navbar";
import RoomCard from "@/components/RoomCard";
import { MOCK_ROOMS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center overflow-hidden">
        <Image 
          src="https://picsum.photos/seed/hero/1200/800" 
          alt="Home interior" 
          fill 
          className="object-cover brightness-50"
          priority
        />
        <div className="container relative z-10 px-4 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-headline font-bold mb-6 tracking-tight">
            Find your next <span className="text-secondary italic">perfect</span> room.
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto font-body opacity-90">
            Rentipedia makes finding and listing rooms effortless with intuitive search and AI-powered sharing tools.
          </p>
          
          <div className="bg-white p-2 rounded-2xl shadow-2xl max-w-3xl mx-auto flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center px-4 gap-2 border-b md:border-b-0 md:border-r border-gray-100">
              <MapPin className="h-5 w-5 text-destructive shrink-0" />
              <Input 
                className="border-none focus-visible:ring-0 text-gray-900 placeholder:text-gray-400 h-12" 
                placeholder="Where do you want to stay?" 
              />
            </div>
            <Link href="/search">
              <Button size="lg" className="h-12 px-8 w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-headline">
                <Search className="mr-2 h-5 w-5" /> Search
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories / Quick Links */}
      <section className="py-12 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="flex flex-wrap justify-center gap-4">
             {['Near Metro', 'WiFi Included', 'Under $500', 'With AC', 'Landlord Direct'].map((tag) => (
               <Button key={tag} variant="outline" className="rounded-full bg-white border-primary/20 hover:border-primary text-sm">
                 {tag}
               </Button>
             ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-16 container px-4 mx-auto flex-1">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-headline font-bold mb-2">Popular Nearby Rooms</h2>
            <p className="text-muted-foreground">Handpicked rooms with the best amenities in your city.</p>
          </div>
          <Link href="/search" className="text-primary font-bold hover:underline hidden sm:block">
            View all rooms &rarr;
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
          {MOCK_ROOMS.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5 border-y border-primary/10">
        <div className="container px-4 mx-auto text-center">
          <div className="bg-primary/10 inline-flex items-center gap-2 px-4 py-2 rounded-full text-primary font-bold text-sm mb-6">
            <Sparkles className="h-4 w-4" /> AI Powered Listing
          </div>
          <h2 className="text-3xl md:text-4xl font-headline font-bold mb-6">Are you a Landlord?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Create high-converting listings in minutes. Use our AI to draft perfectly optimized posts for your social groups.
          </p>
          <Link href="/rooms/new">
            <Button size="lg" className="font-headline px-10 rounded-xl h-14 text-lg">
              Start Listing Today
            </Button>
          </Link>
        </div>
      </section>

      <footer className="py-12 bg-white border-t">
        <div className="container px-4 mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="bg-primary p-1 rounded">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="font-headline font-bold text-xl">Rentipedia</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2024 Rentipedia. Your trustworthy room rental companion.</p>
        </div>
      </footer>
    </div>
  );
}
