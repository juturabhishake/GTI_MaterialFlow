'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { Filter, X, Search, ChevronsUpDown, Trash2, Save, Loader2, Check, ArrowUp, ArrowDown, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import SecureLS from "secure-ls";
import { exportToPDF } from './excelExporter'; 
import AnimatedExportButton from '@/components/ui/AnimatedExportButton'; 
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Calendar } from '@/components/ui/calendar';
import { useAdminAccessCheck } from '@/lib/checkAdmin';

const allColumns = [
    { key: 'MaterialCode', label: 'Material Code', filterable: true },
    { key: 'ItemSpecification', label: 'Specification', filterable: true },
    { key: 'ProjectName', label: 'Project Name', filterable: true },
    { key: 'OrderQty', label: 'Order Qty', filterable: true },
    { key: 'CheckNGQty', label: 'Check NG', filterable: true,  hidden: true },
    { key: 'DetermineOrderQty', label: 'Det. Order Qty', filterable: true,  hidden: true },
    { key: 'ConfirmationByUser', label: 'Confirmed By User Section', filterable: true,  hidden: true },
    { key: 'DemandDate', label: 'Demand Date', filterable: true },
    { key: 'Remarks', label: 'Remarks', filterable: true },
];

const fieldOptions = allColumns.filter((c) => !c.hidden).map((c) => ({ value: c.key, label: c.label }));
const operatorOptions = [
    { value: 'is', label: 'is' },
    { value: 'is-not', label: 'is not' },
    { value: 'contains', label: 'contains' },
    { value: 'does-not-contain', label: 'does not contain' },
    { value: 'starts-with', label: 'starts with' },
    { value: 'ends-with', label: 'ends with' },
    { value: 'is-empty', label: 'is empty' },
    { value: 'is-not-empty', label: 'is not empty' },
];
const requiresValue = (operator) => !['is-empty', 'is-not-empty'].includes(operator);

const SingleSelectCombobox = ({ options, selected, onSelectedChange, placeholder }) => {
    const [open, setOpen] = useState(false);
    const selectedLabel = options.find(opt => opt.value === selected)?.label;
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild><Button variant="outline" className="w-full justify-between h-9 px-3 font-normal text-sm">{selectedLabel || placeholder}<ChevronsUpDown className="h-4 w-4 ml-2 shrink-0 opacity-50" /></Button></PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start"><Command><CommandInput placeholder="Search..." /><CommandList><CommandEmpty>No results.</CommandEmpty><CommandGroup>{options.map(o => (<CommandItem key={o.value} onSelect={() => { onSelectedChange(o.value); setOpen(false); }}>{o.label}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent>
        </Popover>
    );
};

