"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Wifi, Wind, Train, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { RoomListing } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export default function RoomCard({ room }: { room: RoomListing }) {
  return (
    <Link href={`/rooms/${room.id}`}>
      <Card className="group overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col bg-card rounded-2xl">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={room.photos[0]}
            alt={room.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {room.idealFor && (
              <Badge className="bg-white text-primary border-primary flex items-center gap-1 font-bold shadow-sm">
                <Users className="h-3 w-3" /> {room.idealFor}
              </Badge>
            )}
            {room.acAvailable && (
              <Badge className="bg-secondary text-secondary-foreground flex items-center gap-1 border-none font-bold">
                AC
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-5 flex-1 space-y-3">
          <h3 className="font-headline font-bold text-xl leading-tight group-hover:text-primary transition-colors">
            {room.title}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center text-muted-foreground text-sm gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-destructive" />
              <span className="truncate">{room.location}</span>
            </div>
            <div className="flex items-center text-muted-foreground text-sm gap-2">
              <Train className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{room.nearestCommunication}</span>
            </div>
            <div className="flex items-center text-muted-foreground text-sm gap-2">
              <span className="font-semibold text-primary">24/7 Water Supply</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-5 pt-0 flex items-center justify-between border-t border-gray-50 mt-auto bg-gray-50/30">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Monthly Rent</span>
            <span className="text-2xl font-bold text-primary font-headline">{room.monthlyRent}</span>
          </div>
          <Button variant="outline" className="rounded-full border-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors font-bold h-9">
            View Details
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
