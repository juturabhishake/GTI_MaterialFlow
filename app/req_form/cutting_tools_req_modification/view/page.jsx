import React, { Suspense } from 'react';
// import type { Metadata } from "next";
import CuttingToolsViewPage from './cutting_tool_req';

export const metadata = {
  title: "Cutting Tools Request Modification | GreenTech Industries",
  description: "Entry page for Cutting Tools Request Modification Screen.",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <CuttingToolsViewPage />
    </Suspense>
  );
}