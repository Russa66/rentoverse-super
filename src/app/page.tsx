import Navbar from "@/components/Navbar";
import RoomCard from "@/components/RoomCard";
import { MOCK_ROOMS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Home, Sparkles, ShieldAlert, PlusCircle, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { createClient } from "@/utils/supabase/server";
import { Badge } from "@/components/ui/badge";
import { cookies } from "next/headers";

export default async function HomePage() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero');
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  let profile = { is_admin: false };
  let listings = [];
  let isLive = false;
  let userFavorites: string[] = [];

  // 1. Fetch Profile for Admin check & Bulk fetch favorites
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    const { data: adminCheck } = await supabase.from('admin_list').select('user_id').eq('user_id', session.user.id).maybeSingle();
    profile.is_admin = !!adminCheck;
    
    const { data: favs } = await supabase.from('user_favorites').select('room_id').eq('user_id', session.user.id);
    if (favs) userFavorites = favs.map(f => f.room_id);
  }

  // 2. Fetch featured properties
  const { data: roomsData } = await supabase
    .from('room_listings')
    .select('*')
    .limit(20);

  if (roomsData && roomsData.length > 0) {
    listings = roomsData;
    isLive = true;
  } else {
    listings = MOCK_ROOMS.slice(0, 10);
    isLive = false;
  }

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
        />
        <div className="container relative z-10 px-4 text-center text-white">
          <Badge className="mb-4 bg-secondary text-secondary-foreground hover:bg-secondary font-headline py-1 px-4 text-xs uppercase tracking-widest">
            <Sparkles className="h-3 w-3 mr-2" /> Verified Marketplace
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
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-3xl font-headline font-bold">Featured Properties</h2>
              <Badge variant="outline" className="border-primary text-primary font-bold gap-1 bg-primary/5">
                <Star className="h-3 w-3" /> Handpicked
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {isLive 
                ? "Verified listings updated daily — find a place you'll love to call home."
                : "Explore our curated collection of verified stays across top localities."}
            </p>
          </div>
          <Link href="/search">
            <Button variant="link" className="text-primary font-bold text-lg p-0">
              Browse All Listings &rarr;
            </Button>
          </Link>
        </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {listings.map((room: any) => (
              <RoomCard 
                key={room.id} 
                room={room} 
                initialFavorite={userFavorites.includes(room.id)}
              />
            ))}
          </div>

        {!isLive && (
          <div className="mt-20 p-12 border-2 border-dashed rounded-3xl bg-muted/20 text-center space-y-6">
             <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="h-10 w-10 text-primary" />
             </div>
             <div className="space-y-2">
               <h3 className="text-3xl font-headline font-bold text-gray-900">Be the First to List Here!</h3>
               <p className="text-muted-foreground max-w-lg mx-auto text-lg">
                 Thousands of people are searching for their perfect room right now. Connect with genuine tenants, earn steady rental income, and list your property for free — in minutes.
               </p>
             </div>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link href="/rooms/new">
                  <Button size="lg" className="h-14 px-8 font-headline text-lg w-full sm:w-auto shadow-xl hover:shadow-primary/20">
                    <PlusCircle className="mr-2 h-5 w-5" /> List Your Property Free
                  </Button>
                </Link>
                <Link href="/search-requests/new">
                  <Button variant="outline" size="lg" className="h-14 px-8 font-headline text-lg w-full sm:w-auto border-primary text-primary hover:bg-primary/5">
                    <Search className="mr-2 h-5 w-5" /> Post Your Requirement
                  </Button>
                </Link>
             </div>
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
              {profile?.is_admin && (
                <Link href="/admin" className="hover:text-primary flex items-center gap-1 font-bold text-destructive">
                  <ShieldAlert className="h-3 w-3" /> Admin
                </Link>
              )}
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
