import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { MOCK_ROOMS } from "@/lib/mock-data";
import SearchClient from "./SearchClient";

export default async function SearchPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  let listings = [];
  let userFavorites: string[] = [];
  let isLive = false;

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    const { data: favs } = await supabase.from('user_favorites').select('room_id').eq('user_id', session.user.id);
    if (favs) userFavorites = favs.map(f => f.room_id);
  }

  const { data } = await supabase.from('room_listings').select('*').eq('is_active', true);

  if (data && data.length > 0) {
    listings = data;
    isLive = true;
  } else {
    listings = MOCK_ROOMS;
  }

  return (
    <SearchClient 
      initialListings={listings} 
      initialFavorites={userFavorites} 
      isLive={isLive} 
    />
  );
}
