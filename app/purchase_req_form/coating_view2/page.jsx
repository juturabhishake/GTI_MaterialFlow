import React, { Suspense } from 'react';
// import type { Metadata } from "next";
import ViewPurchaseRequestClient from './ViewPurchaseRequestClient';

export const metadata = {
  title: "Purchase Request | GreenTech Industries",
  description: "Entry page for View Purchase Request Screen.",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <ViewPurchaseRequestClient />
    </Suspense>
  );
}