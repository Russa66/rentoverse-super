
"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Wifi, Zap, Wind, Train } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { RoomListing } from "@/lib/mock-data";

export default function RoomCard({ room }: { room: RoomListing }) {
  return (
    <Link href={`/rooms/${room.id}`}>
      <Card className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col bg-card">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={room.photos[0]}
            alt={room.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            {room.acAvailable && (
              <Badge className="bg-secondary text-secondary-foreground flex items-center gap-1 border-none">
                <Wind className="h-3 w-3" /> AC
              </Badge>
            )}
            {room.wifiAvailable && (
              <Badge className="bg-primary/90 text-primary-foreground flex items-center gap-1 border-none">
                <Wifi className="h-3 w-3" /> WiFi
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-4 flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-headline font-bold text-lg leading-tight group-hover:text-primary transition-colors">
              {room.title}
            </h3>
          </div>
          <div className="flex items-center text-muted-foreground text-xs gap-1 mb-2">
            <MapPin className="h-3 w-3 shrink-0 text-destructive" />
            <span className="truncate">{room.location}</span>
          </div>
          <div className="flex items-center text-muted-foreground text-xs gap-1 mb-4">
            <Train className="h-3 w-3 shrink-0 text-primary" />
            <span className="truncate">{room.nearestCommunication}</span>
          </div>
          <div className="flex gap-3 text-muted-foreground">
             {room.inverterAvailable && <Zap className="h-4 w-4 text-secondary shrink-0" title="Power Backup" />}
             <span className="text-xs">{room.waterSupplyCondition}</span>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex items-center justify-between border-t mt-auto bg-muted/20">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Per Month</span>
            <span className="text-xl font-bold text-primary font-headline">{room.monthlyRent}</span>
          </div>
          <Badge variant="outline" className="border-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            View Details
          </Badge>
        </CardFooter>
      </Card>
    </Link>
  );
}
