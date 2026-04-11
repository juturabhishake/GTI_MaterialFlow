"use client";
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, ArrowUp, ArrowDown, ArrowUpDown, Loader2, ChevronLeft, ChevronRight, Check, Filter, X } from 'lucide-react';
import { format, subDays } from "date-fns";
import { toast } from 'sonner';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';
import CuttingToolEditForm from './CuttingToolEditForm';
import { useAccessCheck } from '@/lib/useAccessCheck';
const allColumns = [
    { key: 'Id', label: 'ID', filterable: true, width: '80px' },
    { key: 'RequestDate', label: 'DATE', filterable: true, width: '120px' },
    { key: 'RequestSection', label: 'SECTION', filterable: true, width: '150px' },
    { key: 'RequestedBy', label: 'REQUESTED BY', filterable: true, width: '180px' },
    { key: 'ReceivedQty', label: 'RECEIVED QTY', filterable: true, width: '100px' },
    { key: 'CheckedBy', label: 'CHECKED BY', filterable: true, width: '150px' },
    { key: 'ReceivedBy', label: 'RECEIVED BY', filterable: true, width: '150px' },
    { key: 'From_ItemCode', label: 'FROM ITEM', filterable: true, width: '150px' },
    { key: 'To_ItemCode', label: 'TO ITEM', filterable: true, width: '150px' },
    { key: 'Reason', label: 'REASON', filterable: true, width: 'auto' },
    { key: 'isHOSApproved', label: 'HOS APP.', filterable: true, width: '100px' },
    { key: 'isReceiverApproved', label: 'REC APP.', filterable: true, width: '100px' },
];

