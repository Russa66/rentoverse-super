
"use client";

import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, MessageCircle, Settings, Home, Bell, Sparkles, Facebook, Mail, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { format } from "date-fns";

export default function ProfilePage() {
  const { toast } = useToast();
  const { firestore } = useFirestore();
  const { user } = useUser();

  // Social Posts Feed
  const socialPostsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "social_posts"),
      where("authorId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [firestore, user]);

  const { data: socialPosts, isLoading: postsLoading } = useCollection(socialPostsQuery);

  // Notifications
  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/notifications`),
      orderBy("createdAt", "desc")
    );
  }, [firestore, user]);

  const { data: notifications, isLoading: notificationsLoading } = useCollection(notificationsQuery);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profile Updated",
      description: "Your changes have been saved successfully.",
    });
  };

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
                <h2 className="text-xl font-headline font-bold">{user?.displayName || "RentiPedia User"}</h2>
                <p className="text-sm text-muted-foreground mb-6">Verified Member</p>
                
                <div className="w-full space-y-1">
                  <Button variant="secondary" className="w-full justify-start font-headline text-primary">
                    <User className="mr-2 h-4 w-4" /> My Profile
                  </Button>
                  <Button variant="ghost" className="w-full justify-start font-headline">
                    <Home className="mr-2 h-4 w-4" /> My Listings
                  </Button>
                  <Button variant="ghost" className="w-full justify-start font-headline">
                    <Bell className="mr-2 h-4 w-4" /> Activity
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="bg-white border-b border-none shadow-sm mb-6 w-full justify-start h-12 p-1 gap-2">
                <TabsTrigger value="account" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg font-headline">Account Details</TabsTrigger>
                <TabsTrigger value="social" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg font-headline">Social Feed</TabsTrigger>
                <TabsTrigger value="notifications" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg font-headline">Notifications</TabsTrigger>
              </TabsList>
              
              <TabsContent value="account">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="font-headline font-bold text-2xl">Profile Settings</CardTitle>
                    <CardDescription>Update your contact info and personal details.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleUpdate} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="fullname">Full Name</Label>
                          <Input id="fullname" defaultValue={user?.displayName || ""} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input id="email" defaultValue={user?.email || ""} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="whatsapp" className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4 text-green-500" /> WhatsApp Number
                          </Label>
                          <Input id="whatsapp" placeholder="+91 XXXXX XXXXX" />
                        </div>
                      </div>
                      <Button type="submit" className="font-headline px-8">Save Changes</Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="social">
                 <div className="space-y-4">
                    <h3 className="text-xl font-headline font-bold flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" /> AI-Generated Social Posts
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">History of posts RentiPedia's AI has automatically shared for you.</p>
                    
                    {postsLoading ? (
                      <div className="p-10 text-center">Loading feed...</div>
                    ) : socialPosts?.length === 0 ? (
                      <Card className="border-dashed border-2 py-12 text-center">
                        <Facebook className="h-10 w-10 text-muted mx-auto mb-4" />
                        <p className="text-muted-foreground">No social posts generated yet. Post a room to see AI in action!</p>
                      </Card>
                    ) : (
                      socialPosts?.map((post) => (
                        <Card key={post.id} className="border-none shadow-sm overflow-hidden">
                           <div className="bg-blue-50 px-4 py-2 border-b flex items-center justify-between">
                              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                                 <Facebook className="h-3 w-3" /> Shared to Facebook Groups
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {post.createdAt && format(new Date(post.createdAt), 'MMM d, h:mm a')}
                              </span>
                           </div>
                           <CardContent className="p-4 bg-white">
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.postContent}</p>
                           </CardContent>
                        </Card>
                      ))
                    )}
                 </div>
              </TabsContent>

              <TabsContent value="notifications">
                 <div className="space-y-4">
                    {notificationsLoading ? (
                      <div className="p-10 text-center">Loading activity...</div>
                    ) : notifications?.length === 0 ? (
                      <Card className="border-none py-12 text-center">
                        <Bell className="h-10 w-10 text-muted mx-auto mb-4" />
                        <p className="text-muted-foreground">No matches or notifications found.</p>
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
