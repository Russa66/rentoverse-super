
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
import { User, MessageCircle, Home, Bell, Mail, CheckCircle, Save, Sparkles, MapPin, XCircle, LogOut, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useCollection, useMemoFirebase, useAuth, useDoc } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { format } from "date-fns";
import SocialPostDialog from "@/components/SocialPostDialog";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { toast } = useToast();
  const { firestore } = useFirestore();
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("account");
  const [address, setAddress] = useState("");

  // Fetch real profile from Firestore
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  useEffect(() => {
    if (profile?.address) {
      setAddress(profile.address);
    }
  }, [profile]);

  // Notifications / Activity
  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/notifications`),
      orderBy("createdAt", "desc")
    );
  }, [firestore, user]);

  const { data: notifications, isLoading: notificationsLoading } = useCollection(notificationsQuery);

  // User Listings
  const listingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/listings`);
  }, [firestore, user]);

  const { data: listings, isLoading: listingsLoading } = useCollection(listingsQuery);

  const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !user) return;

    setIsSaving(true);
    
    updateDocumentNonBlocking(doc(firestore, "users", user.uid), {
      address,
      updatedAt: new Date().toISOString()
    });

    setTimeout(() => {
      toast({
        title: "Profile Updated",
        description: "Your address has been successfully saved.",
      });
      setIsSaving(false);
    }, 500);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
    toast({
      title: "Logged Out",
      description: "You have been successfully signed out.",
    });
  };

  // Determine the display name: prioritize Firestore profile name, fallback to auth name
  const displayName = profile?.name || user?.displayName || "Member";
  const firstName = displayName.split(' ')[0];
  const isVerified = profile?.isVerified || !!user?.phoneNumber;

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navbar />
        <div className="container px-4 py-20 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container px-4 py-12 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <Card className="lg:col-span-1 border-none shadow-md h-fit">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4 border-4 border-primary/20">
                  <AvatarImage src={`https://picsum.photos/seed/${user?.uid || 'user'}/200`} />
                  <AvatarFallback><User /></AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-headline font-bold">Hi, {firstName}!</h2>
                <p className="text-xs text-muted-foreground mb-4">{profile?.userType || "Member"}</p>
                
                <div className={`flex items-center gap-1.5 mt-1 mb-6 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isVerified ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                  {isVerified ? (
                    <><CheckCircle className="h-3 w-3" /> Verified Member</>
                  ) : (
                    <><XCircle className="h-3 w-3" /> Not Verified</>
                  )}
                </div>
                
                <div className="w-full space-y-1">
                  <Button 
                    variant={activeTab === "account" ? "secondary" : "ghost"} 
                    className={`w-full justify-start font-headline ${activeTab === "account" ? "text-primary" : ""}`}
                    onClick={() => setActiveTab("account")}
                  >
                    <User className="mr-2 h-4 w-4" /> My Profile
                  </Button>
                  <Button 
                    variant={activeTab === "listings" ? "secondary" : "ghost"} 
                    className={`w-full justify-start font-headline ${activeTab === "listings" ? "text-primary" : ""}`}
                    onClick={() => setActiveTab("listings")}
                  >
                    <Home className="mr-2 h-4 w-4" /> My Listings
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start font-headline text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-white border-none shadow-sm mb-6 w-full justify-start h-12 p-1 gap-2">
                <TabsTrigger value="account" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg font-headline">Account & Settings</TabsTrigger>
                <TabsTrigger value="listings" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg font-headline">My Listings</TabsTrigger>
                <TabsTrigger value="activity" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg font-headline">Activity Log</TabsTrigger>
              </TabsList>
              
              <TabsContent value="account">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="font-headline font-bold text-2xl">Profile Settings</CardTitle>
                    <CardDescription>Identity information is locked after verification. You can update your physical address below.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleUpdateProfile} className="space-y-8">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="fullname">Full Name</Label>
                          <Input id="fullname" value={displayName} disabled className="bg-muted/50 cursor-not-allowed font-medium" />
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Info className="h-3 w-3" /> Name is linked to your verified identity.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="whatsapp" className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4 text-green-500" /> Phone Number
                          </Label>
                          <Input id="whatsapp" value={profile?.phoneNumber || user?.phoneNumber || "N/A"} disabled className="bg-muted/50 cursor-not-allowed font-medium" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input id="email" value={profile?.email || user?.email || "Not Provided"} disabled className="bg-muted/50 cursor-not-allowed font-medium" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="address">Physical Address</Label>
                          <Textarea 
                            id="address" 
                            placeholder="Enter your complete home/business address for rental agreements" 
                            value={address} 
                            onChange={(e) => setAddress(e.target.value)} 
                            className="min-h-[100px]"
                          />
                        </div>
                      </div>

                      <div className="bg-primary/5 p-4 rounded-lg flex items-start gap-3 border border-primary/10">
                        <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div>
                           <p className="text-sm font-bold text-primary">Identity Verified: {isVerified ? 'YES' : 'NO'}</p>
                           <p className="text-xs text-muted-foreground leading-relaxed">
                             RentoVerse uses secure verification to build trust. Your primary contact details are locked to protect the community.
                           </p>
                        </div>
                      </div>

                      <Button type="submit" disabled={isSaving} className="font-headline px-8 h-12">
                        <Save className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : "Save Address"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="listings">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-headline font-bold">Your Properties</h3>
                      <p className="text-sm text-muted-foreground">Manage and share your current listings.</p>
                    </div>
                  </div>

                  {listingsLoading ? (
                    <div className="p-10 text-center">Loading listings...</div>
                  ) : !listings || listings.length === 0 ? (
                    <Card className="border-none py-12 text-center bg-white">
                      <Home className="h-10 w-10 text-muted mx-auto mb-4" />
                      <p className="text-muted-foreground">You haven't posted any properties yet.</p>
                      <Button className="mt-4" onClick={() => router.push('/rooms/new')}>List Property Now</Button>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {listings.map((listing: any) => {
                        const rentDisplay = typeof listing.monthlyRent === 'number' 
                          ? `₹${listing.monthlyRent.toLocaleString('en-IN')}` 
                          : listing.monthlyRent;

                        return (
                          <Card key={listing.id} className="border-none shadow-sm bg-white overflow-hidden">
                            <div className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h4 className="text-lg font-bold font-headline">{listing.title}</h4>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> {listing.location}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-primary">{rentDisplay}</p>
                                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Rent/Mo</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => router.push(`/rooms/${listing.id}`)}>
                                  View
                                </Button>
                                <SocialPostDialog 
                                  room={{
                                    ...listing,
                                    monthlyRent: rentDisplay,
                                    landlord: { name: displayName, whatsapp: profile?.phoneNumber || "" }
                                  }} 
                                  trigger={
                                    <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                                      <Sparkles className="mr-2 h-4 w-4" /> AI Share
                                    </Button>
                                  }
                                />
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="activity">
                 <div className="space-y-4">
                    <h3 className="text-xl font-headline font-bold flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" /> Activity Log
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">Real-time alerts and property matches.</p>
                    
                    {notificationsLoading ? (
                      <div className="p-10 text-center">Loading activity...</div>
                    ) : notifications?.length === 0 ? (
                      <Card className="border-none py-12 text-center">
                        <Bell className="h-10 w-10 text-muted mx-auto mb-4" />
                        <p className="text-muted-foreground">No recent activity found.</p>
                      </Card>
                    ) : (
                      notifications?.map((notif) => (
                        <Card key={notif.id} className="border-none shadow-sm flex items-center p-4 gap-4">
                           <div className={`p-2 rounded-full ${notif.deliveryMethod === 'WhatsApp' ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>
                              {notif.deliveryMethod === 'WhatsApp' ? <MessageCircle className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
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