const MultiSelectCombobox = ({ options, selected, onSelectedChange, placeholder }) => {
    const [open, setOpen] = useState(false);
    const handleSelect = (val) => onSelectedChange(prev => prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-9 px-3 font-normal text-sm">
                    <div className="flex items-center gap-1 truncate">
                        {selected.length > 0 ? `${selected.length} selected` : <span className="text-muted-foreground">{placeholder}</span>}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 ml-2 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                        <CommandEmpty>No results.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem onSelect={() => onSelectedChange([])} className="justify-center text-destructive cursor-pointer">Clear</CommandItem>
                            {options.map(o => (
                                <CommandItem key={o.value} value={o.value} onSelect={() => handleSelect(o.value)} className="cursor-pointer">
                                    <Check className={cn("mr-2 h-4 w-4", selected.includes(o.value) ? "opacity-100" : "opacity-0")} />
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
        <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" className={`h-6 w-6 ml-1 ${selectedValues.length > 0 ? 'text-primary bg-primary/10' : ''}`} onClick={(e) => e.stopPropagation()}><Filter className="h-3 w-3" /></Button></PopoverTrigger><PopoverContent className="w-56 p-0" align="start"><Command><CommandInput placeholder={`Filter ${column.label}...`} /><CommandList><CommandEmpty>No results found.</CommandEmpty><CommandGroup><div className='flex flex-row justify-between gap-2 items-center px-2 py-2 border-b'><CommandItem onSelect={handleSelectAll} className="font-medium cursor-pointer w-full justify-center">Select All</CommandItem><CommandItem onSelect={handleClear} className="font-medium cursor-pointer p-2"><X className="h-4 w-4 text-destructive" /></CommandItem></div></CommandGroup><CommandGroup className="max-h-60 overflow-y-auto">{options.map(option => (<CommandItem key={option.value} onSelect={() => handleSelect(option.value)}><Check className={cn("mr-2 h-4 w-4", selectedValues.includes(option.value) ? "opacity-100" : "opacity-0")} /><span>{option.label}</span></CommandItem>))}</CommandGroup>{selectedValues.length > 0 && (<><CommandSeparator /><CommandGroup><CommandItem onSelect={() => onFilterChange(column.key, [])} className="text-destructive justify-center">Clear Filter</CommandItem></CommandGroup></>)}</CommandList></Command></PopoverContent></Popover>
    );
};

const FilterPanel = ({ isOpen, onClose, onApplyFilter }) => {
    const [conditions, setConditions] = useState([{ id: 1, field: 'MaterialCode', operator: 'contains', value: '', logicalOperator: 'AND' }]);
    const addCondition = () => { const newId = conditions.length > 0 ? Math.max(...conditions.map(c => c.id)) + 1 : 1; setConditions([...conditions, { id: newId, field: 'MaterialCode', operator: 'contains', value: '', logicalOperator: 'AND' }]); };
    const removeCondition = (id) => setConditions(conditions.filter(c => c.id !== id));
    const updateCondition = (id, part, value) => setConditions(conditions.map(c => c.id === id ? { ...c, [part]: value } : c));
    const handleRun = () => { onApplyFilter(conditions.filter(c => c.value || !requiresValue(c.operator))); onClose(); };
    return (
        <AnimatePresence>{isOpen && (<><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40" /><motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed top-0 right-0 h-full w-full max-w-lg bg-card shadow-2xl z-50 flex flex-col border-l"><header className="flex items-center justify-between p-4 border-b"><h2 className="text-lg font-bold">Filter Data</h2><Button variant="ghost" size="icon" onClick={onClose}><X /></Button></header><main className="flex-grow p-4 space-y-2 overflow-y-auto">{conditions.map((cond, index) => (<div key={cond.id} className="p-3 bg-background rounded-lg space-y-2 border"><div className="flex items-center gap-2">{index > 0 && (<select value={cond.logicalOperator} onChange={(e) => updateCondition(cond.id, 'logicalOperator', e.target.value)} className="bg-background border rounded-md p-2 text-sm font-semibold"><option>AND</option><option>OR</option></select>)}<select value={cond.field} onChange={(e) => updateCondition(cond.id, 'field', e.target.value)} className="w-full bg-background border rounded-md p-2 text-sm">{fieldOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select><Button variant="ghost" size="icon" onClick={() => removeCondition(cond.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></div><div className="flex items-center gap-2"><select value={cond.operator} onChange={(e) => updateCondition(cond.id, 'operator', e.target.value)} className="w-1/2 bg-background border rounded-md p-2 text-sm">{operatorOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>{requiresValue(cond.operator) && (<Input type="text" value={cond.value} onChange={(e) => updateCondition(cond.id, 'value', e.target.value)} placeholder="Value" className="w-1/2" />)}</div></div>))}{<Button variant="outline" onClick={addCondition} className="w-full">Add Condition</Button>}</main><footer className="p-4 border-t flex justify-end gap-2"><Button variant="ghost" onClick={() => setConditions([])}>Clear All</Button><Button onClick={handleRun}>Apply Filters</Button></footer></motion.div></>)}</AnimatePresence>
    );
};

const ItemCodeSelector = ({ options, onSelect, disabled, selectedValues = [] }) => {
    const [open, setOpen] = useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" disabled={disabled} className="w-[140px] justify-start px-2">
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search item code..." />
                    <CommandList>
                        <CommandEmpty>No item found.</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-y-auto">
                            {options.map((option) => (
                                <CommandItem className='cursor-pointer' key={option.value} value={option.value} onSelect={() => { onSelect(option.value); }}>
                                    <Check className={cn("mr-2 h-4 w-4", selectedValues.includes(option.value) ? "opacity-100" : "opacity-0")} />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export default function PurchaseRequestClient() {
    const PAGE_ID_FOR_THIS_FORM = 7;
    const { hasAccess: isAdmin, isLoading: accessLoading } = useAdminAccessCheck(PAGE_ID_FOR_THIS_FORM);
    const [tableRows, setTableRows] = useState([]);
    const [itemCodeOptions, setItemCodeOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [date, setDate] = useState(new Date());
    const [sortConfig, setSortConfig] = useState(null);
    const [pagination, setPagination] = useState({ currentPage: 1, rowsPerPage: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState({});
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState([]);
    const [headerSearchColumn, setHeaderSearchColumn] = useState('MaterialCode');
    const [headerSearchValues, setHeaderSearchValues] = useState([]);
    const [tableHeight, setTableHeight] = useState('auto');
    const containerRef = useRef(null);
    const ls = useRef(null);

    useEffect(() => { ls.current = new SecureLS({ encodingType: 'aes' }); }, []);

    const fetchDataForDate = useCallback(async (d) => {
        if (!d) { setTableRows([]); setIsLoading(false); return; }
        setIsLoading(true);
        try {
            const response = await fetch('/api/purchaserequest/get', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reqDate: format(d, 'yyyy-MM-dd') }) });
            const data = await response.json();
            // setTableRows(data.map(row => ({ ...row, ReqDate: new Date(row.ReqDate), DemandDate: row.DemandDate ? new Date(row.DemandDate) : null, tempId: row.Id })));
        } catch { toast.error("Failed to load requests."); setTableRows([]); } 
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => {
        fetchDataForDate(date);
        const fetchItems = async () => { try { const res = await fetch('/api/walter/items'); const data = await res.json(); setItemCodeOptions(data.map(i => ({ value: i.ItemCode, label: i.ItemCode }))); } catch {} };
        fetchItems();
    }, [date, fetchDataForDate]);
    useEffect(() => {
        if (date && tableRows.length > 0) {
            setTableRows(prevRows => prevRows.map(row => ({
                ...row,
                DemandDate: date 
            })));
        }
    }, [date]);
    const handleAddItem = async (itemCode) => {
        if (tableRows.some(row => row.MaterialCode === itemCode)) { toast.info(`Item ${itemCode} already exists.`); return; }
        try {
            const response = await fetch('/api/purchaserequest/item-details', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemCode }) });
            const details = await response.json();
            const newRow = { Id: 0, tempId: `new-${Date.now()}-${Math.random()}`, ReqDate: date, MaterialCode: itemCode, ItemSpecification: details.ItemSpecification || details.SizeSpecifications || '', ProjectName: details.ProjectName || '', OrderQty: null, CheckNGQty: null, DetermineOrderQty: null, DemandDate: date, ConfirmationByUser: null, Remarks: null, isSave: 0 };
            setTableRows(prev => [...prev, newRow]);
            toast.success(`Added ${itemCode}`);
        } catch { toast.error(`Failed to get details for ${itemCode}`); }
    };
    
    const handleSave = async () => {
        if (!date) return;
        setIsSaving(true);
        try {
            let employeeId = 'SYSTEM';
            try { employeeId = ls.current.get('employee_id') || 'SYSTEM'; } catch {}
            const payload = tableRows.map(row => ({ ...row, ReqDate: format(date, 'yyyy-MM-dd'), DemandDate: row.DemandDate ? format(row.DemandDate, 'yyyy-MM-dd') : null, CreatedBy: row.Id === 0 ? employeeId : row.CreatedBy, ModifiedBy: row.Id > 0 ? employeeId : null }));
            const response = await fetch('/api/purchaserequest/upsert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: payload }) });
            if (!response.ok) throw new Error('Save failed');
            toast.success("Saved successfully!");
            // fetchDataForDate(date);
            window.location.reload();
        } catch (e) { 
            toast.error(e.message);  
            window.location.reload();
        } 
        finally { 
            setIsSaving(false); 
            window.location.reload();
        }
    };

    const handleRowChange = (tempId, field, value) => { setTableRows(prev => prev.map(row => row.tempId === tempId ? { ...row, [field]: value } : row)); };
    
    const handleRemoveRow = async (row) => {
        if (row.Id > 0) { try { await fetch(`/api/purchaserequest/delete?id=${row.Id}`, { method: 'DELETE' }); fetchDataForDate(date); } catch { toast.error("Delete failed"); } } else { setTableRows(prev => prev.filter(r => r.tempId !== row.tempId)); }
    };

    const handleColumnFilterChange = (key, values) => { setColumnFilters(prev => ({ ...prev, [key]: values })); setPagination(prev => ({ ...prev, currentPage: 1 })); };

    const uniqueColumnValues = useMemo(() => {
        if (!headerSearchColumn) return [];
        return Array.from(new Set(tableRows.map(r => String(r[headerSearchColumn] || '').trim()))).filter(Boolean).map(v => ({ label: v, value: v }));
    }, [headerSearchColumn, tableRows]);

    const processedData = useMemo(() => {
        let data = [...tableRows];
        if (headerSearchValues.length) data = data.filter(i => headerSearchValues.includes(String(i[headerSearchColumn] || '')));
        if (globalFilter) data = data.filter(i => Object.values(i).some(v => String(v).toLowerCase().includes(globalFilter.toLowerCase())));
        if (appliedFilters.length) { data = data.filter(item => appliedFilters.every(cond => { const val = String(item[cond.field] || '').toLowerCase(); const filterVal = cond.value.toLowerCase(); if (cond.operator === 'contains') return val.includes(filterVal); return true; })); }
        return data;
    }, [tableRows, headerSearchValues, globalFilter, appliedFilters, headerSearchColumn]);

    const paginatedData = processedData.slice((pagination.currentPage - 1) * pagination.rowsPerPage, pagination.currentPage * pagination.rowsPerPage);
    const totalPages = Math.ceil(processedData.length / pagination.rowsPerPage);

    useLayoutEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                const h = containerRef.current.querySelector('#header-section').offsetHeight;
                const f = containerRef.current.querySelector('#pagination-container').offsetHeight;
                setTableHeight(`${window.innerHeight - containerRef.current.getBoundingClientRect().top - h - f - 20}px`);
            }
        };
        updateHeight(); window.addEventListener('resize', updateHeight); return () => window.removeEventListener('resize', updateHeight);
    }, [processedData.length]);

    return (
        <div ref={containerRef} className="@container/main bg-card border rounded-xl shadow-lg flex flex-col h-full overflow-hidden">
            <div id="header-section" className="p-4 space-y-4">
                <header className="flex flex-wrap lg:flex-row items-start lg:items-center justify-between gap-4">
                    <h1 className="text-xl sm:text-2xl font-bold text-brand-500 whitespace-nowrap">Purchase Request</h1>
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                        <Button onClick={handleSave} disabled={isSaving || !date} className={cn("w-24", isSaving && "opacity-80")}>
                            {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />} Save
                        </Button>
                        <Popover>
                            <PopoverTrigger asChild><Button variant={"outline"} className="w-[200px] justify-start text-left font-normal px-3"><CalendarIcon className="mr-2 h-4 w-4" />{date ? format(date, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus disabled={(date) => date < new Date().setHours(0, 0, 0, 0)} /></PopoverContent>
                        </Popover>
                        <ItemCodeSelector options={itemCodeOptions} selectedValues={tableRows.map(r => r.MaterialCode)} onSelect={handleAddItem} disabled={!date} />
                        {/* <AnimatedExportButton onExport={() => exportToPDF({ data: processedData, reqDate: date, reqNo: processedData[0]?.RequestId })} /> */}
                        <Button onClick={() => setIsFilterOpen(true)} variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
                    </div>
                </header>
                <div hidden className="flex flex-col md:flex-row items-center gap-2 p-2 border rounded-lg bg-muted/20">
                    <div className="w-full md:w-[200px]"><SingleSelectCombobox options={allColumns.filter(c => c.filterable).map(c => ({ label: c.label, value: c.key }))} selected={headerSearchColumn} onSelectedChange={(v) => { setHeaderSearchColumn(v); setHeaderSearchValues([]); }} placeholder="Column..." /></div>
                    <div className="w-full md:w-[250px]"><MultiSelectCombobox options={uniqueColumnValues} selected={headerSearchValues} onSelectedChange={setHeaderSearchValues} placeholder="Select values..." /></div>
                    <div className="relative flex-grow w-full"><Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Global search..." value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} className="pl-9 h-9 w-full" /></div>
                </div>
            </div>

            <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} onApplyFilter={setAppliedFilters} />

            {isLoading ? (<div className="flex justify-center items-center flex-grow mb-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>) : (
                <div className="overflow-auto border-t" style={{ height: tableHeight }}>
                    <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium w-10">#</th>
                                {allColumns.filter(col => !col.hidden).map(col => (<th key={col.key} className="px-4 py-2 text-left font-medium whitespace-nowrap"><div className="flex items-center gap-1">{col.label}{col.filterable && <ColumnFilterPopover column={col} data={tableRows} activeFilters={columnFilters} onFilterChange={handleColumnFilterChange} />}</div></th>))}
                                <th className="px-4 py-2 text-center w-10">Del</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((row, i) => {
                                const isLocked = !isAdmin && row.isSave === 1;
                                return(
                                <tr key={row.tempId} className="border-b hover:bg-muted/50">
                                    <td className="px-4 py-1 text-xs text-muted-foreground">{i + 1 + (pagination.currentPage - 1) * pagination.rowsPerPage}</td>
                                    <td className="px-4 py-1 font-semibold text-xs">{row.MaterialCode}</td>
                                    <td className="px-4 py-1 text-xs truncate max-w-[200px]" title={row.ItemSpecification}>{row.ItemSpecification}</td>
                                    <td className="px-4 py-1 text-xs truncate max-w-[150px]">{row.ProjectName}</td>
                                    <td className="px-4 py-1">
                                        {isLocked ? (
                                            <span className="text-xs text-muted-foreground">{row.OrderQty}</span>
                                        ) : (
                                            <Input type="number" className="h-7 w-20 text-xs min-w-[80px]" value={row.OrderQty || ''} onChange={e => handleRowChange(row.tempId, 'OrderQty', e.target.value)} />
                                        )
                                        }
                                    </td>
                                    {/* <td className="px-4 py-1"><Input type="number" className="h-7 w-20 text-xs min-w-[80px]" value={row.CheckNGQty || ''} onChange={e => handleRowChange(row.tempId, 'CheckNGQty', e.target.value)} /></td>
                                    <td className="px-4 py-1"><Input type="number" className="h-7 w-20 text-xs min-w-[80px]" value={row.DetermineOrderQty || ''} onChange={e => handleRowChange(row.tempId, 'DetermineOrderQty', e.target.value)} /></td>
                                    <td className="px-4 py-1"><Input className="h-7 w-28 text-xs min-w-[100px]" value={row.ConfirmationByUser || ''} onChange={e => handleRowChange(row.tempId, 'ConfirmationByUser', e.target.value)} /></td> */}
                                    <td className="px-4 py-1">
                                        {isLocked ? (
                                            <span className="text-xs text-muted-foreground">{row.DemandDate ? format(new Date(row.DemandDate), 'yyyy-MM-dd') : ''}</span>
                                        ) : (
                                            <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="h-7 w-[100px] text-[10px] justify-start px-2">{row.DemandDate ? format(row.DemandDate, "dd-MMM-yy") : "Pick"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={row.DemandDate} onSelect={d => handleRowChange(row.tempId, 'DemandDate', d)} disabled={(date) => date < new Date().setHours(0, 0, 0, 0)} /></PopoverContent></Popover>
                                        )
                                        }
                                    </td>
                                    <td className="px-4 py-1">
                                        {isLocked ? (
                                            <span className="text-xs text-muted-foreground">{row.Remarks}</span>
                                        ) : (
                                            <Input className="h-7 w-32 text-xs min-w-[120px]" value={row.Remarks || ''} onChange={e => handleRowChange(row.tempId, 'Remarks', e.target.value)} />
                                        )
                                        }
                                    </td>
                                    <td className="px-4 py-1 text-center"><Button disabled={isLocked} variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveRow(row)}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                    {processedData.length === 0 && !isLoading && (<div className="text-center p-16"><p className="font-bold text-lg">No records found.</p><p className="text-muted-foreground">Add items to the table.</p></div>)}
                </div>
            )}

            <div id="pagination-container" className="p-4 border-t flex flex-col md:flex-row items-center justify-between gap-4 bg-background z-20">
                <div className="flex items-center gap-2"><span className="text-sm font-medium">Rows per page</span><select value={pagination.rowsPerPage} onChange={(e) => setPagination({ currentPage: 1, rowsPerPage: Number(e.target.value) })} className="bg-background border rounded-md p-1 h-8 text-sm focus:ring-2 focus:ring-primary">{[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}</select></div>
                <div className="text-sm text-muted-foreground order-first md:order-none">{((pagination.currentPage - 1) * pagination.rowsPerPage) + 1}-{Math.min(pagination.currentPage * pagination.rowsPerPage, processedData.length)} of {processedData.length}</div>
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