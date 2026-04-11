'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { Filter, X, Search, ChevronsUpDown, Trash2, MoreHorizontal, Edit, ArrowLeft, RotateCcw, Save, Loader, Check, ArrowUp, ArrowDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, subDays } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import SecureLS from "secure-ls";
import { exportToExcel } from './excelExporter';
import AnimatedExportButton from '@/components/ui/AnimatedExportButton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useAccessCheck } from '@/lib/useAccessCheck';
const allColumns = [ { key: 'ItemCode', label: 'Item Code', filterable: true }, { key: 'SizeSpecifications', label: 'Size Specifications', filterable: true }, { key: 'CycleTime', label: 'Cycle Time', filterable: true }, { key: 'Piece', label: 'Piece', filterable: true }, { key: 'SetupMinutes', label: 'Setup Minutes', filterable: true }, { key: 'CreatedAt', label: 'Created On', filterable: true }, { key: 'CreatedBy', label: 'Created By', filterable: true }, { key: 'ModifiedAt', label: 'Modified On', filterable: true }, { key: 'ModifiedBy', label: 'Modified By', filterable: true }, ];
const fieldOptions = allColumns.map((c) => ({ value: c.key, label: c.label }));
const operatorOptions = [ { value: 'is', label: 'is' }, { value: 'is-not', label: 'is not' }, { value: 'contains', label: 'contains' }, { value: 'does-not-contain', label: 'does not contain' }, { value: 'starts-with', label: 'starts with' }, { value: 'ends-with', label: 'ends with' }, { value: 'is-empty', label: 'is empty' }, { value: 'is-not-empty', label: 'is not empty' }, ];
const requiresValue = (operator) => !['is-empty', 'is-not-empty'].includes(operator);

