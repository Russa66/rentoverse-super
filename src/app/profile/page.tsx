
"use client";

import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, MessageCircle, Settings, Home, History, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { toast } = useToast();

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
                  <AvatarImage src="https://picsum.photos/seed/user/200" />
                  <AvatarFallback><User /></AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-headline font-bold">John Landlord</h2>
                <p className="text-sm text-muted-foreground mb-6">Verified Member since 2023</p>
                
                <div className="w-full space-y-1">
                  <Button variant="secondary" className="w-full justify-start font-headline text-primary">
                    <User className="mr-2 h-4 w-4" /> My Profile
                  </Button>
                  <Button variant="ghost" className="w-full justify-start font-headline">
                    <Home className="mr-2 h-4 w-4" /> My Listings
                  </Button>
                  <Button variant="ghost" className="w-full justify-start font-headline">
                    <Bell className="mr-2 h-4 w-4" /> Notifications
                  </Button>
                  <Button variant="ghost" className="w-full justify-start font-headline text-destructive hover:bg-destructive/10">
                    <Settings className="mr-2 h-4 w-4" /> Logout
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
                <TabsTrigger value="security" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg font-headline">Security</TabsTrigger>
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
                          <Input id="fullname" defaultValue="John Landlord" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input id="email" defaultValue="john.landlord@example.com" disabled />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="whatsapp" className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4 text-green-500" /> WhatsApp Number
                          </Label>
                          <Input id="whatsapp" defaultValue="+1234567890" placeholder="+1234567890" />
                          <p className="text-[10px] text-muted-foreground">Renters will use this to contact you directly.</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Account Type</Label>
                          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                            <option>Landlord</option>
                            <option>Renter</option>
                          </select>
                        </div>
                      </div>
                      <Button type="submit" className="font-headline px-8">Save Changes</Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
