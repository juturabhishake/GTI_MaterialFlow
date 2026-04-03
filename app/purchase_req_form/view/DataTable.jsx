'use client';
import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import { Filter, X, Search, ChevronsUpDown, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

const SingleSelectCombobox = ({ options, selected, onSelectedChange, placeholder }) => {
    const [open, setOpen] = useState(false);
    const selectedLabel = options.find(opt => opt.value === selected)?.label;
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild><Button variant="outline" className="w-full justify-between h-9 px-3 font-normal text-sm">{selectedLabel || placeholder}<ChevronsUpDown className="h-4 w-4 ml-2 shrink-0 opacity-50" /></Button></PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command><CommandInput placeholder="Search..." />
                <CommandList>
                    <CommandEmpty>No results.</CommandEmpty>
                    <CommandGroup>
                        {options.map(o => 
                            (<CommandItem 
                                key={o.value} 
                                onSelect={() => { onSelectedChange(o.value); setOpen(false); }}>
                                    {o.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

const MultiSelectCombobox = ({ options, selected, onSelectedChange, placeholder }) => {
    const [open, setOpen] = useState(false);
    const handleSelect = (val) => onSelectedChange(prev => prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild><Button variant="outline" className="w-full justify-between h-9 px-3 font-normal text-sm"><div className="flex items-center gap-1 truncate">{selected.length > 0 ? `${selected.length} selected` : <span className="text-muted-foreground">{placeholder}</span>}</div><ChevronsUpDown className="h-4 w-4 ml-2 opacity-50" /></Button></PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start"><Command><CommandInput placeholder="Search..." /><CommandList><CommandEmpty>No results.</CommandEmpty><CommandGroup><CommandItem onSelect={() => onSelectedChange([])} className="justify-center text-destructive cursor-pointer">Clear</CommandItem>{options.map(o => (<CommandItem key={o.value} value={o.value} onSelect={() => handleSelect(o.value)} className="cursor-pointer"><Check className={cn("mr-2 h-4 w-4", selected.includes(o.value) ? "opacity-100" : "opacity-0")} />{o.label}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent>
        </Popover>
    );
};

const ColumnFilterPopover = ({ column, data, activeFilters, onFilterChange }) => {
    const options = useMemo(() => {
        const uniqueValues = Array.from(new Set(data.map(item => item[column.key]))).filter(v => v !== null && v !== undefined && v !== '');
        return uniqueValues.map(v => ({ label: String(v), value: String(v) }));
    }, [data, column.key]);
    const selectedValues = activeFilters[column.key] || [];
    const handleSelect = (value) => { const newSelected = selectedValues.includes(value) ? selectedValues.filter(item => item !== value) : [...selectedValues, value]; onFilterChange(column.key, newSelected); };
    const handleSelectAll = () => onFilterChange(column.key, options.map(opt => opt.value));
    const handleClear = () => onFilterChange(column.key, []);
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-6 w-6 ml-1 ${selectedValues.length > 0 ? 'text-primary bg-primary/10' : ''}`} 
                    onClick={(e) => e.stopPropagation()}
                >
                    <Filter className="h-3 w-3" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="center">
                <Command>
                    <CommandInput placeholder={`Filter ${column.label}...`} />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            <div className='flex flex-row justify-between gap-2 items-center px-2 py-2 border-b'>
                                <CommandItem 
                                    onSelect={handleSelectAll} 
                                    className="font-medium cursor-pointer w-full justify-center"
                                >
                                    Select All
                                </CommandItem>
                                <CommandItem 
                                    onSelect={handleClear} 
                                    className="font-medium cursor-pointer p-2"
                                >
                                        <X className="h-4 w-4 text-destructive" />
                                </CommandItem>
                            </div>
                        </CommandGroup>
                        <CommandGroup 
                            className="max-h-60 overflow-y-auto"
                        >
                                {options.map(option => 
                                    (<CommandItem 
                                        key={option.value} 
                                        onSelect={() => 
                                            handleSelect(option.value)}>
                                                <Check className={cn("mr-2 h-4 w-4", selectedValues.includes(option.value) ? "opacity-100" : "opacity-0")} />
                                                {/* <span>{option.label}</span> */}
                                                {column.renderFilterOption ? column.renderFilterOption(option.value) : <span>{option.label}</span>}
                                    </CommandItem>
                                ))}
                        </CommandGroup>
                            {selectedValues.length > 0 && 
                                (
                                    <>
                                        <CommandSeparator />
                                        <CommandGroup>
                                            <CommandItem 
                                                onSelect={() => onFilterChange(column.key, [])} 
                                                className="text-destructive justify-center"
                                            >
                                                Clear Filter
                                            </CommandItem>
                                        </CommandGroup>
                                    </>
                                )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export default function DataTable({ columns, data, onRowClick, renderCell, actionColumn }) {
    const [pagination, setPagination] = useState({ currentPage: 1, rowsPerPage: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState({});
    const [headerSearchColumn, setHeaderSearchColumn] = useState(columns.find(c => !c.hidden)?.key || columns[0].key);
    const [headerSearchValues, setHeaderSearchValues] = useState([]);
    const [sortConfig, setSortConfig] = useState(null);
    const containerRef = useRef(null);
    const [tableHeight, setTableHeight] = useState('auto');

    const handleSort = (key) => { if (sortConfig?.key !== key) setSortConfig({ key, direction: 'descending' }); else if (sortConfig.direction === 'descending') setSortConfig({ key, direction: 'ascending' }); else setSortConfig(null); };
    const handleColumnFilterChange = (key, values) => { setColumnFilters(p => ({ ...p, [key]: values })); setPagination(p => ({ ...p, currentPage: 1 })); };

    const uniqueColumnValues = useMemo(() => {
        if (!headerSearchColumn) return [];
        return Array.from(new Set(data.map(r => String(r[headerSearchColumn] || '').trim()))).filter(Boolean).map(v => ({ label: v, value: v }));
    }, [headerSearchColumn, data]);

    const processedData = useMemo(() => {
        let processed = [...data];
        if (headerSearchValues.length) processed = processed.filter(i => headerSearchValues.includes(String(i[headerSearchColumn] || '')));
        if (globalFilter) processed = processed.filter(i => Object.values(i).some(v => String(v).toLowerCase().includes(globalFilter.toLowerCase())));
        const activeColFilters = Object.entries(columnFilters).filter(([, v]) => v.length > 0);
        if (activeColFilters.length > 0) processed = processed.filter(item => activeColFilters.every(([key, values]) => values.includes(String(item[key]))));
        if (sortConfig) processed.sort((a, b) => { 
            const valA = a[sortConfig.key] || ''; const valB = b[sortConfig.key] || ''; 
            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1; 
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1; 
            return 0; 
        });
        return processed;
    }, [data, headerSearchValues, globalFilter, columnFilters, sortConfig, headerSearchColumn]);

    const paginatedData = processedData.slice((pagination.currentPage - 1) * pagination.rowsPerPage, pagination.currentPage * pagination.rowsPerPage);
    const totalPages = Math.ceil(processedData.length / pagination.rowsPerPage);

    useLayoutEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                const h = containerRef.current.querySelector('#table-header')?.offsetHeight || 0;
                const f = containerRef.current.querySelector('#table-footer')?.offsetHeight || 0;
                const top = containerRef.current.getBoundingClientRect().top;
                setTableHeight(`${window.innerHeight - top - h - f - 40}px`);
            }
        };
        updateHeight(); window.addEventListener('resize', updateHeight); return () => window.removeEventListener('resize', updateHeight);
    }, [processedData.length]);

    return (
        <div ref={containerRef} className="@container/main flex flex-col h-full">
            <div id="table-header" className="space-y-2 mb-2">
                <div className="flex flex-col md:flex-row items-center gap-2 p-2 border rounded-lg bg-muted/20">
                    <div className="w-full md:w-[200px]"><SingleSelectCombobox options={columns.filter(c => c.filterable && !c.hidden).map(c => ({ label: c.label, value: c.key }))} selected={headerSearchColumn} onSelectedChange={(v) => { setHeaderSearchColumn(v); setHeaderSearchValues([]); }} placeholder="Column..." /></div>
                    <div className="w-full md:w-[250px]"><MultiSelectCombobox options={uniqueColumnValues} selected={headerSearchValues} onSelectedChange={setHeaderSearchValues} placeholder="Select values..." /></div>
                    <div className="relative flex-grow w-full"><Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Global search..." value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} className="pl-9 h-9 w-full" /></div>
                </div>
            </div>

            <div className="overflow-auto border rounded-md flex-grow" style={{ height: tableHeight }}>
                <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-2 text-left font-medium w-12">#</th>
                            {columns.filter(c => !c.hidden).map(col => (
                                <th key={col.key} className="px-4 py-2 text-left font-medium whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort(col.key)}>
                                    <div className="flex items-center gap-1">
                                        {col.label}
                                        {sortConfig?.key === col.key && (sortConfig.direction === 'descending' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
                                        {col.filterable && <ColumnFilterPopover column={col} data={data} activeFilters={columnFilters} onFilterChange={handleColumnFilterChange} />}
                                    </div>
                                </th>
                            ))}
                            {actionColumn && <th className="px-4 py-2 text-center w-16">Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row, i) => (
                            <tr key={i} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => onRowClick && onRowClick(row)}>
                                <td className="px-4 py-2 text-muted-foreground">{((pagination.currentPage - 1) * pagination.rowsPerPage) + i + 1}</td>
                                {columns.filter(c => !c.hidden).map(col => (
                                    <td key={col.key} className="px-4 py-2 whitespace-nowrap">
                                        {renderCell ? renderCell(row, col) : row[col.key]}
                                    </td>
                                ))}
                                {actionColumn && <td className="px-4 py-2 text-center" onClick={e => e.stopPropagation()}>{actionColumn(row)}</td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {paginatedData.length === 0 && <div className="text-center p-8 text-muted-foreground">No records found.</div>}
            </div>

            <div id="table-footer" className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2"><span className="text-sm font-medium">Rows:</span><select value={pagination.rowsPerPage} onChange={(e) => setPagination({ currentPage: 1, rowsPerPage: Number(e.target.value) })} className="bg-background border rounded-md p-1 h-8 text-sm">{[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}</select></div>
                <div className="text-sm text-muted-foreground">{((pagination.currentPage - 1) * pagination.rowsPerPage) + 1}-{Math.min(pagination.currentPage * pagination.rowsPerPage, processedData.length)} of {processedData.length}</div>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPagination(p => ({ ...p, currentPage: 1 }))} disabled={pagination.currentPage === 1}>«</Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage - 1 }))} disabled={pagination.currentPage === 1}>‹</Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))} disabled={pagination.currentPage === totalPages}>›</Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPagination(p => ({ ...p, currentPage: totalPages }))} disabled={pagination.currentPage === totalPages}>»</Button>
                </div>
            </div>
        </div>
    );
}