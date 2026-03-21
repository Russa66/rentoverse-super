"use client";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, ShieldCheck, Download, Printer, CheckCircle2 } from "lucide-react";

export default function LegalFormPage() {
  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <Navbar />
      <div className="container max-w-4xl px-4 py-12 mx-auto">
        <div className="text-center mb-10">
          <div className="bg-primary/10 inline-flex p-3 rounded-full mb-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-headline font-bold mb-4">Rental Agreement Template</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Use this verified legal form to build trust between landlords and renters. Comply with local regulations and secure your deal.
          </p>
        </div>

        <Card className="border-none shadow-2xl bg-white overflow-hidden">
          <div className="bg-primary h-2 w-full" />
          <CardHeader className="p-10 pb-6 text-center">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <span className="font-headline font-bold text-xl uppercase tracking-tighter">RentiPedia Legal</span>
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Standard Form #RP-2024-V1</div>
            </div>
            <CardTitle className="text-3xl font-headline mb-2 underline decoration-primary decoration-4 underline-offset-8">Room Rental Agreement</CardTitle>
          </CardHeader>
          <CardContent className="p-10 pt-0 space-y-8 text-sm md:text-base leading-relaxed text-gray-800">
             <section className="space-y-4">
               <h3 className="font-bold text-lg uppercase tracking-tight text-primary">1. Parties</h3>
               <p>This agreement is made between <span className="border-b-2 border-dashed border-gray-300 px-10 inline-block min-w-[200px]"></span> (the "Landlord") and <span className="border-b-2 border-dashed border-gray-300 px-10 inline-block min-w-[200px]"></span> (the "Tenant").</p>
             </section>

             <section className="space-y-4">
               <h3 className="font-bold text-lg uppercase tracking-tight text-primary">2. Property</h3>
               <p>The Landlord agrees to rent the room located at: <span className="border-b-2 border-dashed border-gray-300 block mt-2 h-8"></span></p>
             </section>

             <section className="space-y-4">
               <h3 className="font-bold text-lg uppercase tracking-tight text-primary">3. Term and Rent</h3>
               <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <p className="mb-2 font-semibold">Lease Period Start:</p>
                    <div className="border-b-2 border-dashed border-gray-300 h-8"></div>
                  </div>
                  <div>
                    <p className="mb-2 font-semibold">Monthly Rent Amount:</p>
                    <div className="border-b-2 border-dashed border-gray-300 h-8"></div>
                  </div>
               </div>
             </section>

             <section className="space-y-4">
               <h3 className="font-bold text-lg uppercase tracking-tight text-primary">4. Terms & Conditions</h3>
               <ul className="list-none space-y-3">
                 {[
                   "Rent must be paid by the 5th of every month.",
                   "A security deposit equivalent to one month's rent is required.",
                   "Tenant is responsible for keeping the premises clean and undamaged.",
                   "No unauthorized alterations or pets allowed without Landlord's consent.",
                   "30 days notice period is mandatory for termination by either party."
                 ].map((clause, idx) => (
                   <li key={idx} className="flex items-start gap-3">
                     <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                     <span>{clause}</span>
                   </li>
                 ))}
               </ul>
             </section>

             <div className="pt-16 grid grid-cols-2 gap-20">
                <div className="text-center">
                  <div className="h-16 border-b-2 border-gray-300"></div>
                  <p className="mt-4 font-bold">Landlord Signature</p>
                  <p className="text-xs text-muted-foreground">Date: ___/___/2024</p>
                </div>
                <div className="text-center">
                  <div className="h-16 border-b-2 border-gray-300"></div>
                  <p className="mt-4 font-bold">Tenant Signature</p>
                  <p className="text-xs text-muted-foreground">Date: ___/___/2024</p>
                </div>
             </div>
          </CardContent>
          <div className="bg-muted p-6 flex flex-wrap gap-4 justify-center md:justify-end">
            <Button variant="outline" className="bg-white hover:bg-white/90">
              <Printer className="mr-2 h-4 w-4" /> Print Document
            </Button>
            <Button className="bg-primary text-primary-foreground font-headline">
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
