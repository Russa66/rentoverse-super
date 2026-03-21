
"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { User, MessageCircle, Home, Bell, Facebook, Mail, CheckCircle, Link2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, doc } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { format } from "date-fns";

export default function ProfilePage() {
  const { toast } = useToast();
  const { firestore } = useFirestore();
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);

  // Notifications / Activity
  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/notifications`),
      orderBy("createdAt", "desc")
    );
  }, [firestore, user]);

  const { data: notifications, isLoading: notificationsLoading } = useCollection(notificationsQuery);

  // Social Channels Config
  const channelsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/social_channel_configurations`),
      where("platform", "==", "Facebook")
    );
  }, [firestore, user]);

  const { data: channels } = useCollection(channelsQuery);
  const fbChannel = channels?.[0];

  const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData(e.currentTarget);
    const pageId = formData.get("pageId") as string;
    const isEnabled = formData.get("enabled") === "on";

    if (user && firestore) {
      const configId = fbChannel?.id || doc(collection(firestore, "temp")).id;
      
      setDocumentNonBlocking(
        doc(firestore, `users/${user.uid}/social_channel_configurations/${configId}`),
        {
          id: configId,
          userId: user.uid,
          platform: "Facebook",
          channelType: "Page",
          channelIdentifier: pageId,
          enabled: isEnabled,
          updatedAt: new Date().toISOString(),
          createdAt: fbChannel?.createdAt || new Date().toISOString()
        },
        { merge: true }
      );
    }

    toast({
      title: "Settings Saved",
      description: "Your profile and Facebook auto-post configuration have been updated.",
    });
    setIsSaving(false);
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="bg-white border-b border-none shadow-sm mb-6 w-full justify-start h-12 p-1 gap-2">
                <TabsTrigger value="account" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg font-headline">Account & Settings</TabsTrigger>
                <TabsTrigger value="activity" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg font-headline">Activity Log</TabsTrigger>
              </TabsList>
              
              <TabsContent value="account">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="font-headline font-bold text-2xl">Profile Settings</CardTitle>
                    <CardDescription>Manage your contact info and automatic Facebook sharing.</CardDescription>
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
                          <Input id="whatsapp" name="whatsapp" placeholder="+91 XXXXX XXXXX" />
                        </div>
                      </div>

                      <div className="pt-6 border-t">
                        <h3 className="text-lg font-headline font-bold mb-4 flex items-center gap-2">
                          <Facebook className="h-5 w-5 text-blue-600" /> Facebook Automation
                        </h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="pageId" className="flex items-center gap-2 text-sm">
                              <Link2 className="h-4 w-4" /> Target Facebook Page ID
                            </Label>
                            <Input 
                              id="pageId" 
                              name="pageId"
                              defaultValue={fbChannel?.channelIdentifier || ""} 
                              placeholder="e.g. 1029384756"
                            />
                            <p className="text-[10px] text-muted-foreground">RentiPedia will automatically post all your listings and queries to this Page.</p>
                          </div>
                          
                          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                            <div className="space-y-0.5">
                              <Label className="text-sm">Enable Auto-Posting</Label>
                              <p className="text-[10px] text-muted-foreground">AI will instantly share new posts to your Facebook page.</p>
                            </div>
                            <Switch name="enabled" defaultChecked={fbChannel?.enabled ?? true} />
                          </div>
                        </div>
                      </div>

                      <Button type="submit" disabled={isSaving} className="font-headline px-8">
                        <Save className="mr-2 h-4 w-4" /> Save All Settings
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity">
                 <div className="space-y-4">
                    <h3 className="text-xl font-headline font-bold flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" /> Activity & Matches
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">Real-time updates on property matches and social sharing status.</p>
                    
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
