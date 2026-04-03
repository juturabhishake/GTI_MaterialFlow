import React, { Suspense } from 'react';
// import type { Metadata } from "next";
import MasterPage from './MasterPage';

export const metadata = {
  title: "Walter Master | GreenTech Industries",
  description: "Entry page for Walter Master Screen.",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <MasterPage />
    </Suspense>
  );
}