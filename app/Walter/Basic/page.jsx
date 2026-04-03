import React, { Suspense } from 'react';
// import type { Metadata } from "next";
import BasicPage from './basicPage';

export const metadata = {
  title: "Walter Basic | GreenTech Industries",
  description: "Entry page for Walter Basic Screen.",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <BasicPage />
    </Suspense>
  );
}