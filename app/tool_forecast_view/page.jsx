"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Loader2, Search, X, ChevronsUpDown, Check, FileText, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileSpreadsheet, ArrowUpDown, ArrowUp, ArrowDown, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { exportToExcel } from "@/components/exportUtils"; 
import { useAccessCheck } from '@/lib/useAccessCheck';

const ColumnFilterPopover = ({ options, selected = [], onSelectedChange, title }) => {
    const [open, setOpen] = useState(false);
    const safeSelected = Array.isArray(selected) ? selected : []; 
    const handleSelect = (val) => onSelectedChange(safeSelected.includes(val) ? safeSelected.filter(i => i !== val) : [...safeSelected, val]);
    
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("h-6 w-6 p-0 ml-2 hover:bg-white/20 transition-colors cursor-pointer", safeSelected.length > 0 ? "text-yellow-300 opacity-100" : "opacity-50")}>
                    <Filter className="h-3 w-3" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={`Filter ${title}...`} className="h-8 text-xs" />
                    <CommandList>
                        <CommandEmpty>No results.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem onSelect={() => onSelectedChange([])} className="justify-center text-xs font-medium text-destructive cursor-pointer aria-selected:bg-destructive/10">Clear Filter</CommandItem>
                            {options.map(o => (
                                <CommandItem key={o.value} value={o.value} onSelect={() => handleSelect(o.value)} className="text-xs cursor-pointer">
                                    <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", safeSelected.includes(o.value) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                                        <Check className="h-3 w-3" />
                                    </div>
                                    <span className="truncate">{o.label}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export default function ToolForecastView() {
    const PAGE_ID_FOR_THIS_FORM = 2037;
    const { isLoading: isAccessLoading, hasAccess } = useAccessCheck(PAGE_ID_FOR_THIS_FORM);
    const [dateVal, setDateVal] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [globalSearch, setGlobalSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [tableColumnFilters, setTableColumnFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const [exportState, setExportState] = useState('idle');

    useEffect(() => {
        const timer = setTimeout(() => setGlobalSearch(searchInput), 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        fetchData();
    }, [dateVal]);

    const fetchData = async () => {
        if (!dateVal) return;
        setLoading(true);
        const [year, month] = dateVal.split('-');
        try {
            const res = await fetch("/api/tool-forecast/get-by-tool", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ month, year })
            });
            const json = await res.json();
            
            if (Array.isArray(json)) {
                setData(json);
            } else {
                setData([]);
                toast.error(json.error || "Invalid data format received");
            }
            
            setTableColumnFilters({});
            setSortConfig({ key: null, direction: null });
            setPage(1);
        } catch (e) {
            setData([]);
            toast.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    const getMonthHeader = (offset) => {
        if (!dateVal) return "";
        const [year, month] = dateVal.split('-');
        const d = new Date(parseInt(year), parseInt(month) - 1 + offset, 1);
        return d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    };

    const processedData = useMemo(() => {
        if (!Array.isArray(data)) return [];
        
        let result = [...data];

        if (globalSearch) {
            const lowerSearch = globalSearch.toLowerCase();
            result = result.filter(item => 
                Object.values(item).some(val => 
                    String(val || "").toLowerCase().includes(lowerSearch)
                )
            );
        }

        Object.keys(tableColumnFilters).forEach(key => {
            const selectedVals = tableColumnFilters[key];
            if (selectedVals && selectedVals.length > 0) {
                result = result.filter(item => selectedVals.includes(String(item[key] || "")));
            }
        });

        if (sortConfig.key && sortConfig.direction) {
            result.sort((a, b) => {
                let valA = a[sortConfig.key];
                let valB = b[sortConfig.key];
                if (valA === null || valA === undefined) valA = "";
                if (valB === null || valB === undefined) valB = "";
                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();
                if (valA < valB) return sortConfig.direction === 'ASC' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ASC' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [data, globalSearch, tableColumnFilters, sortConfig]);

    const handleExportClick = async () => {
        if (processedData.length === 0) return;
        setExportState('loading');
        try {
            await exportToExcel(processedData, "Tool_Forecast_Report"); 
            setExportState('success');
            setTimeout(() => setExportState('idle'), 2000);
        } catch (error) {
            setExportState('error');
            toast.error("Export failed");
            setTimeout(() => setExportState('idle'), 2000);
        }
    };

    const handleSort = (key) => {
        setSortConfig((current) => {
            if (current.key === key) {
                if (current.direction === 'ASC') return { key, direction: 'DESC' };
                if (current.direction === 'DESC') return { key: null, direction: null };
            }
            return { key, direction: 'ASC' };
        });
        setPage(1);
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key || !sortConfig.direction) return <ArrowUpDown className="h-3 w-3 opacity-30 ml-1" />;
        if (sortConfig.direction === 'ASC') return <ArrowUp className="h-3 w-3 ml-1" />;
        return <ArrowDown className="h-3 w-3 ml-1" />;
    };

    const getUniqueOptions = (key) => {
        if (!Array.isArray(data) || data.length === 0) return [];
        const uniqueValues = Array.from(
            new Set(data.map(item => item[key]))
        ).filter(v => v !== null && v !== undefined && v !== '');
        return uniqueValues
            .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))
            .map(v => ({ label: String(v), value: String(v) }));
    };

    const totalRecords = processedData.length;
    const totalPages = pageSize === 'All' ? 1 : Math.ceil(totalRecords / pageSize);
    const currentLimit = pageSize === 'All' ? totalRecords : pageSize;
    const paginatedData = pageSize === 'All' ? processedData : processedData.slice((page - 1) * pageSize, page * pageSize);

    const columns = [
        { key: 'Tool_Code', label: 'Tool Code' },
        { key: 'Tool_Desc', label: 'Description' },
        { key: 'StockQty', label: 'Stock Qty' },
        { key: 'RegroundSTKQty', label: 'Reground STK' },
        { key: 'OrderedQty', label: 'Ordered Qty' },
        { key: 'RegroundORDQty', label: 'Reground ORD QTY' },
        { key: 'A', label: getMonthHeader(0) },
        { key: 'B', label: getMonthHeader(1) },
        { key: 'C', label: getMonthHeader(2) },
        { key: 'D', label: getMonthHeader(3) },
        { key: 'E', label: getMonthHeader(4) },
        { key: 'F', label: getMonthHeader(5) },
        { key: 'Total', label: 'Total' },
    ];

    return (
        <div className="@container/main flex flex-col h-screen overflow-hidden bg-background space-y-2 font-sans w-full">
            <div className="flex-none flex flex-col md:flex-row items-start md:items-center justify-between bg-card p-4 rounded-lg shadow-sm border border-border gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-primary">Tool Forecast Data</h1>
                    <div className="bg-muted/50 p-1.5 rounded-md border flex items-center">
                        <input 
                            type="month" 
                            value={dateVal} 
                            onChange={(e) => setDateVal(e.target.value)} 
                            className="bg-transparent border-none text-sm font-medium outline-none cursor-pointer"
                        />
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                    <div className="relative w-full md:w-[250px]">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Global search..." value={searchInput} onChange={e => setSearchInput(e.target.value)} className="pl-9 h-10 w-full" />
                    </div>
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
                </div>
            </div>

            <div className="flex-1 min-h-0 bg-card border border-border rounded-lg shadow-sm flex flex-col">
                <div className="flex-1 overflow-auto relative scrollbar-thin">
                    <table className="w-full text-xs text-left border-collapse min-w-[1400px]">
                        <thead className="bg-primary text-primary-foreground uppercase font-bold text-[10px] sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-3 w-12 text-center border-r border-primary-foreground/20 bg-primary">#</th>
                                {columns.map((col) => (
                                    <th key={col.key} className="p-3 border-r border-primary-foreground/20 bg-primary">
                                        <div className="flex items-center justify-between group">
                                            <div className="flex items-center cursor-pointer select-none hover:text-yellow-200" onClick={() => handleSort(col.key)}>
                                                {col.label} {getSortIcon(col.key)}
                                            </div>
                                            <ColumnFilterPopover 
                                                options={getUniqueOptions(col.key)} 
                                                selected={tableColumnFilters[col.key]} 
                                                onSelectedChange={(v) => {
                                                    setTableColumnFilters(p => ({ ...p, [col.key]: v }));
                                                    setPage(1);
                                                }} 
                                                title={col.label} 
                                            />
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={columns.length + 1} className="h-[calc(100vh-250px)] text-center align-middle"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></td></tr>
                            ) : paginatedData.length > 0 ? paginatedData.map((row, i) => (
                                <tr key={i} className="hover:bg-muted/50 transition-colors">
                                    <td className="p-2 border-r text-center text-muted-foreground">{((page - 1) * currentLimit) + i + 1}</td>
                                    {/* {columns.map(col => (
                                        <td key={col.key} className={cn("p-2 border-r", col.key === 'Tool_Desc' && "max-w-[200px] truncate")} title={row[col.key]}>
                                            {row[col.key] ?? "-"}
                                        </td>
                                    ))} */}
                                    {columns.map(col => {
                                        let value = row[col.key];
                                        if (['A', 'B', 'C', 'D', 'E', 'F', 'Total'].includes(col.key)) {
                                            const num = parseFloat(value);
                                            value = !isNaN(num) ? num.toFixed(1) : "0.0";
                                        }
                                    
                                        return (
                                            <td 
                                                key={col.key} 
                                                className={cn(
                                                    "p-2 border-r", 
                                                    col.key === 'Tool_Desc' && "max-w-[200px] truncate",
                                                    ['A', 'B', 'C', 'D', 'E', 'F', 'Total', 'StockQty', 'RegroundSTKQty', 'OrderedQty', 'RegroundORDQty'].includes(col.key) && "text-right"
                                                )} 
                                                title={row[col.key]}
                                            >
                                                {value ?? "-"}
                                            </td>
                                        );
                                    })}
                                </tr>
                            )) : (
                                <tr><td colSpan={columns.length + 1} className="h-[calc(100vh-250px)] text-center text-muted-foreground align-middle"><FileText className="h-10 w-10 opacity-20 mx-auto mb-2" />No records found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className="flex-none p-3 border-t bg-muted/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <span>Show</span>
                        <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(v === 'All' ? 'All' : Number(v)); setPage(1); }}>
                            <SelectTrigger className="h-7 w-[70px] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                                <SelectItem value="All">All</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>{processedData.length === 0 ? 0 : ((page - 1) * currentLimit) + 1}-{Math.min(page * currentLimit, totalRecords)} of {totalRecords}</div>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(1)} disabled={page === 1}><ChevronsLeft className="h-3 w-3" /></Button>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(p => p - 1)} disabled={page === 1}><ChevronLeft className="h-3 w-3" /></Button>
                        <span className="px-2">Page {page} of {totalPages || 1}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(p => p + 1)} disabled={page === totalPages || totalPages === 0}><ChevronRight className="h-3 w-3" /></Button>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(totalPages)} disabled={page === totalPages || totalPages === 0}><ChevronsRight className="h-3 w-3" /></Button>
                    </div>
                </div>
            </div>
        </div>
    );
}