'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subMonths } from "date-fns";
import DataTable from './DataTable';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAdminAccessCheck } from '@/lib/checkAdmin';

const summaryColumns = [
    { key: 'FormattedRequestId', label: 'Request ID', filterable: true, hidden: false },
    { key: 'TotalOrderQty', label: 'Total Order Qty', filterable: true, hidden: false },
    { key: 'DemandDate', label: 'Demand Date', filterable: true, hidden: false },
];

export default function PurchaseRequestSummary({ onViewDetails, onCreateNew }) {
    const PAGE_ID_FOR_THIS_FORM = 8;
    const { hasAccess: isAdmin, isLoading: accessLoading } = useAdminAccessCheck(PAGE_ID_FOR_THIS_FORM);
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [dateRange, setDateRange] = useState({
        from: subMonths(new Date(), 1),
        to: new Date(),
    });
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile(); 
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    const fetchSummary = useCallback(async (start, end) => {
        if (!start || !end) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/purchaserequest/summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    startDate: format(start, 'yyyy-MM-dd'), 
                    endDate: format(end, 'yyyy-MM-dd') 
                })
            });
            
            if (!res.ok) throw new Error('Failed to fetch');
            
            const result = await res.json();
            const formatted = result.map(row => ({
                ...row,
                FormattedRequestId: `GTI-${new Date(row.ReqDate).getFullYear()}-RG-${row.RequestId}`,
                DemandDate: row.DemandDate ? format(new Date(row.DemandDate), 'dd-MMM-yyyy') : '-',
            }));
            setData(formatted);
        } catch (error) {
            toast.error("Failed to load summary data.");
            setData([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSummary(dateRange.from, dateRange.to);
    }, []); 

    const handleApplyFilter = () => {
        if (dateRange?.from && dateRange?.to) {
            fetchSummary(dateRange.from, dateRange.to);
        } else {
            toast.warning("Please select both Start and End dates.");
        }
    };

    const handleResetFilter = () => {
        const defaultFrom = subMonths(new Date(), 1);
        const defaultTo = new Date();
        setDateRange({ from: defaultFrom, to: defaultTo });
        fetchSummary(defaultFrom, defaultTo);
    };

    return (
        <div className="@container/main flex flex-col h-full space-y-4 p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-brand-500 whitespace-nowrap">Purchase Requests</h1>
                
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-[260px] justify-start text-left font-normal cursor-pointer",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                            {format(dateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={isMobile ? 1 : 2}
                            />
                            <div className="p-3 border-t flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={handleResetFilter}>Reset</Button>
                                <Button size="sm" onClick={handleApplyFilter}>Apply</Button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Button onClick={onCreateNew} className="cursor-pointer">
                        <Plus className="mr-2 h-4 w-4" /> New Request
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : (
                <DataTable 
                    columns={summaryColumns} 
                    data={data} 
                    onRowClick={(row) => onViewDetails(row)} 
                />
            )}
        </div>
    );
}