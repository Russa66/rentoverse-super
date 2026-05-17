"use client";

import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Home, Users, Search, Share2, Activity, MessageCircle, ShieldAlert, Lock, MapPin, CheckCircle, Database, Loader2, Mail, Check, X, UserCheck, UserX, Send } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { MOCK_ROOMS } from "@/lib/mock-data";
import { createClient } from "@/utils/supabase/client";

export default function AdminDashboard() {
  const supabase = createClient();
  const { toast } = useToast();
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [listings, setListings] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [listingsLoading, setListingsLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);

  const [isSeeding, setIsSeeding] = useState(false);
  const [editingLocality, setEditingLocality] = useState<{ id: string, value: string } | null>(null);

  // Messaging & notification states
  const [selectedUserForMessage, setSelectedUserForMessage] = useState<any | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      if (session?.user) {
        // Fetch Profile with Recovery Fallback
        let { data: profileData, error: profileErr } = await supabase
          .from('users')
          .select('*, admin_list(user_id)')
          .eq('auth_id', session.user.id)
          .maybeSingle();
          
        if (profileErr || !profileData) {
          // Fallback: Check if user exists by ID (old architecture)
          const { data: fallbackData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (fallbackData) {
            // Sync auth_id for future visits
            await supabase.from('users').update({ auth_id: session.user.id }).eq('id', session.user.id);
            profileData = { ...fallbackData, auth_id: session.user.id };
            
            // Also fetch admin status for fallback
            const { data: adminCheck } = await supabase.from('admin_list').select('user_id').eq('user_id', session.user.id).maybeSingle();
            profileData.is_admin = !!adminCheck;
            console.log("Admin profile recovered and synced with auth_id");
          }
        }

        if (profileData) {
          // Map admin_list join to is_admin property for UI compatibility
          profileData.is_admin = profileData.is_admin || (profileData.admin_list ? (Array.isArray(profileData.admin_list) ? profileData.admin_list.length > 0 : !!profileData.admin_list) : false);
        }

        setProfile(profileData);
        
        if (profileData?.is_admin) {
           fetchAdminData();
        }
      }
      setLoadingUser(false);
    };

    fetchSession();
  }, [supabase]);

  const fetchAdminData = async () => {
    // Fetch Listings
    supabase.from('room_listings').select('*').order('created_at', { ascending: false }).then(({ data }) => {
       if (data) setListings(data);
       setListingsLoading(false);
    });
    
    // Fetch Requests
    supabase.from('saved_search_requests').select('*').order('created_at', { ascending: false }).then(({ data }) => {
       if (data) setRequests(data);
       setRequestsLoading(false);
    });
    
    // Fetch Posts (Requires Admin)
    supabase.from('social_posts').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
       if (data) setPosts(data);
       setPostsLoading(false);
    });

    // Fetch Registered Users
    supabase.from('users').select('*').order('created_at', { ascending: false }).then(({ data }) => {
       if (data) setUsers(data);
       setUsersLoading(false);
    });
  };

  const handleUpdateLocality = async (listingId: string) => {
    if (!editingLocality) return;

    const { error } = await supabase
      .from('room_listings')
      .update({ locality: editingLocality.value })
      .eq('id', listingId);

    if (error) {
       toast({ title: "Error", description: error.message, variant: "destructive" });
       return;
    }

    setListings(prev => prev.map(l => l.id === listingId ? { ...l, locality: editingLocality.value } : l));
    setEditingLocality(null);
    toast({ title: "Locality Updated", description: "The public-facing location has been updated in Postgres." });
  };

  // Set property approval status
  const handleSetPropertyStatus = async (listingId: string, newStatus: 'Pending' | 'Approved' | 'Rejected') => {
    const { error } = await supabase
      .from('room_listings')
      .update({ approval_status: newStatus })
      .eq('id', listingId);

    if (error) {
       toast({ title: "Error Status Change", description: error.message, variant: "destructive" });
       return;
    }

    setListings(prev => prev.map(l => l.id === listingId ? { ...l, approval_status: newStatus } : l));
    toast({ 
      title: "Property Status Changed", 
      description: `Property status has been updated to ${newStatus}.` 
    });
  };

  // Set saved search requirement approval status
  const handleSetRequirementStatus = async (requestId: string, newStatus: 'Pending' | 'Approved' | 'Rejected') => {
    const { error } = await supabase
      .from('saved_search_requests')
      .update({ approval_status: newStatus })
      .eq('id', requestId);

    if (error) {
       toast({ title: "Error Status Change", description: error.message, variant: "destructive" });
       return;
    }

    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, approval_status: newStatus } : r));
    toast({ 
      title: "Requirement Status Changed", 
      description: `Requirement search status has been updated to ${newStatus}.` 
    });
  };

  // Verify/Unverify user account
  const handleToggleUserVerification = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('users')
      .update({ is_verified: !currentStatus })
      .eq('id', userId);

    if (error) {
       toast({ title: "Verification Toggle Error", description: error.message, variant: "destructive" });
       return;
    }

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: !currentStatus } : u));
    toast({ 
      title: "User Verification Updated", 
      description: `User account trust verification is now ${!currentStatus ? 'Active (Verified)' : 'Inactive (Unverified)'}.` 
    });
  };

  // Send message notification to a specific user
  const handleSendMessage = async () => {
    if (!selectedUserForMessage || !customMessage.trim()) return;
    setIsSendingMessage(true);

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: selectedUserForMessage.id,
        message: customMessage,
        is_read: false
      });

    if (error) {
       toast({ title: "Failed to Send Message", description: error.message, variant: "destructive" });
    } else {
       toast({ 
         title: "Notification Message Delivered", 
         description: `Message successfully sent to ${selectedUserForMessage.name || 'Renter'}.` 
       });
       setCustomMessage("");
       setSelectedUserForMessage(null);
    }
    setIsSendingMessage(false);
  };

  const seedSampleData = async () => {
    if (!user || !profile) return;
    setIsSeeding(true);
    
    try {
      // Seed mock rooms into Postgres with Approved status so they display immediately
      for (const room of MOCK_ROOMS) {
        const listingId = `seed_${room.id}`;
        const listingData = {
          id: listingId,
          landlord_id: profile.id,
          title: room.title,
          location: room.location,
          locality: room.locality,
          monthly_rent: room.monthlyRent,
          is_active: true,
          approval_status: 'Approved',
          photo_urls: room.photoUrls || [`https://picsum.photos/seed/${room.id}/800/600`],
          property_type: 'Room'
        };
        await supabase.from('room_listings').upsert(listingData);
      }

      toast({
        title: "Database Seeded Successfully",
        description: `Mock listings are now active and approved in Postgres.`,
      });
      fetchAdminData();
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

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Secure redirect if not an admin
  const canSeeDashboard = user && profile?.is_admin;

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
                You do not have permission to view the Admin Dashboard.
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
    { title: "Registered Users", value: users?.length || 0, icon: Users, color: "text-emerald-600", bg: "bg-emerald-100" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container px-4 py-8 mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg shadow-sm">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm">Moderate properties, requirements, registered users, and send alerts.</p>
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
              <ShieldAlert className="h-3 w-3" /> Secure Postgres Direct
            </Badge>
          </div>
        </div>

        {/* Stats Section */}
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

        {/* Navigation Tabs */}
        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl shadow-sm border h-12 inline-flex flex-wrap md:flex-nowrap">
            <TabsTrigger value="listings" className="font-headline gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Home className="h-4 w-4" /> Properties
            </TabsTrigger>
            <TabsTrigger value="requests" className="font-headline gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Search className="h-4 w-4" /> Requirements
            </TabsTrigger>
            <TabsTrigger value="users" className="font-headline gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Users className="h-4 w-4" /> Users List
            </TabsTrigger>
            <TabsTrigger value="posts" className="font-headline gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Share2 className="h-4 w-4" /> Social Audit
            </TabsTrigger>
          </TabsList>

          {/* Properties moderation panel */}
          <TabsContent value="listings">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-headline font-bold text-xl">Properties Moderation Queue</CardTitle>
                    <CardDescription>Approve newly posted properties to make them visible to renters.</CardDescription>
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
                      <TableHead className="font-bold">Moderation Status</TableHead>
                      <TableHead className="font-bold">Moderate / Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listingsLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12">Loading listings...</TableCell></TableRow>
                    ) : listings?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                          <div className="flex flex-col items-center gap-4">
                            <Database className="h-10 w-10 opacity-20" />
                            <p>No listings found in Postgres.</p>
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
                              value={editingLocality?.value || ""} 
                              onKeyPress={(e) => e.key === 'Enter' && editingLocality && handleUpdateLocality(editingLocality.id)}
                              onChange={(e) => editingLocality && setEditingLocality({ ...editingLocality, value: e.target.value })}
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
                          {typeof listing.monthly_rent === 'number' ? `₹${listing.monthly_rent.toLocaleString('en-IN')}` : listing.monthly_rent}
                        </TableCell>
                        <TableCell>
                          <Badge className={`font-bold px-2.5 py-1 ${
                            listing.approval_status === 'Approved' 
                              ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                              : listing.approval_status === 'Rejected'
                              ? 'bg-red-100 text-red-800 hover:bg-red-100'
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                          }`}>
                            {listing.approval_status || 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {editingLocality?.id === listing.id ? (
                              <div className="flex items-center gap-1.5">
                                <Button size="sm" onClick={() => handleUpdateLocality(listing.id)} className="h-8 px-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                  <CheckCircle className="h-3 w-3 mr-1" /> Save
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingLocality(null)} className="h-8 px-2">Cancel</Button>
                              </div>
                            ) : (
                              <>
                                <Button size="sm" variant="outline" onClick={() => setEditingLocality({ id: listing.id, value: listing.locality || "" })} className="h-8 text-xs">
                                  Edit Locality
                                </Button>
                                {listing.approval_status !== 'Approved' && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleSetPropertyStatus(listing.id, 'Approved')} 
                                    className="h-8 bg-green-600 hover:bg-green-700 text-white gap-1"
                                  >
                                    <Check className="h-3.5 w-3.5" /> Approve
                                  </Button>
                                )}
                                {listing.approval_status !== 'Rejected' && (
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    onClick={() => handleSetPropertyStatus(listing.id, 'Rejected')} 
                                    className="h-8 gap-1"
                                  >
                                    <X className="h-3.5 w-3.5" /> Reject
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requirements moderation panel */}
          <TabsContent value="requests">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-headline font-bold text-xl">Requirements Moderation Queue</CardTitle>
                <CardDescription>Approve renter requirements requests logs to activate them on RentoVerse.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold">Location Filter</TableHead>
                      <TableHead className="font-bold">Max Budget</TableHead>
                      <TableHead className="font-bold">Contact Method</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="font-bold">Moderate / Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requestsLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12">Loading requirement data...</TableCell></TableRow>
                    ) : requests?.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No active requirements found in database.</TableCell></TableRow>
                    ) : requests?.map((req: any) => (
                      <TableRow key={req.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{req.location_filter}</TableCell>
                        <TableCell className="text-orange-600 font-bold">
                          {typeof req.max_rent === 'number' ? `₹${req.max_rent.toLocaleString('en-IN')}` : req.max_rent}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            <MessageCircle className="h-3 w-3" /> {req.notification_preference || "WhatsApp"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`font-bold px-2.5 py-1 ${
                            req.approval_status === 'Approved' 
                              ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                              : req.approval_status === 'Rejected'
                              ? 'bg-red-100 text-red-800 hover:bg-red-100'
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                          }`}>
                            {req.approval_status || 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {req.approval_status !== 'Approved' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleSetRequirementStatus(req.id, 'Approved')} 
                                className="h-8 bg-green-600 hover:bg-green-700 text-white gap-1"
                              >
                                <Check className="h-3.5 w-3.5" /> Approve
                              </Button>
                            )}
                            {req.approval_status !== 'Rejected' && (
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => handleSetRequirementStatus(req.id, 'Rejected')} 
                                className="h-8 gap-1"
                              >
                                <X className="h-3.5 w-3.5" /> Reject
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Registered Users Management panel */}
          <TabsContent value="users">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-headline font-bold text-xl">Registered Users Directory</CardTitle>
                <CardDescription>Manage user verifications, view registered details, and send individual match alerts.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold">Member Name</TableHead>
                      <TableHead className="font-bold">Email / Phone</TableHead>
                      <TableHead className="font-bold">Registered Address</TableHead>
                      <TableHead className="font-bold">Trust Badge</TableHead>
                      <TableHead className="font-bold">Action Utilities</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12">Loading registered members...</TableCell></TableRow>
                    ) : users?.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No members found.</TableCell></TableRow>
                    ) : users?.map((u: any) => (
                      <TableRow key={u.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="font-bold">{u.name || "Anonymous Member"}</div>
                          <span className="text-[10px] text-muted-foreground block mt-0.5">
                            Joined: {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-semibold text-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" /> {u.email || "No email"}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MessageCircle className="h-3 w-3 text-green-500" /> {u.phone_number || "No WhatsApp phone"}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs max-w-xs truncate">{u.address || "No address submitted yet"}</TableCell>
                        <TableCell>
                          <Badge className={`font-bold px-2 py-0.5 uppercase text-[9px] ${
                            u.is_verified 
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-100'
                          }`}>
                            {u.is_verified ? 'Verified' : 'Basic'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant={u.is_verified ? "outline" : "default"} 
                              onClick={() => handleToggleUserVerification(u.id, u.is_verified)} 
                              className="h-8 gap-1 font-headline font-bold text-xs"
                            >
                              {u.is_verified ? (
                                <><UserX className="h-3.5 w-3.5 text-destructive" /> Unverify</>
                              ) : (
                                <><UserCheck className="h-3.5 w-3.5" /> Verify</>
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setSelectedUserForMessage(u)} 
                              className="h-8 border-primary text-primary hover:bg-primary/5 gap-1 font-headline font-bold text-xs"
                            >
                              <Send className="h-3 w-3" /> Send Message
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Audit tab */}
          <TabsContent value="posts">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-headline font-bold text-xl">AI Posting Activity Audit</CardTitle>
                <CardDescription>Audit of all automated posts recorded in the social_posts Postgres table.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {!profile?.is_admin ? (
                    <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-xl">
                       <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                       <p>Admin verification required to view social logs.</p>
                    </div>
                  ) : postsLoading ? (
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
                          {post.created_at ? format(new Date(post.created_at), 'MMM d, h:mm a') : 'N/A'}
                        </span>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
                        <p className="text-sm italic text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {post.post_content}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t text-[10px] text-muted-foreground uppercase font-bold">
                        <span>Status: <span className="text-primary">{post.status || "Completed"}</span></span>
                        <span>•</span>
                        <span>Author ID: {post.author_id?.substring(0, 8) || "System"}...</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modern Pop-up Dialog for sending messages (notifications) */}
      {selectedUserForMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full border-none shadow-2xl overflow-hidden bg-white relative rounded-2xl">
            <button 
              onClick={() => setSelectedUserForMessage(null)}
              className="absolute top-4 right-4 bg-muted hover:bg-muted/80 p-1.5 rounded-full text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <CardHeader className="bg-primary/5 pb-6">
              <div className="flex items-center gap-2 text-primary">
                <Send className="h-5 w-5" />
                <CardTitle className="font-headline font-bold text-lg">Send Custom Notification</CardTitle>
              </div>
              <CardDescription className="mt-1">
                The message will instantly be shown on their personal dashboard under **Alerts**.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="p-3 bg-muted/30 rounded-lg border text-xs">
                <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Recipient User</p>
                <p className="font-headline font-bold text-sm text-foreground mt-0.5">{selectedUserForMessage.name || 'Anonymous User'}</p>
                <p className="text-muted-foreground mt-0.5">{selectedUserForMessage.email || 'No Email'}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notification Message</label>
                <textarea 
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Type your message here... e.g. We found a matching 2 BHK room listing in Green Park that satisfies your budget requirements!"
                  className="flex min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all"
                  maxLength={500}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setSelectedUserForMessage(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendMessage}
                  disabled={isSendingMessage || !customMessage.trim()}
                  className="font-headline gap-2 h-10 px-5"
                >
                  {isSendingMessage ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="h-3.5 w-3.5" /> Dispatch Alert</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
