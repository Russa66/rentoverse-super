"use client";

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Home, Users, Search, Share2, Activity, MessageCircle } from "lucide-react";

export default function AdminDashboard() {
  const { firestore } = useFirestore();

  // Fetch all listings
  const listingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "published_room_listings");
  }, [firestore]);
  const { data: listings, isLoading: listingsLoading } = useCollection(listingsQuery);

  // Fetch all search requests
  const requestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "saved_search_requests");
  }, [firestore]);
  const { data: requests, isLoading: requestsLoading } = useCollection(requestsQuery);

  // Fetch all social posts
  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "social_posts");
  }, [firestore]);
  const { data: posts, isLoading: postsLoading } = useCollection(postsQuery);

  const stats = [
    { title: "Total Listings", value: listings?.length || 0, icon: Home, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Active Requirements", value: requests?.length || 0, icon: Search, color: "text-orange-600", bg: "bg-orange-100" },
    { title: "AI Social Posts", value: posts?.length || 0, icon: Share2, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container px-4 py-8 mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary p-2 rounded-lg">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-headline font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">Monitor all platform activity and matching operations.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-none shadow-sm">
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
          <TabsList className="bg-white p-1 rounded-xl shadow-sm border h-12">
            <TabsTrigger value="listings" className="font-headline gap-2">
              <Home className="h-4 w-4" /> Property Listings
            </TabsTrigger>
            <TabsTrigger value="requests" className="font-headline gap-2">
              <Search className="h-4 w-4" /> Tenant Requirements
            </TabsTrigger>
            <TabsTrigger value="posts" className="font-headline gap-2">
              <Share2 className="h-4 w-4" /> Social Posts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-headline">Global Listings Feed</CardTitle>
                <CardDescription>All properties currently published on RentiPedia.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Rent</TableHead>
                      <TableHead>Posted At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listingsLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8">Loading listings...</TableCell></TableRow>
                    ) : listings?.map((listing: any) => (
                      <TableRow key={listing.id}>
                        <TableCell className="font-medium">{listing.title}</TableCell>
                        <TableCell>{listing.location}</TableCell>
                        <TableCell className="text-primary font-bold">₹{listing.monthlyRent}</TableCell>
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
                <CardDescription>What renters are looking for right now.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location Filter</TableHead>
                      <TableHead>Max Budget</TableHead>
                      <TableHead>Notification</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requestsLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8">Loading requirements...</TableCell></TableRow>
                    ) : requests?.map((req: any) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.locationFilter}</TableCell>
                        <TableCell className="text-orange-600 font-bold">₹{req.maxRent}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
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
                <CardDescription>Automated posts shared to Facebook/WhatsApp.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {postsLoading ? (
                    <p className="text-center py-8">Loading post activity...</p>
                  ) : posts?.map((post: any) => (
                    <div key={post.id} className="p-4 border rounded-xl bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={`${post.platform === 'facebook' ? 'bg-blue-600' : 'bg-green-600'} text-white`}>
                          {post.platform.toUpperCase()}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {post.createdAt ? format(new Date(post.createdAt), 'MMM d, h:mm a') : 'N/A'}
                        </span>
                      </div>
                      <p className="text-sm italic text-gray-700 bg-muted/30 p-3 rounded-lg border-l-4 border-primary">
                        "{post.postContent?.substring(0, 150)}..."
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase">Status: {post.status}</Badge>
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

import { collection } from 'firebase/firestore';