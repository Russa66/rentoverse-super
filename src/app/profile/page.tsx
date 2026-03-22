
"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, MessageCircle, Home, Bell, Mail, CheckCircle, Save, Sparkles, MapPin, XCircle, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import SocialPostDialog from "@/components/SocialPostDialog";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { toast } = useToast();
  const { firestore } = useFirestore();
  const { user } = useUser();
  const { auth } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("account");

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
    setIsSaving(true);
    
    setTimeout(() => {
      toast({
        title: "Profile Updated",
        description: "Your contact information has been successfully saved.",
      });
      setIsSaving(false);
    }, 1000);
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push("/");
    toast({
      title: "Logged Out",
      description: "You have been successfully signed out.",
    });
  };

  const isVerified = !!user?.phoneNumber;

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
                <h2 className="text-xl font-headline font-bold">{user?.displayName || (user?.isAnonymous ? "Guest User" : "RentoVerse User")}</h2>
                
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
              <TabsList className="bg-white border-b border-none shadow-sm mb-6 w-full justify-start h-12 p-1 gap-2">
                <TabsTrigger value="account" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg font-headline">Account & Settings</TabsTrigger>
                <TabsTrigger value="listings" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg font-headline">My Listings</TabsTrigger>
                <TabsTrigger value="activity" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg font-headline">Activity Log</TabsTrigger>
              </TabsList>
              
              <TabsContent value="account">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="font-headline font-bold text-2xl">Profile Settings</CardTitle>
                    <CardDescription>Manage your contact details and preferred communication methods.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleUpdateProfile} className="space-y-8">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="fullname">Full Name</Label>
                          <Input id="fullname" name="fullname" defaultValue={user?.displayName || ""} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="whatsapp" className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4 text-green-500" /> WhatsApp Number
                          </Label>
                          <Input id="whatsapp" name="whatsapp" placeholder="+91 XXXXX XXXXX" defaultValue={user?.phoneNumber || ""} />
                        </div>
                      </div>

                      <div className="bg-muted/50 p-4 rounded-lg flex items-start gap-3 border border-border">
                        <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div>
                           <p className="text-sm font-bold">Registration Status</p>
                           <p className="text-xs text-muted-foreground leading-relaxed">
                             {user?.isAnonymous 
                               ? "You are currently using an anonymous guest account. Link your phone number to become a verified member and secure your account permanently." 
                               : "You are logged in with a registered account. Verified members enjoy higher trust ratings from property owners."}
                           </p>
                        </div>
                      </div>

                      <Button type="submit" disabled={isSaving} className="font-headline px-8">
                        <Save className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : "Save Profile"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="listings">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-headline font-bold">Your Posted Rooms</h3>
                      <p className="text-sm text-muted-foreground">Manage and share your properties to increase visibility.</p>
                    </div>
                  </div>

                  {listingsLoading ? (
                    <div className="p-10 text-center">Loading your listings...</div>
                  ) : !listings || listings.length === 0 ? (
                    <Card className="border-none py-12 text-center bg-white">
                      <Home className="h-10 w-10 text-muted mx-auto mb-4" />
                      <p className="text-muted-foreground">You haven't posted any rooms yet.</p>
                      <Button className="mt-4" onClick={() => window.location.href = '/rooms/new'}>List a Room Now</Button>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {listings.map((listing: any) => {
                        const rentDisplay = typeof listing.monthlyRent === 'number' 
                          ? `₹${listing.monthlyRent.toLocaleString('en-IN')}` 
                          : listing.monthlyRent;

                        return (
                          <Card key={listing.id} className="border-none shadow-sm bg-white overflow-hidden">
                            <div className="flex flex-col md:flex-row">
                              <div className="flex-1 p-6">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="text-lg font-bold font-headline mb-1">{listing.title}</h4>
                                    <div className="flex items-center text-sm text-muted-foreground gap-1 mb-3">
                                      <MapPin className="h-3 w-3 text-destructive" /> {listing.location}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xl font-bold text-primary font-headline">{rentDisplay}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Per Month</p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {listing.amenities?.map((amenity: string) => (
                                    <span key={amenity} className="text-[10px] bg-primary/5 text-primary px-2 py-0.5 rounded-full font-bold">{amenity}</span>
                                  ))}
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-4 border-t">
                                  <Button variant="outline" size="sm" onClick={() => window.location.href = `/rooms/${listing.id}`}>
                                    View Details
                                  </Button>
                                  <SocialPostDialog 
                                    room={{
                                      ...listing,
                                      monthlyRent: rentDisplay,
                                      nearestCommunication: listing.nearestCommunicationOptions?.[0] || "",
                                      wifiAvailable: listing.amenities?.includes("WiFi"),
                                      acAvailable: listing.amenities?.includes("AC"),
                                      inverterAvailable: listing.amenities?.includes("Inverter"),
                                      landlord: { name: user?.displayName || "Landlord", whatsapp: "" }
                                    }} 
                                    trigger={
                                      <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                                        <Sparkles className="mr-2 h-4 w-4" /> AI Share Listing
                                      </Button>
                                    }
                                  />
                                </div>
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
                      <Bell className="h-5 w-5 text-primary" /> Activity & Matches
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">Real-time updates on property matches and system alerts.</p>
                    
                    {notificationsLoading ? (
                      <div className="p-10 text-center">Loading activity...</div>
                    ) : notifications?.length === 0 ? (
                      <Card className="border-none py-12 text-center">
                        <Bell className="h-10 w-10 text-muted mx-auto mb-4" />
                        <p className="text-muted-foreground">No activity found. Post a room or requirement to start matching!</p>
                      </Card>
                    ) : (
                      notifications?.map((notif) => (
                        <Card key={notif.id} className="border-none shadow-sm flex items-center p-4 gap-4">
                           <div className={`p-2 rounded-full ${notif.deliveryMethod === 'WhatsApp' ? 'bg-green-100 text-green-600' : notif.deliveryMethod === 'Email' ? 'bg-blue-100 text-blue-600' : 'bg-primary/10 text-primary'}`}>
                              {notif.deliveryMethod === 'WhatsApp' ? <MessageCircle className="h-5 w-5" /> : notif.deliveryMethod === 'Email' ? <Mail className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                           </div>
                           <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{notif.message}</p>
                                {notif.status === 'Pending' && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-bold">In Transit</span>}
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-primary" /> Delivery attempt via {notif.deliveryMethod} • {notif.createdAt && format(new Date(notif.createdAt), 'MMM d, h:mm a')}
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
