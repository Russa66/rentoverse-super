"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, MessageCircle, Home, Bell, CheckCircle, Save, Sparkles, MapPin, XCircle, LogOut, Loader2, Search, Mail, ShieldAlert, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { toast } = useToast();
  const supabase = createClient();
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("account");
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }
      
      const userId = session.user.id;
      setUser(session.user);

      // Fetch Profile with Recovery Fallback
      let { data: profileData, error: profileErr } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', userId)
        .single();
        
      if (profileErr || !profileData) {
        // Fallback: Check if user exists by ID (old architecture)
        const { data: fallbackData } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (fallbackData) {
          // Sync auth_id for future visits
          await supabase.from('users').update({ auth_id: userId }).eq('id', userId);
          profileData = { ...fallbackData, auth_id: userId };
          console.log("Profile recovered and synced with auth_id");
        }
      }
        
      if (profileData) {
        setProfile(profileData);
        setName(profileData.name || "");
        setPhoneNumber(profileData.phone_number || "");
        setAddress(profileData.address || "");
        setEmail(profileData.email || session.user.email || "");
        
        const internalId = profileData.id;

        // Fetch Properties
        const { data: listingsData } = await supabase
          .from('room_listings')
          .select('*')
          .eq('landlord_id', internalId);
        
        if (listingsData) setListings(listingsData);

        // Fetch Requests
        const { data: requestsData } = await supabase
          .from('saved_search_requests')
          .select('*')
          .eq('renter_id', internalId);
          
        if (requestsData) setRequests(requestsData);

        // Fetch Favorites
        const { data: favoritesData } = await supabase
          .from('user_favorites')
          .select('room_listings (*)')
          .eq('user_id', internalId);
          
        if (favoritesData) setFavorites(favoritesData.map((f: any) => f.room_listings));

        // Fetch Notifications
        const { data: notifData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', internalId)
          .order('created_at', { ascending: false });
          
        if (notifData) setNotifications(notifData);
      }
      
      setLoading(false);
    };

    fetchDashboardData();
  }, [supabase, router]);

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    
    const { error } = await supabase
      .from('users')
      .update({ 
        name,
        phone_number: phoneNumber,
        address, 
        updated_at: new Date().toISOString() 
      })
      .eq('auth_id', user.id);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile." });
    } else {
      toast({ title: "Settings Saved", description: "Your profile information has been updated." });
    }
    
    setIsSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    toast({ title: "Signed Out", description: "See you again soon!" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navbar />
        <div className="container px-4 py-20 flex flex-col justify-center items-center gap-4 text-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
          <p className="text-muted-foreground font-headline">Syncing your RentoVerse Dashboard from Supabase...</p>
        </div>
      </div>
    );
  }

  const displayName = profile?.name || user?.email || user?.phone || "Member";
  const firstName = displayName.split(' ')[0];
  const isVerified = profile?.is_verified || !!user?.phone;

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container px-4 py-12 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <Card className="lg:col-span-1 border-none shadow-md h-fit">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4 border-4 border-primary/20">
                  <AvatarImage src={`https://picsum.photos/seed/${user?.id || 'user'}/200`} />
                  <AvatarFallback><User /></AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-headline font-bold">Welcome, {firstName}!</h2>
                
                <div className={`flex items-center gap-1.5 mt-2 mb-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isVerified ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                  {isVerified ? (
                    <><CheckCircle className="h-3 w-3" /> Verified Account</>
                  ) : (
                    <><XCircle className="h-3 w-3" /> Basic Account</>
                  )}
                </div>
                
                <div className="w-full space-y-1">
                  {profile?.is_admin && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start font-headline mb-4 border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => router.push('/admin')}
                    >
                      <ShieldAlert className="mr-2 h-4 w-4" /> Admin Dashboard
                    </Button>
                  )}
                  <Button 
                    variant={activeTab === "account" ? "secondary" : "ghost"} 
                    className="w-full justify-start font-headline"
                    onClick={() => setActiveTab("account")}
                  >
                    <User className="mr-2 h-4 w-4" /> Account Settings
                  </Button>
                  <Button 
                    variant={activeTab === "listings" ? "secondary" : "ghost"} 
                    className="w-full justify-start font-headline"
                    onClick={() => setActiveTab("listings")}
                  >
                    <Home className="mr-2 h-4 w-4" /> My Properties
                  </Button>
                  <Button 
                    variant={activeTab === "requests" ? "secondary" : "ghost"} 
                    className="w-full justify-start font-headline"
                    onClick={() => setActiveTab("requests")}
                  >
                    <Search className="mr-2 h-4 w-4" /> My Requirements
                  </Button>
                  <Button 
                    variant={activeTab === "favorites" ? "secondary" : "ghost"} 
                    className="w-full justify-start font-headline"
                    onClick={() => setActiveTab("favorites")}
                  >
                    <Heart className="mr-2 h-4 w-4" /> Shortlisted
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start font-headline text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-white border-none shadow-sm mb-6 w-full justify-start h-12 p-1 gap-2">
                <TabsTrigger value="account" className="rounded-lg font-headline">Settings</TabsTrigger>
                <TabsTrigger value="listings" className="rounded-lg font-headline">Properties</TabsTrigger>
                <TabsTrigger value="requests" className="rounded-lg font-headline">Requirements</TabsTrigger>
                <TabsTrigger value="favorites" className="rounded-lg font-headline">Shortlists</TabsTrigger>
                <TabsTrigger value="activity" className="rounded-lg font-headline">Alerts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="account">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="font-headline font-bold text-2xl">Profile Settings</CardTitle>
                    <CardDescription>Update your contact information for verified transactions.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleUpdateProfile} className="space-y-8">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="fullname">Full Name</Label>
                          <Input 
                            id="fullname" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            disabled={!!profile?.name} 
                            className={!!profile?.name ? "bg-muted/50 cursor-not-allowed font-medium" : "bg-white font-medium"} 
                          />
                          {!profile?.name && <p className="text-[10px] text-primary italic">Fill name to complete your profile</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="whatsapp" className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4 text-green-500" /> WhatsApp Contact
                          </Label>
                          <Input 
                            id="whatsapp" 
                            value={phoneNumber} 
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            disabled={!!profile?.phone_number} 
                            className={!!profile?.phone_number ? "bg-muted/50 cursor-not-allowed font-medium" : "bg-white font-medium"} 
                            placeholder="e.g. 9876543210"
                          />
                          {!profile?.phone_number && <p className="text-[10px] text-green-600 italic">Add phone number to enable WhatsApp alerts</p>}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="email" className="flex items-center gap-1">
                            <Mail className="h-4 w-4 text-primary" /> Email Address (Read Only)
                          </Label>
                          <Input 
                            id="email" 
                            type="email" 
                            value={email} 
                            disabled
                            className="bg-muted/50 cursor-not-allowed font-medium"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="address">Default Address</Label>
                          <Textarea 
                            id="address" 
                            placeholder="Your primary address for rental agreements" 
                            value={address} 
                            onChange={(e) => setAddress(e.target.value)} 
                          />
                        </div>
                      </div>

                      <Button type="submit" disabled={isSaving} className="font-headline px-8 h-12">
                        <Save className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : "Save Profile"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="listings">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-headline font-bold">My Property Listings</h3>
                    <Button variant="outline" size="sm" onClick={() => router.push('/rooms/new')}>+ Post New</Button>
                  </div>

                  {!listings || listings.length === 0 ? (
                    <Card className="border-none py-12 text-center bg-white">
                      <Home className="h-10 w-10 text-muted mx-auto mb-4" />
                      <p className="text-muted-foreground">You haven't listed any properties yet.</p>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {listings.map((listing: any) => (
                        <Card key={listing.id} className="border-none shadow-sm bg-white overflow-hidden p-6 flex items-center justify-between">
                          <div>
                            <h4 className="font-bold font-headline">{listing.title}</h4>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" /> {listing.locality || listing.location}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right mr-4">
                              <p className="text-sm font-bold text-primary">₹{(listing.monthlyRent || listing.monthly_rent || 0).toLocaleString('en-IN')}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">Rent/mo</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => router.push(`/rooms/${listing.id}`)}>View</Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="requests">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-headline font-bold">My Tenant Requirements</h3>
                    <Button variant="outline" size="sm" onClick={() => router.push('/search-requests/new')}>+ Add New</Button>
                  </div>

                  {!requests || requests.length === 0 ? (
                    <Card className="border-none py-12 text-center bg-white">
                      <Search className="h-10 w-10 text-muted mx-auto mb-4" />
                      <p className="text-muted-foreground">No active search requirements found.</p>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {requests.map((req: any) => (
                        <Card key={req.id} className="border-none shadow-sm bg-white overflow-hidden p-6 flex items-center justify-between">
                          <div>
                            <h4 className="font-bold font-headline">Looking for: {req.propertyType || req.property_type}</h4>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" /> {req.locationFilter || req.location_filter}
                            </p>
                          </div>
                          <div className="text-right">
                             <p className="text-sm font-bold text-secondary-foreground bg-secondary/20 px-2 py-1 rounded">Budget: ₹{(req.maxRent || req.max_rent || 0).toLocaleString('en-IN')}</p>
                             <p className="text-[10px] text-muted-foreground mt-1 uppercase">Active Match</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="favorites">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-headline font-bold flex items-center gap-2">
                       <Heart className="h-5 w-5 text-destructive" /> Shortlisted Properties
                    </h3>
                  </div>

                  {!favorites || favorites.length === 0 ? (
                    <Card className="border-none py-12 text-center bg-white">
                      <Heart className="h-10 w-10 text-muted mx-auto mb-4" />
                      <p className="text-muted-foreground">You haven't shortlisted any properties yet.</p>
                      <Button variant="outline" className="mt-4" onClick={() => router.push('/search')}>Browse Properties</Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {favorites.map((room: any) => (
                         // Using RoomCard might loop dependencies if not imported. I will just render a mini-card since RoomCard isn't imported here yet
                        <Card key={room.id} className="border-none shadow-sm bg-white overflow-hidden p-6 flex flex-col justify-between">
                          <div className="mb-4">
                            <h4 className="font-bold font-headline">{room.title}</h4>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" /> {room.locality || room.location}
                            </p>
                          </div>
                          <div className="flex items-center justify-between border-t pt-4">
                            <div>
                               <p className="text-sm font-bold text-primary">₹{(room.monthlyRent || room.monthly_rent || 0).toLocaleString('en-IN')}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => router.push(`/rooms/${room.id}`)}>Details</Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="activity">
                 <div className="space-y-4">
                    <h3 className="text-xl font-headline font-bold flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" /> Match Notifications
                    </h3>
                    {notifications?.length === 0 ? (
                      <Card className="border-none py-12 text-center">
                        <Bell className="h-10 w-10 text-muted mx-auto mb-4" />
                        <p className="text-muted-foreground">No new match alerts.</p>
                      </Card>
                    ) : (
                      notifications?.map((notif: any) => (
                        <Card key={notif.id} className="border-none shadow-sm flex items-center p-4 gap-4 bg-white">
                           <div className={`p-2 rounded-full bg-primary/10 text-primary`}>
                              <Sparkles className="h-5 w-5" />
                           </div>
                           <div className="flex-1">
                              <p className="text-sm font-medium">{notif.message}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {notif.created_at && format(new Date(notif.created_at), 'MMM d, h:mm a')}
                              </p>
                           </div>
                        </Card>
                      ))
                    )}
                 </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
