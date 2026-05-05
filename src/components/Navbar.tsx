"use client";

import Link from "next/link";
import { Search, PlusCircle, User, FileText, Send, LogIn, Menu, Home, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState, useEffect } from "react";

export default function Navbar() {
  const supabase = createClient();
  const logo = PlaceHolderImages.find(img => img.id === 'logo');
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) {
        const { data: adminData } = await supabase.from('admin_list').select('user_id').eq('user_id', session.user.id).maybeSingle();
        setProfile({ is_admin: !!adminData });
      }
      setLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        const { data: adminData } = await supabase.from('admin_list').select('user_id').eq('user_id', session.user.id).maybeSingle();
        setProfile({ is_admin: !!adminData });
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const NavLinks = () => (
    <>
      <Link 
        href="/search" 
        onClick={() => setIsOpen(false)}
        className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2 md:gap-1"
      >
        <Search className="h-4 w-4" /> Browse
      </Link>
      <Link 
        href="/search-requests/new" 
        onClick={() => setIsOpen(false)}
        className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2 md:gap-1"
      >
        <Send className="h-4 w-4" /> Post Requirement
      </Link>
      <Link 
        href="/legal-form" 
        onClick={() => setIsOpen(false)}
        className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2 md:gap-1"
      >
        <FileText className="h-4 w-4" /> Legal
      </Link>
      {profile?.is_admin && (
        <Link 
          href="/admin" 
          onClick={() => setIsOpen(false)}
          className="text-sm font-bold text-destructive hover:text-destructive/80 transition-colors flex items-center gap-2 md:gap-1"
        >
          <ShieldAlert className="h-4 w-4" /> Dashboard
        </Link>
      )}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto">
        <div className="flex items-center gap-4">
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader className="text-left pb-6 border-b">
                  <SheetTitle className="flex items-center gap-2">
                    <div className="relative w-8 h-8">
                      {logo && <Image src={logo.imageUrl} alt="RentoVerse" fill className="object-contain" />}
                    </div>
                    <span className="font-headline font-bold text-xl text-primary">RentoVerse</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 py-8">
                  <NavLinks />
                  <Separator />
                  <Link href="/rooms/new" onClick={() => setIsOpen(false)}>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <PlusCircle className="h-4 w-4" /> List Property
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <div className="relative w-8 h-8 md:w-10 md:h-10">
              {logo && <Image src={logo.imageUrl} alt="RentoVerse" fill className="object-contain" priority />}
            </div>
            <span className="text-xl md:text-2xl font-headline font-bold text-primary tracking-tighter">RentoVerse</span>
          </Link>
        </div>
        
        <div className="hidden md:flex items-center gap-6">
          <NavLinks />
        </div>

        <div className="flex items-center gap-2">
          <Link href="/rooms/new" className="hidden sm:block">
            <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">
              <PlusCircle className="mr-2 h-4 w-4" /> List Property
            </Button>
          </Link>
          {!loading && (
            user ? (
              <Link href="/profile">
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" /> Login
                </Button>
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}

function Separator() {
  return <div className="h-px w-full bg-border" />;
}