const SingleSelectCombobox = ({ options, selected, onSelectedChange, placeholder }) => {
    const [open, setOpen] = useState(false);
    const selectedLabel = options.find(opt => opt.value === selected)?.label;
    return (
        <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button variant="outline" className="w-full justify-between h-10 px-3 font-normal">{selectedLabel || placeholder}<ChevronsUpDown className="h-4 w-4 ml-2 shrink-0 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start"><Command><CommandInput placeholder="Search..." /><CommandList><CommandEmpty>No results found.</CommandEmpty><CommandGroup>{options.map(option => (<CommandItem key={option.value} onSelect={() => {onSelectedChange(option.value); setOpen(false);}}>{option.label}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent></Popover>
    );
};

const MultiSelectCombobox = ({ options, selected, onSelectedChange, placeholder }) => {
    const [open, setOpen] = useState(false);
    const handleSelect = (value) => onSelectedChange(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]);
    const handleSelectAll = () => onSelectedChange(options.map(opt => opt.value));
    const handleClear = () => onSelectedChange([]);
    return (
        <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button variant="outline" className="w-full justify-between h-10 px-3 font-normal"><div className="flex items-center gap-1 flex-wrap">{selected.length > 0 ? (<>{selected.length > 1 ? (<Badge variant="secondary" className="rounded-md">{`${selected.length} selected`}</Badge>) : (options.find(o => o.value === selected[0])?.label || '')}</>) : (<span className="text-slate-500 dark:text-slate-400">{placeholder}</span>)}</div><ChevronsUpDown className="h-4 w-4 ml-2 shrink-0 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start"><Command><CommandInput placeholder="Search..." /><CommandList><CommandEmpty>No results found.</CommandEmpty><CommandGroup><div className='flex flex-row justify-between gap-2 items-center px-2 py-1 border-b'><CommandItem onSelect={handleSelectAll} className="font-medium cursor-pointer bg-slate-100 dark:bg-slate-700 w-full justify-center">Select All</CommandItem><CommandItem onSelect={handleClear} className="font-medium cursor-pointer bg-slate-100 dark:bg-slate-700 p-2"><X className="h-4 w-4 text-red-500" /></CommandItem></div>{options.map((option) => (<CommandItem key={option.value} onSelect={() => handleSelect(option.value)}><Check className={cn("mr-2 h-4 w-4", selected.includes(option.value) ? "opacity-100" : "opacity-0")} />{option.label}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent></Popover>
    );
};

const ColumnFilterPopover = ({ column, data, activeFilters, onFilterChange, dateColumns = [] }) => {
    const options = useMemo(() => {
        const isDate = dateColumns.includes(column.key);
        if (isDate) {
            const uniqueFormattedDates = Array.from(new Set(data.map(item => item[column.key]).filter(Boolean).map(dateStr => format(new Date(dateStr), "dd MMM, yyyy, h:mm a"))));
            return uniqueFormattedDates.map(formattedDate => ({ label: formattedDate, value: formattedDate }));
        }
        const uniqueValues = Array.from(new Set(data.map(item => item[column.key]))).filter(v => v !== null && v !== undefined && v !== '');
        return uniqueValues.map(v => ({ label: String(v), value: String(v) }));
    }, [data, column.key, dateColumns]);

    const selectedValues = activeFilters[column.key] || [];
    const handleSelect = (value) => { const newSelected = selectedValues.includes(value) ? selectedValues.filter(item => item !== value) : [...selectedValues, value]; onFilterChange(column.key, newSelected); };
    const handleSelectAll = () => onFilterChange(column.key, options.map(opt => opt.value));
    const handleClear = () => onFilterChange(column.key, []);

    return (
        <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" className={`h-6 w-6 ml-1 ${selectedValues.length > 0 ? 'text-blue-600 bg-blue-100 dark:bg-blue-900' : ''}`} onClick={(e) => e.stopPropagation()}><Filter className="h-4 w-4" /></Button></PopoverTrigger><PopoverContent className="w-60 p-0" align="start"><Command><CommandInput placeholder={`Filter ${column.label}...`} /><CommandList><CommandEmpty>No results found.</CommandEmpty><CommandGroup><div className='flex flex-row justify-between gap-2 items-center px-2 py-2 border-b'><CommandItem onSelect={handleSelectAll} className="font-medium cursor-pointer bg-slate-100 dark:bg-slate-700 w-full justify-center">Select All</CommandItem><CommandItem onSelect={handleClear} className="font-medium cursor-pointer bg-slate-100 dark:bg-slate-700 p-2"><X className="h-4 w-4 text-red-500" /></CommandItem></div></CommandGroup><CommandGroup className="max-h-60 overflow-y-auto">{options.map(option => (<CommandItem key={option.value} onSelect={() => handleSelect(option.value)}><Check className={cn("mr-2 h-4 w-4", selectedValues.includes(option.value) ? "opacity-100" : "opacity-0")} /><span>{option.label}</span></CommandItem>))}</CommandGroup>{selectedValues.length > 0 && (<><CommandSeparator /><CommandGroup><CommandItem onSelect={() => onFilterChange(column.key, [])} className="text-red-500 justify-center">Clear Filter</CommandItem></CommandGroup></>)}</CommandList></Command></PopoverContent></Popover>
    );
};

const FilterPanel = ({ isOpen, onClose, onApplyFilter }) => {
    const [conditions, setConditions] = useState([{ id: 1, field: 'ItemCode', operator: 'contains', value: '', logicalOperator: 'AND' }]);
    const addCondition = () => { const newId = conditions.length > 0 ? Math.max(...conditions.map(c => c.id)) + 1 : 1; setConditions([...conditions, { id: newId, field: 'ItemCode', operator: 'contains', value: '', logicalOperator: 'AND' }]); };
    const removeCondition = (id) => setConditions(conditions.filter(c => c.id !== id));
    const updateCondition = (id, part, value) => setConditions(conditions.map(c => c.id === id ? { ...c, [part]: value } : c));
    const handleRun = () => { onApplyFilter(conditions.filter(c => c.value || !requiresValue(c.operator))); onClose(); };
    return (
        <AnimatePresence>{isOpen && (<><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40" /><motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed top-0 right-0 h-full w-full max-w-lg bg-card shadow-2xl z-50 flex flex-col border-l"><header className="flex items-center justify-between p-4 border-b"><h2 className="text-lg font-bold">Filter Data</h2><Button variant="ghost" size="icon" onClick={onClose}><X /></Button></header><main className="flex-grow p-4 space-y-2 overflow-y-auto">{conditions.map((cond, index) => (<div key={cond.id} className="p-3 bg-background rounded-lg space-y-2 border"><div className="flex items-center gap-2">{index > 0 && (<select value={cond.logicalOperator} onChange={(e) => updateCondition(cond.id, 'logicalOperator', e.target.value)} className="bg-background border rounded-md p-2 text-sm font-semibold"><option>AND</option><option>OR</option></select>)}<select value={cond.field} onChange={(e) => updateCondition(cond.id, 'field', e.target.value)} className="w-full bg-background border rounded-md p-2 text-sm">{fieldOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select><Button variant="ghost" size="icon" onClick={() => removeCondition(cond.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></div><div className="flex items-center gap-2"><select value={cond.operator} onChange={(e) => updateCondition(cond.id, 'operator', e.target.value)} className="w-1/2 bg-background border rounded-md p-2 text-sm">{operatorOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>{requiresValue(cond.operator) && (<Input type="text" value={cond.value} onChange={(e) => updateCondition(cond.id, 'value', e.target.value)} placeholder="Value" className="w-1/2" />)}</div></div>))}{<Button variant="outline" onClick={addCondition} className="w-full">Add Condition</Button>}</main><footer className="p-4 border-t flex justify-end gap-2"><Button variant="ghost" onClick={() => setConditions([])}>Clear All</Button><Button onClick={handleRun}>Apply Filters</Button></footer></motion.div></>)}</AnimatePresence>
    );
};

const EditForm = ({ item, onSave, onCancel }) => {
    const PAGE_ID_FOR_THIS_FORM = 2029;
    const { isLoading: isAccessLoading, hasAccess } = useAccessCheck(PAGE_ID_FOR_THIS_FORM);
    const [formData, setFormData] = useState(item);
    const [submitStatus, setSubmitStatus] = useState('idle');

    useEffect(() => {
        if (submitStatus === 'success' || submitStatus === 'error') {
            const timer = setTimeout(() => setSubmitStatus('idle'), 3000);
            return () => clearTimeout(timer);
        }
    }, [submitStatus]);

    const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleReset = () => setFormData(item);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitStatus('loading');
        try {
            const ls = new SecureLS({ encodingType: 'aes' });
            const employeeId = ls.get('employee_id') || 'SYSTEM';
            await onSave({ ...formData, ModifiedBy: employeeId });
            setSubmitStatus('success');
            toast.success("Success", { description: "Record updated successfully." });
        } catch (error) {
            setSubmitStatus('error');
            toast.error("Update Failed", { description: error.message });
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6 px-2"><h2 className="text-2xl font-bold">Edit Item: {item.ItemCode}</h2><Button variant="ghost" onClick={onCancel}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Table</Button></div>
            <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-6 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2"><Label>Item Code</Label><Input value={formData.ItemCode || ''} readOnly disabled className="cursor-not-allowed" /></div>
                    <div className="space-y-2 lg:col-span-2"><Label>Size Specifications</Label><Input value={formData.SizeSpecifications || ''} readOnly disabled className="cursor-not-allowed" /></div>
                    <div className="space-y-2"><Label>Cycle Time</Label><Input name="CycleTime" type="number" step="0.01" value={formData.CycleTime || ''} onChange={handleInputChange} /></div>
                    <div className="space-y-2"><Label>Piece</Label><Input name="Piece" type="number" value={formData.Piece || ''} onChange={handleInputChange} /></div>
                    <div className="space-y-2"><Label>Setup Minutes</Label><Input name="SetupMinutes" type="number" value={formData.SetupMinutes || ''} onChange={handleInputChange} /></div>
                </div>
                <div className="flex justify-end items-center gap-4 pt-8">
                    <Button type="button" variant="outline" onClick={handleReset}><RotateCcw className="mr-2 h-4 w-4" /> Reset</Button>
                    <Button type="submit" className={cn("w-36", { "bg-green-500 hover:bg-green-500": submitStatus === 'success', "bg-red-500 hover:bg-red-500": submitStatus === 'error' })} disabled={submitStatus !== 'idle'}>
                        <AnimatePresence mode="wait"><motion.div key={submitStatus} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="flex items-center justify-center">
                            {submitStatus === 'loading' && <Loader className="h-5 w-5 animate-spin" />}
                            {submitStatus === 'success' && <Check className="h-5 w-5" />}
                            {submitStatus === 'error' && <X className="h-5 w-5" />}
                            {submitStatus === 'idle' && <><Save className="mr-2 h-4 w-4" /> Save</>}
                        </motion.div></AnimatePresence>
                    </Button>
                </div>
            </form>
        </motion.div>
    );
};

export default function ViewWalterMasterClient() {
    const [masterData, setMasterData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'CreatedAt', direction: 'descending' });
    const [pagination, setPagination] = useState({ currentPage: 1, rowsPerPage: 10 });
    const [tableHeight, setTableHeight] = useState('auto');
    const containerRef = useRef(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState({});
    const [viewMode, setViewMode] = useState('table');
    const [editingItem, setEditingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState([]);
    const [headerSearchColumn, setHeaderSearchColumn] = useState('CreatedAt');
    const [headerSearchValues, setHeaderSearchValues] = useState([]);
    const [dateRange, setDateRange] = useState({ from: subDays(new Date(), 30), to: new Date() });
    
    const dateColumns = ['CreatedAt', 'ModifiedAt'];

    const fetchData = useCallback(async (currentDateRange) => {
        if (!currentDateRange?.from || !currentDateRange?.to) {
            setMasterData([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch('/api/walter/master/get-master', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dateRange: currentDateRange })
            });
            if (!response.ok) throw new Error('Data could not be fetched.');
            const data = await response.json();
            setMasterData(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(dateRange);
    }, [dateRange, fetchData]);

    const uniqueColumnValues = useMemo(() => {
        if (!headerSearchColumn || dateColumns.includes(headerSearchColumn)) return [];
        const values = new Set(masterData.map(item => String(item[headerSearchColumn] || '').trim()));
        return Array.from(values).filter(Boolean).map(v => ({ label: v, value: v }));
    }, [headerSearchColumn, masterData]);

    const handleEdit = (item) => { setEditingItem(item); setViewMode('edit'); };

    const handleUpdate = async (updatedItem) => {
        try {
            const response = await fetch('/api/walter/master/update-master', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedItem) });
            if (!response.ok) { const err = await response.json(); throw new Error(err.message); }
            setViewMode('table');
            fetchData(dateRange);
        } catch (err) { console.error(err); throw err; }
    };

    const handleDelete = async (itemCode) => {
        try {
            const response = await fetch(`/api/walter/master/delete-master?itemCode=${itemCode}`, { method: 'DELETE' });
            if (!response.ok) { const err = await response.json(); throw new Error(err.message); }
            toast.success("Success", { description: "Record deleted successfully." });
            setItemToDelete(null);
            fetchData(dateRange);
        } catch (err) { toast.error("Delete Failed", { description: err.message }); }
    };

    const handleSort = (key) => {
        if (sortConfig?.key !== key) {
            setSortConfig({ key, direction: 'descending' });
        } else if (sortConfig.direction === 'descending') {
            setSortConfig({ key, direction: 'ascending' });
        } else {
            setSortConfig(null);
        }
    };

    const handleColumnFilterChange = (columnKey, selectedValues) => {
        setColumnFilters(prev => ({ ...prev, [columnKey]: selectedValues }));
        setPagination(p => ({ ...p, currentPage: 1 }));
    };

    const handleHeaderColumnChange = (value) => { 
        setHeaderSearchColumn(value); 
        setHeaderSearchValues([]); 
    };

    const processedData = useMemo(() => {
        let data = [...masterData];

        if (headerSearchValues.length > 0) {
            data = data.filter(item => {
                const itemValue = String(item[headerSearchColumn] || '').trim();
                return headerSearchValues.includes(itemValue);
            });
        }
        
        if (globalFilter) {
            data = data.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(globalFilter.toLowerCase())));
        }

        if (appliedFilters.length > 0) {
            const evaluateCondition = (item, condition) => {
                const itemValue = (item[condition.field] || '').toString().toLowerCase();
                const filterValue = (condition.value || '').toString().toLowerCase();
                switch (condition.operator) {
                    case 'is': return itemValue === filterValue;
                    case 'is-not': return itemValue !== filterValue;
                    case 'contains': return itemValue.includes(filterValue);
                    case 'does-not-contain': return !itemValue.includes(filterValue);
                    case 'starts-with': return itemValue.startsWith(filterValue);
                    case 'ends-with': return itemValue.endsWith(filterValue);
                    case 'is-empty': return itemValue === '';
                    case 'is-not-empty': return itemValue !== '';
                    default: return true;
                }
            };
            data = data.filter(item => {
                let result = evaluateCondition(item, appliedFilters[0]);
                for (let i = 1; i < appliedFilters.length; i++) {
                    const condition = appliedFilters[i];
                    if (condition.logicalOperator === 'AND') result = result && evaluateCondition(item, condition);
                    else if (condition.logicalOperator === 'OR') result = result || evaluateCondition(item, condition);
                }
                return result;
            });
        }
        
        const activeColumnFilters = Object.entries(columnFilters).filter(([, values]) => values.length > 0);
        if (activeColumnFilters.length > 0) {
            data = data.filter(item => activeColumnFilters.every(([key, values]) => {
                if (dateColumns.includes(key)) {
                    const itemDateFormatted = item[key] ? format(new Date(item[key]), "dd MMM, yyyy, h:mm a") : null;
                    return itemDateFormatted ? values.includes(itemDateFormatted) : values.includes('');
                }
                return values.includes(String(item[key]));
            }));
        }

        if (sortConfig) {
            data.sort((a, b) => {
                const valA = a[sortConfig.key] || '';
                const valB = b[sortConfig.key] || '';
                if (dateColumns.includes(sortConfig.key)) {
                    const dateA = valA ? new Date(valA).getTime() : 0;
                    const dateB = valB ? new Date(valB).getTime() : 0;
                    return sortConfig.direction === 'ascending' ? dateA - dateB : dateB - dateA;
                }
                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return data;
    }, [headerSearchValues, headerSearchColumn, globalFilter, appliedFilters, columnFilters, sortConfig, masterData]);

    const totalPages = Math.ceil(processedData.length / pagination.rowsPerPage);
    const paginatedData = useMemo(() => {
        const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
        return processedData.slice(start, start + pagination.rowsPerPage);
    }, [processedData, pagination]);

    useEffect(() => {
        if (pagination.currentPage > totalPages && totalPages > 0) {
            setPagination(p => ({ ...p, currentPage: totalPages }));
        }
    }, [pagination.currentPage, totalPages]);

    useLayoutEffect(() => {
        const calculateHeight = () => {
            if (containerRef.current) {
                const pageHeader = containerRef.current.querySelector('#page-header');
                const paginationContainer = containerRef.current.querySelector('#pagination-container');
                const topOffset = containerRef.current.getBoundingClientRect().top;
                const nonTableHeight = (pageHeader?.offsetHeight || 0) + (paginationContainer?.offsetHeight || 0);
                const calculatedHeight = window.innerHeight - topOffset - nonTableHeight - 32;
                setTableHeight(`${Math.max(400, calculatedHeight)}px`);
            }
        };
        calculateHeight();
        window.addEventListener('resize', calculateHeight);
        return () => window.removeEventListener('resize', calculateHeight);
    }, [processedData.length]);

    const handleExport = async () => {
        if (processedData.length === 0) { toast.error("No Data", { description: "There is no data to export." }); throw new Error("No data"); }
        const headers = allColumns.map(col => col.label);
        const dataRows = processedData.map(item => allColumns.map(col => {
            const value = item[col.key];
            if (dateColumns.includes(col.key)) return value ? format(new Date(value), 'dd-MMM-yyyy h:mm a') : '';
            return value != null ? String(value) : '';
        }));
        await exportToExcel({ arrayOfArrays: [headers, ...dataRows], filename: `WalterMasterData_${format(new Date(), 'yyyyMMdd_HHmm')}` });
    };

    if (viewMode === 'edit') {
        return <EditForm item={editingItem} onSave={handleUpdate} onCancel={() => setViewMode('table')} />;
    }

    return (
        <div ref={containerRef} className="@container/main bg-card border rounded-xl shadow-lg flex flex-col h-full overflow-hidden">
            <div id="page-header" className="p-4 space-y-4">
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div><h1 className="text-2xl font-bold text-brand-500">Walter Master Data</h1></div>
                    <div className="flex items-center gap-2">
                        <AnimatedExportButton onExport={handleExport} disabled={isLoading || processedData.length === 0} />
                        <Button onClick={() => setIsFilterOpen(true)} className="flex items-center gap-2"><Filter className="h-4 w-4" /> Filter</Button>
                    </div>
                </header>
                <div className="space-y-2">
                    <div className="flex flex-col md:flex-row items-center gap-2 p-2 border rounded-lg bg-background">
                        <div className="w-full md:w-64 shrink-0">
                            <SingleSelectCombobox options={allColumns.filter(c => c.filterable).map(c => ({ label: c.label, value: c.key }))} selected={headerSearchColumn} onSelectedChange={handleHeaderColumnChange} placeholder="Select column..." />
                        </div>
                        <div className="w-full">
                            {dateColumns.includes(headerSearchColumn) ? (
                                <DateRangePicker align="start" date={dateRange} onDateChange={setDateRange} />
                            ) : (
                                <MultiSelectCombobox options={uniqueColumnValues} selected={headerSearchValues} onSelectedChange={setHeaderSearchValues} placeholder={`Filter by ${allColumns.find(c => c.key === headerSearchColumn)?.label}...`} />
                            )}
                        </div>
                    </div>
                    <div className="relative"><Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input type="text" placeholder="Search across all columns..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="w-full pl-10" /></div>
                </div>
            </div>
            <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} onApplyFilter={(filters) => { setAppliedFilters(filters); setPagination(p => ({ ...p, currentPage: 1 })); }} />
            {appliedFilters.length > 0 && (
                <div className="p-4 border-t border-b flex flex-wrap gap-2 items-center"><span className="text-sm font-semibold mr-2">Active Filters:</span>{appliedFilters.map((filter, index) => (<React.Fragment key={filter.id}>{index > 0 && <span className="text-xs font-bold mx-1">{filter.logicalOperator}</span>}<div className="flex items-center gap-1.5 bg-muted text-muted-foreground rounded-full px-3 py-1 text-sm"><span className="font-medium">{fieldOptions.find(f => f.value === filter.field)?.label}</span><span className="text-foreground/70">{operatorOptions.find(o => o.value === filter.operator)?.label}</span>{requiresValue(filter.operator) && <span className="font-semibold text-foreground">"{filter.value}"</span>}<Button variant="ghost" size="icon" className="h-4 w-4 ml-1" onClick={() => setAppliedFilters(appliedFilters.filter(c => c.id !== filter.id))}><X className="h-3 w-3" /></Button></div></React.Fragment>))}<Button variant="link" onClick={() => setAppliedFilters([])} className="text-sm ml-auto">Clear All</Button></div>
            )}
            {isLoading ? (<div className="flex justify-center items-center flex-grow py-24"><Loader className="h-12 w-12 animate-spin text-primary" /></div>) :
                error ? (<div className="text-center p-16 text-destructive">Error: {error}</div>) :
                    (<div className="overflow-auto" style={{ height: tableHeight }}>
                        <table className="w-full text-sm">
                            <thead className="[&_tr]:border-b bg-muted sticky top-0 z-10">
                                <tr className="border-b">
                                    {allColumns.map((col) => (
                                        <th key={col.key} className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap text-xs">
                                            <div className="flex items-center gap-1.5 select-none">
                                                <span onClick={() => handleSort(col.key)} className="cursor-pointer group flex items-center gap-1.5">{col.label}
                                                    <span className="transition-opacity opacity-50 group-hover:opacity-100">
                                                        {sortConfig?.key === col.key ? (sortConfig.direction === 'descending' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />) : <ChevronsUpDown className="h-4 w-4" />}
                                                    </span>
                                                </span>
                                                {col.filterable && (<ColumnFilterPopover column={col} data={masterData} activeFilters={columnFilters} onFilterChange={handleColumnFilterChange} dateColumns={dateColumns} />)}
                                            </div>
                                        </th>
                                    ))}
                                    <th className="sticky right-0 bg-muted w-[100px] text-center px-4 py-2 font-medium text-muted-foreground text-xs">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {paginatedData.map((item) => (
                                    <tr key={item.Id} className="border-b hover:bg-muted/50 bg-card">
                                        {allColumns.map((col) => (
                                            <td key={`${item.Id}-${col.key}`} className="px-4 py-1 align-middle whitespace-nowrap text-xs">
                                                {dateColumns.includes(col.key) ? (item[col.key] ? format(new Date(item[col.key]), 'dd MMM, yyyy, h:mm a') : <span className="text-muted-foreground italic">N/A</span>) :
                                                    <div className="max-w-[250px] truncate" title={String(item[col.key] ?? '')}>{String(item[col.key] ?? '')}</div>
                                                }
                                            </td>
                                        ))}
                                        <td className="sticky right-0 bg-card w-[100px] text-center px-4 py-1">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(item)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setItemToDelete(item.ItemCode)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {processedData.length === 0 && !isLoading && (<div className="text-center p-16"><p className="font-bold text-lg">No records found.</p><p className="text-muted-foreground">Try adjusting your search or filter criteria.</p></div>)}
                    </div>)}
            {processedData.length > 0 && !isLoading && <div id="pagination-container" className="p-4 border-t flex flex-col md:flex-row items-center justify-between gap-4"><div className="flex items-center gap-2"><span>Rows:</span><select value={pagination.rowsPerPage} onChange={(e) => setPagination({ currentPage: 1, rowsPerPage: Number(e.target.value) })} className="bg-background border rounded-md p-1">{[10, 20, 30, 50].map(size => <option key={size} value={size}>{size}</option>)}</select></div><span>Showing {((pagination.currentPage - 1) * pagination.rowsPerPage) + 1}-{Math.min(pagination.currentPage * pagination.rowsPerPage, processedData.length)} of {processedData.length}</span><div className="flex items-center gap-2"><Button variant="outline" size="icon" onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage - 1 }))} disabled={pagination.currentPage === 1}>‹</Button><span>Page {pagination.currentPage} of {totalPages}</span><Button variant="outline" size="icon" onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))} disabled={pagination.currentPage === totalPages}>›</Button></div></div>}
            <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the record.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(itemToDelete)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </div>
    )
}