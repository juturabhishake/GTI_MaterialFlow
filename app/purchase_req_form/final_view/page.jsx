"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Loader2, FileSpreadsheet, ListFilter, CalendarIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Check, FileText, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { exportToExcel } from "@/components/exportUtils";
import { useAccessCheck } from '@/lib/useAccessCheck';
const FilterPopover = ({ columnKey, title, data, selectedValues, onSelect, onSelectAll, onClear }) => {
    const [open, setOpen] = useState(false);
    const uniqueValues = useMemo(() => {
        const values = data.map(item => String(item[columnKey] || ""));
        return [...new Set(values)].filter(Boolean).sort();
    }, [data, columnKey]);
  
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className={cn("h-6 w-6 p-0 hover:bg-white/20 transition-colors ml-2", selectedValues.length > 0 ? "text-yellow-300 opacity-100" : "opacity-50")}>
                    <ListFilter className="h-3.5 w-3.5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={`Filter ${title}...`} className="h-8 text-xs" />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem onSelect={() => onSelectAll(uniqueValues)} className="justify-center text-xs font-medium cursor-pointer aria-selected:bg-primary/10">Select All</CommandItem>
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup className="max-h-[200px] overflow-auto">
                            {uniqueValues.map((val) => {
                                const isSelected = selectedValues.includes(val);
                                return (
                                    <CommandItem key={val} onSelect={() => onSelect(val)} className="text-xs cursor-pointer">
                                        <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                                            <Check className="h-3 w-3" />
                                        </div>
                                        <span className="truncate">{val}</span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup>
                            <CommandItem onSelect={onClear} className="justify-center text-xs font-medium text-destructive cursor-pointer aria-selected:bg-destructive/10">Clear Filters</CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export default function ReturnedToToolmakingReport() {
    const PAGE_ID_FOR_THIS_FORM = 2035;
    const { isLoading: isAccessLoading, hasAccess } = useAccessCheck(PAGE_ID_FOR_THIS_FORM);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'default' });
    const [columnFilters, setColumnFilters] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [jumpPage, setJumpPage] = useState("1");
    const [dateRange, setDateRange] = useState({ from: subDays(new Date(), 30), to: new Date() });
    const [exportState, setExportState] = useState('idle');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const fetchList = async () => {
        if(!dateRange?.from || !dateRange?.to) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                fromDate: format(dateRange.from, 'yyyy-MM-dd'),
                toDate: format(dateRange.to, 'yyyy-MM-dd')
            });
            const res = await fetch(`/api/purchaserequest/get-returns-report?${params.toString()}`);
            if (res.ok) {
                setData(await res.json());
                setCurrentPage(1);
            }
        } catch (e) { 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchList(); }, [dateRange]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key) {
            if (sortConfig.direction === 'asc') direction = 'desc';
            else if (sortConfig.direction === 'desc') direction = null; 
        }
        setSortConfig({ key: direction ? key : null, direction: direction || 'default' });
    };

    const toggleFilter = (columnKey, value) => {
        setColumnFilters(prev => {
            const current = prev[columnKey] || [];
            if (current.includes(value)) return { ...prev, [columnKey]: current.filter(v => v !== value) };
            return { ...prev, [columnKey]: [...current, value] };
        });
        setCurrentPage(1);
    };
  
    const clearFilter = (columnKey) => {
        setColumnFilters(prev => {
            const newState = { ...prev };
            delete newState[columnKey];
            return newState;
        });
        setCurrentPage(1);
    };
  
    const selectAllFilter = (columnKey, allValues) => {
        setColumnFilters(prev => ({ ...prev, [columnKey]: allValues }));
        setCurrentPage(1);
    };

    const processedData = useMemo(() => {
        let result = [...data];
        Object.keys(columnFilters).forEach(key => {
            const selectedValues = columnFilters[key];
            if (selectedValues && selectedValues.length > 0) {
                result = result.filter(item => selectedValues.includes(String(item[key] || "")));
            }
        });
        if (sortConfig.key !== null) {
            result.sort((a, b) => {
                let valA = String(a[sortConfig.key] || "").toLowerCase();
                let valB = String(b[sortConfig.key] || "").toLowerCase();
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [data, columnFilters, sortConfig]);

    const limit = pageSize === 'All' ? (processedData.length || 1) : Number(pageSize);
    const totalPages = Math.ceil(processedData.length / limit) || 1;
    const paginatedData = processedData.slice((currentPage - 1) * limit, currentPage * limit);

    const handlePageChange = (newPage) => {
        if(newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            setJumpPage(String(newPage));
        }
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 opacity-30 ml-1" />;
        if (sortConfig.direction === 'asc') return <ArrowUp className="w-3 h-3 text-white ml-1" />;
        if (sortConfig.direction === 'desc') return <ArrowDown className="w-3 h-3 text-white ml-1" />;
        return <ArrowUpDown className="w-3 h-3 opacity-30 ml-1" />;
    };

    const handleExportClick = async () => {
        if (processedData.length === 0) return;
        setExportState('loading');
        try {
            await exportToExcel(processedData, "ReturnedToToolmaking_Report"); 
            setExportState('success');
            setTimeout(() => setExportState('idle'), 2000);
        } catch (error) {
            setExportState('error');
            setTimeout(() => setExportState('idle'), 2000);
        }
    };

    const renderVal = (val) => (val === null || val === undefined || val === '') ? '-' : val;

    const columns = [
        { key: 'RequestId', label: 'Request ID', w: 'w-[150px]' },
        { key: 'MaterialCode', label: 'Material Code', w: 'w-[120px]' },
        { key: 'ItemSpecification', label: 'Specification', w: 'min-w-[150px]' },
        { key: 'ProjectName', label: 'Project Name', w: 'w-[150px]' },
        
        { key: 'DemandDate', label: 'Demand Date', w: 'w-[120px]' },
        { key: 'Remarks', label: 'Remarks', w: 'w-[150px]' },
        { key: 'OrderQty', label: 'Order Qty', w: 'w-[100px]' },
        
        { key: 'ReceiverName', label: 'Receiver', w: 'w-[150px]' },
        { key: 'Receiver_remarks', label: 'Receiver Remarks', w: 'w-[150px]' },
        
        { key: 'good_parts_qty', label: 'Rcv Good Parts', w: 'w-[120px]' },
        { key: 'rejected_parts_qty', label: 'Rcv Rejected Parts', w: 'w-[120px]' },
        
        { key: 'Completed_parts_qty', label: 'Completed Qty', w: 'w-[120px]' },
        { key: 'Completed_by_name', label: 'Completed By', w: 'w-[150px]' },
        { key: 'Completed_by_at', label: 'Completed On', w: 'w-[120px]' },
        
        { key: 'Send_by_name', label: 'Sent to Coating By', w: 'w-[150px]' },
        { key: 'Send_at', label: 'Sent On', w: 'w-[120px]' },
        
        { key: 'good_parts_by_coating', label: 'Coating Good Parts', w: 'w-[130px]' },
        { key: 'rejected_parts_by_coating', label: 'Coating Rejected', w: 'w-[130px]' },
        { key: 'comments_by_coating', label: 'Coating Comments', w: 'min-w-[180px]' },
        
        { key: 'Return_to_Toolmaking_by_name', label: 'Returned By', w: 'w-[150px]' },
        { key: 'Return_to_Toolmaking_by_at', label: 'Returned On', w: 'w-[120px]' },
    ];

    return (
        <div className="@container/main flex flex-col h-screen overflow-hidden bg-background space-y-2 font-sans w-full">
            <div className="flex-none flex flex-col md:flex-row items-start md:items-center justify-between bg-card p-4 rounded-lg shadow-sm border border-border gap-4">
                <div>
                    <h1 className="text-xl font-bold text-primary">Final View</h1>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                    <Button 
                        variant={exportState === 'error' ? "destructive" : exportState === 'success' ? "default" : "outline"} 
                        onClick={handleExportClick} 
                        disabled={processedData.length === 0 || exportState === 'loading'}
                        className={cn("w-10 h-10 p-0 transition-all duration-300", exportState === 'success' && "bg-green-600 hover:bg-green-700")}
                    >
                        {exportState === 'idle' && <FileSpreadsheet className="h-5 w-5 text-primary" />}
                        {exportState === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
                        {exportState === 'success' && <Check className="h-5 w-5 text-white" />}
                        {exportState === 'error' && <X className="h-5 w-5 text-white" />}
                    </Button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-[280px] justify-start text-left font-normal border-primary/20", !dateRange && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                {dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</> : format(dateRange.from, "LLL dd, y")) : <span>Pick a date range</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={isMobile ? 1 : 2} />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <Card className="h-full border border-border rounded-md flex flex-col bg-card shadow-sm overflow-hidden">
                    <CardContent className="p-0 flex flex-col h-full">
                        <div className="flex-1 overflow-auto relative scrollbar-thin">
                            <table className="w-full text-xs text-left border-collapse min-w-[2500px]">
                                <thead className="bg-primary text-primary-foreground uppercase font-bold text-[10px] sticky top-0 z-20 shadow-sm">
                                    <tr>
                                        <th className="p-2 border-r border-primary-foreground/20 whitespace-nowrap bg-primary w-10 text-center">#</th>
                                        {columns.map((col) => (
                                            <th key={col.key} className={cn("p-2 border-r border-primary-foreground/20 whitespace-nowrap bg-primary", col.w)}>
                                                <div className="flex items-center justify-between group">
                                                    <div className="flex items-center cursor-pointer hover:text-yellow-200" onClick={() => handleSort(col.key)}>
                                                        {col.label} {getSortIcon(col.key)}
                                                    </div>
                                                    <FilterPopover columnKey={col.key} title={col.label} data={data} selectedValues={columnFilters[col.key] || []} onSelect={(val) => toggleFilter(col.key, val)} onSelectAll={(vals) => selectAllFilter(col.key, vals)} onClear={() => clearFilter(col.key)} />
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={columns.length + 1} className="h-[calc(100vh-240px)] text-center align-middle border-none">
                                                <div className="flex flex-col items-center justify-center h-full w-full">
                                                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : paginatedData.length > 0 ? paginatedData.map((row, i) => (
                                        <tr key={row.Id} className="hover:bg-muted/50 transition-colors group text-[11px]">
                                            <td className="p-2 border-r border-border text-center text-muted-foreground">
                                                {((currentPage - 1) * limit) + i + 1}
                                            </td>
                                            {columns.map(col => (
                                                <td key={col.key} className={cn("p-2 border-r border-border", col.key === 'ItemSpecification' && "max-w-[200px] truncate")} title={row[col.key]}>
                                                    {col.key === 'RequestId' ? `GTI-${new Date(row.ReqDate).getFullYear()}-RG-${row.RequestId}` : 
                                                     ['DemandDate', 'Completed_by_at', 'Send_at', 'Return_to_Toolmaking_by_at'].includes(col.key) && row[col.key] ? (
                                                        format(new Date(row[col.key]), 'dd-MM-yyyy')
                                                    ) : (
                                                        renderVal(row[col.key])
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={columns.length + 1} className="h-[calc(100vh-240px)] text-center align-middle border-none">
                                                <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground">
                                                    <FileText className="h-10 w-10 opacity-20 mb-4" />
                                                    <h3 className="text-lg font-semibold">No records found for the selected date range</h3>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex-none flex flex-col md:flex-row items-center justify-between p-2 border-t border-border bg-muted/20 gap-4">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Show</span>
                                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(v === 'All' ? 'All' : Number(v)); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-7 w-[65px] text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                        <SelectItem value="All">All</SelectItem>
                                    </SelectContent>
                                </Select>
                                <span>rows</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {processedData.length > 0 ? ((currentPage - 1) * limit) + 1 : 0}-
                                {Math.min(currentPage * limit, processedData.length)} of {processedData.length}
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handlePageChange(1)} disabled={currentPage === 1}><ChevronsLeft className="h-3 w-3" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="h-3 w-3" /></Button>
                                <div className="flex items-center gap-1 mx-2">
                                    <span className="text-xs">Page</span>
                                    <Input className="h-7 w-10 text-center text-xs p-0" value={jumpPage} onChange={(e) => setJumpPage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePageChange(parseInt(jumpPage))} />
                                    <span className="text-xs text-muted-foreground">of {totalPages}</span>
                                </div>
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-3 w-3" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages || totalPages === 0}><ChevronsRight className="h-3 w-3" /></Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}