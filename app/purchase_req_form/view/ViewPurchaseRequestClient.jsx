'use client';
import React, { useState } from 'react';
import PurchaseRequestSummary from './PurchaseRequestSummary';
import PurchaseRequestDetail from './PurchaseRequestDetail';

export default function ViewPurchaseRequestClient() {
    const [viewMode, setViewMode] = useState('summary'); 
    const [selectedRequest, setSelectedRequest] = useState(null);

    const handleViewDetails = (request) => {
        setSelectedRequest(request);
        setViewMode('detail');
    };

    const handleCreateNew = () => {
        // setSelectedRequest(null);
        // setViewMode('detail');
        window.location.href = '/purchase_req_form/';
    };

    const handleBack = () => {
        setViewMode('summary');
        setSelectedRequest(null);
    };

    return (
        <div className="@container/main bg-card border rounded-xl shadow-lg h-full overflow-hidden">
            {viewMode === 'summary' ? (
                <PurchaseRequestSummary 
                    onViewDetails={handleViewDetails} 
                    onCreateNew={handleCreateNew} 
                />
            ) : (
                <PurchaseRequestDetail 
                    request={selectedRequest} 
                    onBack={handleBack} 
                />
            )}
        </div>
    );
}