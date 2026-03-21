
"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Home, Users, Search, Share2, Activity, MessageCircle, ShieldAlert, Lock } from "lucide-react";
import { collection, doc } from 'firebase/firestore';
import Link from "next/link";

export default function AdminDashboard() {
  const { firestore } = useFirestore();
  const { user, isUserLoading } = useUser();

  // Fetch the current user's profile to check for admin status
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  
  const { data: profile, isLoading: profileLoading } = useDoc(userProfileRef);

  // Fetch all listings
  const listingsQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.isAdmin) return null;
    return collection(firestore, "published_room_listings");
  }, [firestore, profile]);
  const { data: listings, isLoading: listingsLoading } = useCollection(listingsQuery);

  // Fetch all search requests
  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.isAdmin) return null;
    return collection(firestore, "saved_search_requests");
  }, [firestore, profile]);
  const { data: requests, isLoading: requestsLoading } = useCollection(requestsQuery);

  // Fetch all social posts
  const postsQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.isAdmin) return null;
    return collection(firestore, "social_posts");
  }, [firestore, profile]);
  const { data: posts, isLoading: postsLoading } = useCollection(postsQuery);

  if (isUserLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Restriction UI
  if (!user || !profile?.isAdmin) {
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
                You do not have the required permissions to view the Admin Dashboard. Please contact the system administrator if you believe this is an error.
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
    { title: "Total Listings", value: listings?.length || 0, icon: Home, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Active Requirements", value: requests?.length || 0, icon: Search, color: "text-orange-600", bg: "bg-orange-100" },
    { title: "AI Social Posts", value: posts?.length || 0, icon: Share2, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container px-4 py-8 mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg shadow-sm">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm">Real-time platform monitoring for RentiPedia administrators.</p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1 px-3 py-1 font-bold">
            <ShieldAlert className="h-3 w-3" /> Secure Session
          </Badge>
        </div>

        {/* Stats Grid */}
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
              <Home className="h-4 w-4" /> Listings
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
                <CardTitle className="font-headline">Global Listings Feed</CardTitle>
                <CardDescription>All properties currently published and live on the platform.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold">Property Title</TableHead>
                      <TableHead className="font-bold">Location</TableHead>
                      <TableHead className="font-bold">Rent</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="font-bold">Posted At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listingsLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12">Loading platform listings...</TableCell></TableRow>
                    ) : listings?.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No active listings found.</TableCell></TableRow>
                    ) : listings?.map((listing: any) => (
                      <TableRow key={listing.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{listing.title}</TableCell>
                        <TableCell>{listing.location}</TableCell>
                        <TableCell className="text-primary font-bold">₹{listing.monthlyRent}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Live</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {listing.createdAt ? format(new Date(listing.createdAt), 'MMM d, yyyy') : 'N/A'}
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
                <CardTitle className="font-headline">Active Tenant Requirements</CardTitle>
                <CardDescription>What renters are searching for across various locations.</CardDescription>
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
                      <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">No active requirements found.</TableCell></TableRow>
                    ) : requests?.map((req: any) => (
                      <TableRow key={req.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{req.locationFilter}</TableCell>
                        <TableCell className="text-orange-600 font-bold">₹{req.maxRent}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            <MessageCircle className="h-3 w-3" /> {req.notificationPreference}
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
                <CardTitle className="font-headline">AI Social Posting Activity</CardTitle>
                <CardDescription>Audit of all automated posts generated for external social platforms.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {postsLoading ? (
                    <p className="text-center py-12">Loading social post audit log...</p>
                  ) : posts?.length === 0 ? (
                    <p className="text-center py-12 text-muted-foreground">No social posting activity recorded.</p>
                  ) : posts?.map((post: any) => (
                    <div key={post.id} className="p-4 border rounded-xl bg-white shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={`${post.platform === 'facebook' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white`}>
                            {post.platform.toUpperCase()}
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
                        <span>Status: <span className="text-primary">{post.status}</span></span>
                        <span>•</span>
                        <span>Author ID: {post.authorId?.substring(0, 8)}...</span>
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
