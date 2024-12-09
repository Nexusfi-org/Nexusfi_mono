"use client";

import { useEffect, useState } from "react";

import localFont from "next/font/local";
import "./globals.css";

import { Navigation } from "@/components/Navigation";
import { IndexFundContract, NetworkId } from "@/config";

import { NearContext, Wallet } from "@/wallets/near";
import { Footer } from "@/components/Footer";

const wallet = new Wallet({
  networkId: NetworkId,
  createAccessKeyFor: IndexFundContract,
});

const giuconda = localFont({
  src: "./fonts/Giuconda Regular.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [signedAccountId, setSignedAccountId] = useState("");

  useEffect(() => {
    wallet.startUp(setSignedAccountId);
  }, []);

  return (
    <html lang="en">
      <body
        className={`${giuconda.variable} antialiased bg-[#fbfbe4] text-[#151515]`}
      >
        <NearContext.Provider value={{ wallet, signedAccountId }}>
          <Navigation />
          {children}
          <Footer />
        </NearContext.Provider>
      </body>
    </html>
  );
}
