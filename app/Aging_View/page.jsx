"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Loader2, FileSpreadsheet, ListFilter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Check, FileText, X, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { exportToExcel } from "@/components/exportUtils";

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

export default function AgingView() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'default' });
    const [columnFilters, setColumnFilters] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [jumpPage, setJumpPage] = useState("1");
    const [exportState, setExportState] = useState('idle');
    const [warehouseOptions, setWarehouseOptions] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState("All");
    const [warehouseOpen, setWarehouseOpen] = useState(false);

    useEffect(() => {
        const fetchWarehouses = async () => {
            try {
                const res = await fetch(`/api/warehouses/get`);
                if (res.ok) {
                    const data = await res.json();
                    setWarehouseOptions(data);
                }
            } catch (e) {}
        };
        fetchWarehouses();
    }, []);

    const fetchList = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ warehouse: selectedWarehouse });
            const res = await fetch(`/api/warehouses/aging-view?${params.toString()}`);
            if (res.ok) {
                setData(await res.json());
                setCurrentPage(1);
            }
        } catch (e) { 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchList(); }, [selectedWarehouse]);

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

    const totalItems = processedData.length;
    const totalPages = pageSize === 'All' ? 1 : Math.ceil(totalItems / pageSize) || 1;
    const paginatedData = pageSize === 'All' ? processedData : processedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
            await exportToExcel(processedData, "AgingView"); 
            setExportState('success');
            setTimeout(() => setExportState('idle'), 2000);
        } catch (error) {
            setExportState('error');
            setTimeout(() => setExportState('idle'), 2000);
        }
    };

    const renderVal = (val) => (val === null || val === undefined || val === '') ? '-' : val;

    const columns = [
        { key: 'ItemCode', label: 'Item Code', w: 'w-[120px]' },
        { key: 'ItemDesc', label: 'Description', w: 'min-w-[250px]' },
        { key: 'Warehouse', label: 'Warehouse', w: 'w-[100px]' },
        { key: 'Receipt', label: 'Receipt', w: 'w-[100px]' },
        { key: 'Last 90 days Consumption', label: 'Last 90 days Cons.', w: 'w-[150px]' },
        { key: '0-90 Days', label: '0-90 Days', w: 'w-[100px]' },
        { key: '91-180 Days', label: '91-180 Days', w: 'w-[100px]' },
        { key: '181-365 Days', label: '181-365 Days', w: 'w-[120px]' },
        { key: '>365 Days', label: '>365 Days', w: 'w-[100px]' },
        { key: 'TotalStock', label: 'Total Stock', w: 'w-[100px]' }
    ];

    const displayWarehouseText = selectedWarehouse === "All" ? "All Warehouses" : selectedWarehouse;

    return (
        <div className="@container/main flex flex-col h-screen overflow-hidden bg-background space-y-2 font-sans w-full">
            <div className="flex-none flex flex-col md:flex-row items-start md:items-center justify-between bg-card p-4 rounded-lg shadow-sm border border-border gap-4">
                <div>
                    <h1 className="text-xl font-bold text-primary">Aging View</h1>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                    <Button 
                        variant={exportState === 'error' ? "destructive" : exportState === 'success' ? "default" : "outline"} 
                        onClick={handleExportClick} 
                        disabled={processedData.length === 0 || exportState === 'loading'}
                        className={cn("w-10 h-10 p-0 transition-all duration-300 cursor-pointer", exportState === 'success' && "bg-green-600 hover:bg-green-700")}
                    >
                        {exportState === 'idle' && <FileSpreadsheet className="h-5 w-5 text-primary" />}
                        {exportState === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
                        {exportState === 'success' && <Check className="h-5 w-5 text-white" />}
                        {exportState === 'error' && <X className="h-5 w-5 text-white" />}
                    </Button>
                    <Popover open={warehouseOpen} onOpenChange={setWarehouseOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-[280px] justify-start text-left font-normal border-primary/20 cursor-pointer">
                                <Building2 className="mr-2 h-4 w-4 text-primary" />
                                <span className="truncate">{displayWarehouseText}</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0" align="end">
                            <Command>
                                <CommandInput placeholder="Search warehouse..." className="h-9" />
                                <CommandList>
                                    <CommandEmpty>No warehouse found.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem onSelect={() => { setSelectedWarehouse("All"); setWarehouseOpen(false); }} className="cursor-pointer">
                                            <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", selectedWarehouse === "All" ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                                                <Check className="h-3 w-3" />
                                            </div>
                                            All Warehouses
                                        </CommandItem>
                                    </CommandGroup>
                                    <CommandSeparator />
                                    <CommandGroup className="max-h-[200px] overflow-auto">
                                        {warehouseOptions.map((wh) => {
                                            const isSelected = selectedWarehouse === wh;
                                            return (
                                                <CommandItem key={wh} onSelect={() => { setSelectedWarehouse(wh); setWarehouseOpen(false); }} className="cursor-pointer">
                                                    <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                                                        <Check className="h-3 w-3" />
                                                    </div>
                                                    {wh}
                                                </CommandItem>
                                            );
                                        })}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <Card className="h-full border border-border rounded-md flex flex-col bg-card shadow-sm overflow-hidden">
                    <CardContent className="p-0 flex flex-col h-full">
                        <div className="flex-1 overflow-auto relative scrollbar-thin">
                            <table className="w-full text-xs text-left border-collapse min-w-[1000px]">
                                <thead className="bg-primary text-primary-foreground uppercase font-bold text-[10px] sticky top-0 z-20 shadow-sm">
                                    <tr>
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
                                            <td colSpan={columns.length} className="h-[calc(100vh-240px)] text-center align-middle border-none">
                                                <div className="flex flex-col items-center justify-center h-full w-full">
                                                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : paginatedData.length > 0 ? paginatedData.map((row, i) => (
                                        <tr key={i} className="hover:bg-muted/50 transition-colors group text-[11px]">
                                            {columns.map(col => (
                                                <td key={col.key} className={cn("p-2 border-r border-border", col.key === 'ItemDesc' && "max-w-[250px] truncate")} title={row[col.key]}>
                                                    {renderVal(row[col.key])}
                                                </td>
                                            ))}
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={columns.length} className="h-[calc(100vh-240px)] text-center align-middle border-none">
                                                <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground">
                                                    <FileText className="h-10 w-10 opacity-20 mb-4" />
                                                    <h3 className="text-lg font-semibold">No records found</h3>
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
                                    <SelectTrigger className="h-7 w-[65px] text-xs cursor-pointer"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="All">All</SelectItem>
                                    </SelectContent>
                                </Select>
                                <span>rows</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => handlePageChange(1)} disabled={currentPage === 1}><ChevronsLeft className="h-3 w-3" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="h-3 w-3" /></Button>
                                <div className="flex items-center gap-1 mx-2">
                                    <span className="text-xs">Page</span>
                                    <Input className="h-7 w-10 text-center text-xs p-0" value={jumpPage} onChange={(e) => setJumpPage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePageChange(parseInt(jumpPage))} />
                                    <span className="text-xs text-muted-foreground">of {totalPages}</span>
                                </div>
                                <Button variant="outline" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-3 w-3" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}><ChevronsRight className="h-3 w-3" /></Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}