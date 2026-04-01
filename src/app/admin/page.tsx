
"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, updateDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Home, Users, Search, Share2, Activity, MessageCircle, ShieldAlert, Lock, MapPin, CheckCircle, Database, Sparkles, Loader2 } from "lucide-react";
import { collection, doc } from 'firebase/firestore';
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { MOCK_ROOMS } from "@/lib/mock-data";

export default function AdminDashboard() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [editingLocality, setEditingLocality] = useState<{ id: string, value: string } | null>(null);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  
  const { data: profile, isLoading: profileLoading } = useDoc(userProfileRef);

  const listingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "room_listings");
  }, [firestore]);
  const { data: listings, isLoading: listingsLoading } = useCollection(listingsQuery);

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "saved_search_requests");
  }, [firestore]);
  const { data: requests, isLoading: requestsLoading } = useCollection(requestsQuery);

  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "social_posts");
  }, [firestore]);
  const { data: posts, isLoading: postsLoading } = useCollection(postsQuery);

  const handleUpdateLocality = (listingId: string) => {
    if (!firestore || !editingLocality) return;

    const listingRef = doc(firestore, "room_listings", listingId);
    updateDocumentNonBlocking(listingRef, { locality: editingLocality.value });
    
    const listing = listings?.find(l => l.id === listingId);
    if (listing && listing.landlordId) {
      const privateRef = doc(firestore, `users/${listing.landlordId}/listings`, listingId);
      updateDocumentNonBlocking(privateRef, { locality: editingLocality.value });
    }

    setEditingLocality(null);
    toast({ title: "Locality Updated", description: "The public-facing location has been updated." });
  };

  const seedSampleData = async () => {
    if (!firestore || !user) return;
    setIsSeeding(true);
    
    try {
      // 1. Seed Current User Profile
      const userData = {
        id: user.uid,
        name: user.displayName || "Platform Admin",
        email: user.email,
        phoneNumber: user.phoneNumber || "+919876543210",
        isAdmin: true,
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setDocumentNonBlocking(doc(firestore, "users", user.uid), userData, { merge: true });

      // 2. Seed Sample Listings to Public Collection
      for (const room of MOCK_ROOMS) {
        const listingId = `seed_${room.id}`;
        const listingRef = doc(firestore, "room_listings", listingId);
        const listingData = {
          ...room,
          id: listingId,
          landlordId: user.uid,
          landlordName: userData.name,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Ensure image URLs are valid
          photoUrls: room.photoUrls || [`https://picsum.photos/seed/${room.id}/800/600`]
        };
        setDocumentNonBlocking(listingRef, listingData, { merge: true });
        
        // Also seed to user's private collection
        const privateListingRef = doc(firestore, `users/${user.uid}/listings`, listingId);
        setDocumentNonBlocking(privateListingRef, listingData, { merge: true });
      }

      // 3. Seed some sample search requests
      const sampleRequests = [
        { 
          id: 'seed_req_1', 
          renterId: user.uid, 
          renterName: 'RentoVerse Demo Tenant',
          locationFilter: 'Downtown, Metropolis', 
          maxRent: 30000, 
          propertyType: 'Studio', 
          createdAt: new Date().toISOString(), 
          notificationPreference: 'WhatsApp' 
        },
        { 
          id: 'seed_req_2', 
          renterId: user.uid, 
          renterName: 'University Student',
          locationFilter: 'West End, University Area', 
          maxRent: 15000, 
          propertyType: 'Single Room', 
          createdAt: new Date().toISOString(), 
          notificationPreference: 'SMS' 
        }
      ];

      for (const req of sampleRequests) {
        setDocumentNonBlocking(doc(firestore, "saved_search_requests", req.id), req, { merge: true });
        setDocumentNonBlocking(doc(firestore, `users/${user.uid}/saved_search_requests/${req.id}`), req, { merge: true });
      }

      toast({
        title: "Database Seeded Successfully",
        description: `${MOCK_ROOMS.length} properties and ${sampleRequests.length} requirements are now live in Firestore.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Seeding Failed",
        description: error.message
      });
    } finally {
      setIsSeeding(false);
    }
  };

  if (isUserLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Allow first user to see seed option even if not admin yet to bootstrap the site
  const canSeeDashboard = user && (profile?.isAdmin || listings?.length === 0 || !profile);

  if (!user || !canSeeDashboard) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-none shadow-2xl text-center p-8">
            <div className="bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="h-8 w-8 text-destructive" />
            </div>
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-2xl font-headline font-bold">Restricted Access</CardTitle>
              <CardDescription>
                You do not have the required permissions to view the Admin Dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Link href="/">
                <Button className="w-full font-headline">Return to Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stats = [
    { title: "Live Listings", value: listings?.length || 0, icon: Home, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Active Requirements", value: requests?.length || 0, icon: Search, color: "text-orange-600", bg: "bg-orange-100" },
    { title: "Social Posts", value: posts?.length || 0, icon: Share2, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container px-4 py-8 mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg shadow-sm">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm">Manage live properties and platform metadata.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="font-headline border-primary text-primary hover:bg-primary/5 gap-2"
              onClick={seedSampleData}
              disabled={isSeeding}
            >
              {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              Seed Sample Data
            </Button>
            <Badge variant="secondary" className="gap-1 px-3 py-1 font-bold h-10">
              <ShieldAlert className="h-3 w-3" /> Secure Session
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`${stat.bg} p-3 rounded-xl`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold font-headline">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl shadow-sm border h-12 inline-flex">
            <TabsTrigger value="listings" className="font-headline gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Home className="h-4 w-4" /> Properties
            </TabsTrigger>
            <TabsTrigger value="requests" className="font-headline gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Search className="h-4 w-4" /> Requirements
            </TabsTrigger>
            <TabsTrigger value="posts" className="font-headline gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Share2 className="h-4 w-4" /> Social Audit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-headline">Live Property Database</CardTitle>
                    <CardDescription>Review and moderate all listings currently active on RentoVerse.</CardDescription>
                  </div>
                  {listings?.length === 0 && !listingsLoading && (
                    <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 animate-pulse">Database Empty</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold">Property / Exact Address</TableHead>
                      <TableHead className="font-bold">Public Locality</TableHead>
                      <TableHead className="font-bold">Rent</TableHead>
                      <TableHead className="font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listingsLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-12">Loading listings...</TableCell></TableRow>
                    ) : listings?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
                          <div className="flex flex-col items-center gap-4">
                            <Database className="h-10 w-10 opacity-20" />
                            <p>No listings found in Firestore.</p>
                            <Button onClick={seedSampleData} variant="secondary" size="sm">Seed Sample Data Now</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : listings?.map((listing: any) => (
                      <TableRow key={listing.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold">{listing.title}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3 text-destructive" /> {listing.location}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingLocality?.id === listing.id ? (
                            <Input 
                              value={editingLocality.value} 
                              onChange={(e) => setEditingLocality({ ...editingLocality, value: e.target.value })}
                              className="h-8 text-xs max-w-[200px]"
                              placeholder="Enter Locality"
                            />
                          ) : (
                            <Badge variant={listing.locality ? "default" : "outline"} className={listing.locality ? "bg-primary/10 text-primary border-primary/20" : "text-muted-foreground"}>
                              {listing.locality || "Not Set"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-primary font-bold">
                          {typeof listing.monthlyRent === 'number' ? `₹${listing.monthlyRent.toLocaleString('en-IN')}` : listing.monthlyRent}
                        </TableCell>
                        <TableCell>
                          {editingLocality?.id === listing.id ? (
                            <div className="flex items-center gap-2">
                              <Button size="sm" onClick={() => handleUpdateLocality(listing.id)} className="h-7 px-2">
                                <CheckCircle className="h-3 w-3 mr-1" /> Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingLocality(null)} className="h-7 px-2">Cancel</Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => setEditingLocality({ id: listing.id, value: listing.locality || "" })} className="h-7 text-xs">
                              Edit Locality
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-headline">Tenant Requirements Log</CardTitle>
                <CardDescription>Direct data from the saved_search_requests collection.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold">Location Filter</TableHead>
                      <TableHead className="font-bold">Max Budget</TableHead>
                      <TableHead className="font-bold">Contact Method</TableHead>
                      <TableHead className="font-bold">Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requestsLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-12">Loading requirement data...</TableCell></TableRow>
                    ) : requests?.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">No active requirements found in database.</TableCell></TableRow>
                    ) : requests?.map((req: any) => (
                      <TableRow key={req.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{req.locationFilter}</TableCell>
                        <TableCell className="text-orange-600 font-bold">
                          {typeof req.maxRent === 'number' ? `₹${req.maxRent.toLocaleString('en-IN')}` : req.maxRent}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            <MessageCircle className="h-3 w-3" /> {req.notificationPreference || "WhatsApp"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {req.createdAt ? format(new Date(req.createdAt), 'MMM d, yyyy') : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-headline">AI Posting Activity Audit</CardTitle>
                <CardDescription>Audit of all automated posts recorded in the social_posts collection.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {postsLoading ? (
                    <p className="text-center py-12">Loading social post audit log...</p>
                  ) : posts?.length === 0 ? (
                    <div className="text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed">
                      <Share2 className="h-10 w-10 text-muted mx-auto mb-4 opacity-30" />
                      <p className="text-muted-foreground">No social posting activity recorded yet.</p>
                    </div>
                  ) : posts?.map((post: any) => (
                    <div key={post.id} className="p-4 border rounded-xl bg-white shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={`${post.platform === 'facebook' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white`}>
                            {(post.platform || 'whatsapp').toUpperCase()}
                          </Badge>
                          <span className="text-xs font-semibold text-muted-foreground">Auto-Generated</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded">
                          {post.createdAt ? format(new Date(post.createdAt), 'MMM d, h:mm a') : 'N/A'}
                        </span>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
                        <p className="text-sm italic text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {post.postContent}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t text-[10px] text-muted-foreground uppercase font-bold">
                        <span>Status: <span className="text-primary">{post.status || "Completed"}</span></span>
                        <span>•</span>
                        <span>Author ID: {post.authorId?.substring(0, 8) || "System"}...</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
