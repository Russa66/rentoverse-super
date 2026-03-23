
"use client";

import Link from "next/link";
import { Search, PlusCircle, User, FileText, Send, LogIn, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/firebase";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/firejet-0.appspot.com/o/studio%2Fstudio-184067128-73095%2Fuploads%2F1741162330756.png?alt=media&token=86603a11-e77a-4286-90b4-c3e6027a4e0a";

export default function Navbar() {
  const { user } = useUser();
  const logo = PlaceHolderImages.find(img => img.id === 'logo');

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <Image 
              src={logo?.imageUrl || LOGO_URL} 
              alt="RentoVerse" 
              fill 
              className="object-contain"
              priority
            />
          </div>
          <span className="text-2xl font-headline font-bold text-primary tracking-tighter">RentoVerse</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-6">
          <Link href="/search" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
            <Search className="h-4 w-4" /> Browse
          </Link>
          <Link href="/search-requests/new" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
            <Send className="h-4 w-4" /> Post Requirement
          </Link>
          <Link href="/legal-form" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
            <FileText className="h-4 w-4" /> Legal
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/rooms/new">
            <Button variant="outline" size="sm" className="hidden sm:flex border-primary text-primary hover:bg-primary/10">
              <PlusCircle className="mr-2 h-4 w-4" /> List Property
            </Button>
          </Link>
          {user && !user.isAnonymous ? (
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="gap-2">
                <LogIn className="h-4 w-4" /> Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