const FilterColumn = ({ column, data, columnFilters, setColumnFilters }) => {
    const [open, setOpen] = useState(false);

    const options = useMemo(() => {
        const values = new Set(data.map(item => {
            if (column.key === 'RequestDate') return format(new Date(item[column.key]), 'dd-MMM-yyyy');
            if (column.key === 'isHOSApproved' || column.key === 'isReceiverApproved') {
                return item[column.key] ? 'Approved' : 'Pending';
            }
            return String(item[column.key] || '');
        }));
        return Array.from(values).filter(Boolean).sort().map(val => ({
            label: val,
            value: val
        }));
    }, [data, column.key]);

    const selected = columnFilters[column.key] || [];

    const handleSelect = (value) => {
        const newSelected = selected.includes(value)
            ? selected.filter(item => item !== value)
            : [...selected, value];
        setColumnFilters(prev => ({ ...prev, [column.key]: newSelected }));
    };

    const handleSelectAll = () => {
        setColumnFilters(prev => ({ ...prev, [column.key]: options.map(opt => opt.value) }));
    };

    const handleClear = () => {
        setColumnFilters(prev => ({ ...prev, [column.key]: [] }));
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                        "h-6 w-6 ml-1 hover:bg-muted", 
                        selected.length > 0 ? "text-primary hover:text-primary/90" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Filter size={12} className={selected.length > 0 ? "fill-current" : ""} />
                </Button>
            </PopoverTrigger>
            
            <PopoverContent className="w-[250px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={`Filter ${column.label}...`} />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            <div className='flex flex-row justify-between gap-2 items-center px-2 py-1.5 border-b bg-muted/30'>
                                <CommandItem 
                                    onSelect={() => handleSelectAll()} 
                                    className="font-medium cursor-pointer flex-1 justify-center aria-selected:bg-primary/10"
                                >
                                    Select All
                                </CommandItem>
                                <CommandItem 
                                    onSelect={() => handleClear()} 
                                    className="font-medium cursor-pointer p-2 aria-selected:bg-destructive/10"
                                >
                                    <X className="h-4 w-4 text-destructive" />
                                </CommandItem>
                            </div>

                            <div className="max-h-[200px] overflow-y-auto">
                                {options.map((option) => {
                                    const isSelected = selected.includes(option.value);
                                    return (
                                        <CommandItem 
                                            key={option.value}
                                            value={option.value} 
                                            onSelect={() => handleSelect(option.value)}
                                            className="cursor-pointer"
                                        >
                                            <div className={cn(
                                                "mr-2 flex h-4 w-4 items-center justify-center rounded border border-primary/50",
                                                isSelected ? "bg-primary border-primary" : "opacity-50"
                                            )}>
                                                {isSelected && 
                                                    <Check className="h-3 w-3 text-primary-foreground" />
                                                }
                                            </div>
                                            <span>{option.label}</span>
                                        </CommandItem>
                                    );
                                })}
                            </div>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export default function CuttingToolsViewPage() {
    const PAGE_ID_FOR_THIS_FORM = 2032;
    const { isLoading: isAccessLoading, hasAccess } = useAccessCheck(PAGE_ID_FOR_THIS_FORM);
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState('table');
    const [editingItem, setEditingItem] = useState(null);
    const [dateRange, setDateRange] = useState({ from: subDays(new Date(), 30), to: new Date() });
    
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    
    const [pagination, setPagination] = useState({ currentPage: 1, rowsPerPage: 20 });
    const [pageInputValue, setPageInputValue] = useState(1);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/cutting-tools/view/get', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dateRange })
            });
            if (res.ok) {
                const result = await res.json();
                setData(result);
                console.log("Fetched data:", result);
                setPagination(p => ({ ...p, currentPage: 1 }));
                setPageInputValue(1);
            }
        } catch (error) { toast.error("Failed to load data"); } finally { setIsLoading(false); }
    }, [dateRange]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleUpdate = async (item) => {
        try {
            const res = await fetch('/api/cutting-tools/view/update', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
            if (!res.ok) throw new Error("Update failed");
            toast.success("Updated Successfully");
            setViewMode('table');
            fetchData();
        } catch (e) { toast.error(e.message); }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
            const res = await fetch(`/api/cutting-tools/view/delete?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Delete failed");
            toast.success("Deleted Successfully");
            setViewMode('table');
            fetchData();
        } catch (e) { toast.error(e.message); }
    };

    const handleSort = (key) => {
        setSortConfig(current => {
            if (current.key !== key) return { key, direction: 'asc' };
            if (current.direction === 'asc') return { key, direction: 'desc' };
            return { key: null, direction: null };
        });
    };

    const processedData = useMemo(() => {
        let filtered = [...data];

        if (globalFilter) {
            const lowerFilter = globalFilter.toLowerCase();
            filtered = filtered.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(lowerFilter)));
        }

        Object.keys(columnFilters).forEach(key => {
            if (columnFilters[key]?.length > 0) {
                filtered = filtered.filter(item => {
                    let val = item[key];
                    // if (key === 'RequestDate') val = format(new Date(val), 'dd-MMM-yyyy');
                    if (key === 'RequestDate') {
                        val = format(new Date(val), 'dd-MMM-yyyy');
                    }
                    else if (key === 'isHOSApproved' || key === 'isReceiverApproved') {
                        val = val ? 'Approved' : 'Pending'; 
                    }
                    else {
                        val = String(val);
                    }
                    return columnFilters[key].includes(String(val));
                });
            }
        });

        if (sortConfig.key && sortConfig.direction) {
            filtered.sort((a, b) => {
                let valA = a[sortConfig.key];
                let valB = b[sortConfig.key];
                
                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [data, globalFilter, columnFilters, sortConfig]);

    const totalPages = Math.ceil(processedData.length / pagination.rowsPerPage) || 1;

    const paginatedData = useMemo(() => {
        const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
        return processedData.slice(start, start + pagination.rowsPerPage);
    }, [processedData, pagination]);

    const handlePageChange = (newPage) => {
        const page = Math.max(1, Math.min(newPage, totalPages));
        setPagination(prev => ({ ...prev, currentPage: page }));
        setPageInputValue(page);
    };

    if (viewMode === 'edit'){
        return (
            <CuttingToolEditForm 
                item={editingItem} 
                onSave={handleUpdate} 
                onCancel={() => { 
                    setViewMode('table'); 
                    fetchData();
                }} 
                onDelete={handleDelete} 
            />
        )
    } 

    return (
        <div className="@container/main flex flex-col h-screen bg-card border rounded-xl shadow-lg text-foreground font-sans transition-colors duration-200">
            <div className="flex flex-wrap gap-4 px-6 py-4 border-b border-border sticky top-0 z-20 flex justify-between items-center">
                <div>
                    <h1 className="text-xl text-primary font-bold tracking-tight">Cutting Tool Modifications</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage modification requests and inventory tracking</p>
                </div>
                <DateRangePicker 
                    date={dateRange} 
                    onDateChange={setDateRange} 
                    className="w-[260px] border-input hover:bg-accent hover:text-accent-foreground"
                />
            </div>
            <div className="flex-none px-6 py-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        className="w-full h-10 pl-10 bg-background border-input shadow-sm focus-visible:ring-primary"
                        placeholder="Search across all columns..." 
                        value={globalFilter}
                        onChange={e => setGlobalFilter(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex-1 overflow-hidden px-6 pb-6">
                <div className="h-full flex flex-col bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse caption-bottom text-sm">
                            <thead className="bg-muted sticky top-0 z-10 shadow-sm [&_tr]:border-b">
                                <tr className="border-border">
                                    {allColumns.map(col => (
                                        <th key={col.key} style={{ width: col.width }} className="h-10 px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap select-none bg-muted/50">
                                            <div className="flex items-center justify-between group/th">
                                                <div 
                                                    className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors flex-1"
                                                    onClick={() => handleSort(col.key)}
                                                >
                                                    {col.label}
                                                    <span className="flex flex-col">
                                                        {sortConfig.key === col.key ? (
                                                            sortConfig.direction === 'asc' ? 
                                                                <ArrowUp size={12} className="text-primary" /> : 
                                                                <ArrowDown size={12} className="text-primary" />
                                                        ) : (
                                                            <ArrowUpDown size={12} className="opacity-0 group-hover/th:opacity-50 transition-opacity" />
                                                        )}
                                                    </span>
                                                </div>
                                                {col.filterable && <FilterColumn column={col} data={data} columnFilters={columnFilters} setColumnFilters={setColumnFilters} />}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border [&_tr:last-child]:border-0">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={allColumns.length} className="h-24 text-center">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <Loader2 className="animate-spin h-6 w-6 mb-2" />
                                                <span>Loading data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={allColumns.length} className="h-24 text-center text-muted-foreground">
                                            No matching records found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData.map((item) => (
                                        <tr 
                                            key={item.Id} 
                                            className="group cursor-pointer hover:bg-muted/50 transition-colors border-b border-border"
                                            onClick={() => { setEditingItem(item); setViewMode('edit'); }}
                                        >
                                            <td className="p-4 py-2.5 text-xs font-medium text-primary group-hover:underline">#{item.Id}</td>
                                            <td className="p-4 py-2.5 text-xs text-muted-foreground group-hover:text-foreground">{format(new Date(item.RequestDate), 'dd-MMM-yyyy')}</td>
                                            <td className="p-4 py-2.5 text-xs text-muted-foreground group-hover:text-foreground">{item.RequestSection}</td>
                                            <td className="p-4 py-2.5 text-xs text-muted-foreground group-hover:text-foreground">{item.RequestedBy}</td>
                                            <td className="p-4 py-2.5 text-xs">
                                                <Badge variant="secondary" className="font-mono text-[10px] px-2 h-5 bg-secondary text-secondary-foreground">
                                                    {item.ReceivedQty}
                                                </Badge>
                                            </td>
                                            <td className="p-4 py-2.5 text-xs text-muted-foreground group-hover:text-foreground">{item.CheckedBy}</td>
                                            <td className="p-4 py-2.5 text-xs text-muted-foreground group-hover:text-foreground">{item.ReceivedBy}</td>
                                            <td className="p-4 py-2.5 text-xs text-muted-foreground group-hover:text-foreground font-mono">{item.From_ItemCode}</td>
                                            <td className="p-4 py-2.5 text-xs text-muted-foreground group-hover:text-foreground font-mono">{item.To_ItemCode}</td>
                                            <td className="p-4 py-2.5 text-xs text-muted-foreground group-hover:text-foreground max-w-[200px] truncate" title={item.Reason}>{item.Reason}</td>
                                            <td className="p-4 py-2.5 text-xs">
                                                {item.isHOSApproved ? (
                                                    <Badge variant="success" className="font-mono text-[10px] px-2 h-5 bg-green-500 text-white">
                                                        Approved
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive" className="font-mono text-[10px] px-2 h-5 bg-blue-500 text-white">
                                                        Pending
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-4 py-2.5 text-xs">
                                                {item.isReceiverApproved ? (
                                                    <Badge variant="success" className="font-mono text-[10px] px-2 h-5 bg-green-500 text-white">
                                                        Approved
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive" className="font-mono text-[10px] px-2 h-5 bg-blue-500 text-white">
                                                        Pending
                                                    </Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="flex-none bg-card border-t border-border p-3 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Rows per page</span>
                            <div className="relative">
                                <select 
                                    className="appearance-none bg-background border border-input rounded-md px-3 py-1 text-foreground outline-none focus:ring-1 focus:ring-ring text-xs font-medium cursor-pointer pr-8 h-8"
                                    value={pagination.rowsPerPage}
                                    onChange={(e) => {
                                        setPagination({ currentPage: 1, rowsPerPage: Number(e.target.value) });
                                        setPageInputValue(1);
                                    }}
                                >
                                    {[10, 20, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none opacity-50" />
                            </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground font-medium">
                            {processedData.length > 0 ? ((pagination.currentPage - 1) * pagination.rowsPerPage) + 1 : 0} - {Math.min(pagination.currentPage * pagination.rowsPerPage, processedData.length)} <span className="mx-1 opacity-50">/</span> {processedData.length} records
                        </div>

                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 disabled:opacity-30 border-input hover:bg-accent hover:text-accent-foreground"
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            
                            <div className="flex items-center gap-1.5 mx-1">
                                <span className="text-xs text-muted-foreground">Page</span>
                                <Input 
                                    type="number" 
                                    className="w-12 h-8 text-center text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    value={pageInputValue}
                                    onChange={(e) => setPageInputValue(e.target.value)}
                                    onBlur={(e) => handlePageChange(parseInt(e.target.value) || 1)}
                                    onKeyDown={(e) => e.key === 'Enter' && handlePageChange(parseInt(e.currentTarget.value) || 1)}
                                />
                                <span className="text-xs text-muted-foreground">of {totalPages}</span>
                            </div>

                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 disabled:opacity-30 border-input hover:bg-accent hover:text-accent-foreground"
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage >= totalPages}
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}