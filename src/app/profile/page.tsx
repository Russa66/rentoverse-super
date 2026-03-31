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
import { User, MessageCircle, Home, Bell, CheckCircle, Save, Sparkles, MapPin, XCircle, LogOut, Loader2, Search, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useCollection, useMemoFirebase, useAuth, useDoc } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { format } from "date-fns";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("account");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  useEffect(() => {
    if (profile) {
      setAddress(profile.address || "");
      // Email is read-only, pulled from Firestore profile or Auth state
      setEmail(profile.email || user?.email || "");
    } else if (user?.email) {
      setEmail(user.email);
    }
  }, [profile, user]);

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/notifications`),
      orderBy("createdAt", "desc")
    );
  }, [firestore, user]);

  const { data: notifications, isLoading: notificationsLoading } = useCollection(notificationsQuery);

  const listingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/listings`);
  }, [firestore, user]);

  const { data: listings, isLoading: listingsLoading } = useCollection(listingsQuery);

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/saved_search_requests`);
  }, [firestore, user]);

  const { data: requests, isLoading: requestsLoading } = useCollection(requestsQuery);

  const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !user) return;

    setIsSaving(true);
    
    updateDocumentNonBlocking(doc(firestore, "users", user.uid), {
      address,
      updatedAt: new Date().toISOString()
    });

    setTimeout(() => {
      toast({ title: "Settings Saved", description: "Your profile information has been updated." });
      setIsSaving(false);
    }, 500);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
    toast({ title: "Signed Out", description: "See you again soon!" });
  };

  const displayName = profile?.name || user?.displayName || "Member";
  const firstName = displayName.split(' ')[0];
  const isVerified = profile?.isVerified || !!user?.phoneNumber;

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navbar />
        <div className="container px-4 py-20 flex flex-col justify-center items-center gap-4 text-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
          <p className="text-muted-foreground font-headline">Syncing your RentoVerse Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container px-4 py-12 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <Card className="lg:col-span-1 border-none shadow-md h-fit">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4 border-4 border-primary/20">
                  <AvatarImage src={`https://picsum.photos/seed/${user?.uid || 'user'}/200`} />
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
                          <Input id="fullname" value={displayName} disabled className="bg-muted/50 cursor-not-allowed font-medium" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="whatsapp" className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4 text-green-500" /> WhatsApp Contact
                          </Label>
                          <Input id="whatsapp" value={profile?.phoneNumber || user?.phoneNumber || "N/A"} disabled className="bg-muted/50 cursor-not-allowed font-medium" />
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

                  {listingsLoading ? (
                    <div className="p-10 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></div>
                  ) : !listings || listings.length === 0 ? (
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
                              <p className="text-sm font-bold text-primary">₹{(listing.monthlyRent || 0).toLocaleString('en-IN')}</p>
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

                  {requestsLoading ? (
                    <div className="p-10 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></div>
                  ) : !requests || requests.length === 0 ? (
                    <Card className="border-none py-12 text-center bg-white">
                      <Search className="h-10 w-10 text-muted mx-auto mb-4" />
                      <p className="text-muted-foreground">No active search requirements found.</p>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {requests.map((req: any) => (
                        <Card key={req.id} className="border-none shadow-sm bg-white overflow-hidden p-6 flex items-center justify-between">
                          <div>
                            <h4 className="font-bold font-headline">Looking for: {req.propertyType}</h4>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" /> {req.locationFilter}
                            </p>
                          </div>
                          <div className="text-right">
                             <p className="text-sm font-bold text-secondary-foreground bg-secondary/20 px-2 py-1 rounded">Budget: ₹{(req.maxRent || 0).toLocaleString('en-IN')}</p>
                             <p className="text-[10px] text-muted-foreground mt-1 uppercase">Active Match</p>
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
                    {notificationsLoading ? (
                      <div className="p-10 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></div>
                    ) : notifications?.length === 0 ? (
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
                                {notif.createdAt && format(new Date(notif.createdAt), 'MMM d, h:mm a')}
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