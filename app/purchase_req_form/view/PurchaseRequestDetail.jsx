'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Loader2, Calendar as CalendarIcon, Plus, Printer, Trash2, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { format } from "date-fns";
import SecureLS from "secure-ls";
import { exportToPDF } from './excelExporter'; 
import AnimatedExportButton from '@/components/ui/AnimatedExportButton'; 
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import DataTable from './DataTable';
import { useAdminAccessCheck } from '@/lib/checkAdmin';

const detailColumns = [
    { key: 'MaterialCode', label: 'Material Code', filterable: true, hidden: false },
    { key: 'ItemSpecification', label: 'Specification', filterable: true, hidden: false },
    { key: 'ProjectName', label: 'Project Name', filterable: true, hidden: false },
    { key: 'OrderQty', label: 'Order Qty', filterable: true, hidden: false },
    { key: 'CheckNGQty', label: 'Check NG', filterable: true, hidden: true },
    { key: 'DetermineOrderQty', label: 'Det. Order Qty', filterable: true, hidden: true },
    { key: 'ConfirmationByUser', label: 'Confirmed By User', filterable: true, hidden: true },
    { key: 'DemandDate', label: 'Demand Date', filterable: true, hidden: false },
    { key: 'Remarks', label: 'Remarks', filterable: true, hidden: false },
];

const ItemCodeSelector = ({ options, onSelect, disabled, selectedValues = [] }) => {
    const [open, setOpen] = useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild><Button variant="outline" disabled={disabled} className="w-[140px] justify-start px-2"><Plus className="mr-2 h-4 w-4" /> Add Item</Button></PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start"><Command><CommandInput placeholder="Search item code..." /><CommandList><CommandEmpty>No item found.</CommandEmpty><CommandGroup className="max-h-60 overflow-y-auto">{options.map((option) => (<CommandItem className='cursor-pointer' key={option.value} value={option.value} onSelect={() => onSelect(option.value)}><Check className={cn("mr-2 h-4 w-4", selectedValues.includes(option.value) ? "opacity-100" : "opacity-0")} />{option.label}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent>
        </Popover>
    );
};

export default function PurchaseRequestDetail({ request, onBack }) {
    const PAGE_ID_FOR_THIS_FORM = 8;
    const { hasAccess: isAdmin, isLoading: accessLoading } = useAdminAccessCheck(PAGE_ID_FOR_THIS_FORM);
    const [rows, setRows] = useState([]);
    const [date, setDate] = useState(request ? new Date(request.ReqDate) : new Date());
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [itemCodeOptions, setItemCodeOptions] = useState([]);
    const ls = useRef(null);

    useEffect(() => { ls.current = new SecureLS({ encodingType: 'aes' }); }, []);

    useEffect(() => {
        const fetchItems = async () => { try { const res = await fetch('/api/walter/items'); const data = await res.json(); setItemCodeOptions(data.map(i => ({ value: i.ItemCode, label: i.ItemCode }))); } catch {} };
        fetchItems();
    }, []);

    useEffect(() => {
        if (request) {
            setIsLoading(true);
            fetch('/api/purchaserequest/get-by-id', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ requestId: request.RequestId }) 
            })
            .then(res => res.json())
            .then(data => {
                setRows(data.map(r => ({ ...r, ReqDate: new Date(r.ReqDate), DemandDate: r.DemandDate ? new Date(r.DemandDate) : null, tempId: r.Id })));
            })
            .catch(() => toast.error("Failed to load details"))
            .finally(() => setIsLoading(false));
        }
    }, [request]);

    useEffect(() => {
        if (date && rows.length > 0) {
            setRows(prev => prev.map(row => ({ ...row, DemandDate: date })));
        }
    }, [date]);

    const handleAddItem = async (itemCode) => {
        if (rows.some(row => row.MaterialCode === itemCode)) { toast.info(`Item ${itemCode} already exists.`); return; }
        try {
            const response = await fetch('/api/purchaserequest/item-details', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemCode }) });
            const details = await response.json();
            const newRow = { 
                Id: 0, 
                tempId: `new-${Date.now()}`, 
                RequestId: request ? request.RequestId : 0,
                ReqDate: date, 
                MaterialCode: itemCode, 
                ItemSpecification: details.ItemSpecification || '', 
                ProjectName: details.ProjectName || '', 
                OrderQty: null, CheckNGQty: null, DetermineOrderQty: null, 
                DemandDate: date, ConfirmationByUser: null, Remarks: null,
                isSave: 0
            };
            setRows(prev => [...prev, newRow]);
            toast.success(`Added ${itemCode}`);
        } catch { toast.error(`Failed to get details for ${itemCode}`); }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let employeeId = 'SYSTEM';
            try { employeeId = ls.current.get('employee_id') || 'SYSTEM'; } catch {}
            const payload = rows.map(row => ({ 
                ...row, 
                ReqDate: format(date, 'yyyy-MM-dd'), 
                DemandDate: row.DemandDate ? format(row.DemandDate, 'yyyy-MM-dd') : null, 
                CreatedBy: row.Id === 0 ? employeeId : row.CreatedBy, 
                ModifiedBy: row.Id > 0 ? employeeId : null 
            }));
            const response = await fetch('/api/purchaserequest/upsert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: payload }) });
            if (!response.ok) throw new Error('Save failed');
            toast.success("Saved successfully!");
            const responseData = await response.json();
            const updatedRows = Array.isArray(responseData) ? responseData : [];
            if(request) {
                const updatedData = await response.json();
                setRows(updatedData.map(r => ({ ...r, ReqDate: new Date(r.ReqDate), DemandDate: r.DemandDate ? new Date(r.DemandDate) : null, tempId: r.Id })));
                // setRows(prev => prev.map(r => ({...r, isSave: 1})));
            } else {
                const data = await response.json();
                setRows(data.map(r => ({ ...r, ReqDate: new Date(r.ReqDate), DemandDate: r.DemandDate ? new Date(r.DemandDate) : null, tempId: r.Id })));
            }
        } catch (e) { toast.error(e.message); } 
        finally { setIsSaving(false); }
    };

    const handleRowChange = (tempId, field, value) => { setRows(prev => prev.map(row => row.tempId === tempId ? { ...row, [field]: value } : row)); };

    const handleRemoveRow = async (row) => {
        if (row.Id > 0) { 
            try { 
                await fetch(`/api/purchaserequest/delete?id=${row.Id}`, { method: 'DELETE' }); 
                toast.success("Deleted."); 
                setRows(prev => prev.filter(r => r.tempId !== row.tempId));
            } catch { toast.error("Delete failed."); } 
        } else { 
            setRows(prev => prev.filter(r => r.tempId !== row.tempId)); 
        }
    };

    const renderCell = (row, col) => {
        const isLocked = !isAdmin && row.isSave === 1;
        if (col.key === 'MaterialCode' || col.key === 'ItemSpecification' || col.key === 'ProjectName') {
            return <span className="text-xs truncate block max-w-[200px]" title={row[col.key]}>{row[col.key]}</span>;
        }
        // if (col.key === 'DemandDate') {
        //     return <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="h-7 text-[10px] px-2">{row.DemandDate ? format(row.DemandDate, "dd-MMM-yy") : "Pick"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={row.DemandDate} onSelect={d => handleRowChange(row.tempId, 'DemandDate', d)} /></PopoverContent></Popover>;
        // }
        if (col.key === 'DemandDate') {
            if (isLocked) {
                return <span className="text-xs px-2 block">{row.DemandDate ? format(row.DemandDate, "dd-MMM-yy") : "-"}</span>;
            }
            return (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-[10px] px-2">
                            {row.DemandDate ? format(row.DemandDate, "dd-MMM-yy") : "Pick"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={row.DemandDate} onSelect={d => handleRowChange(row.tempId, 'DemandDate', d)} />
                    </PopoverContent>
                </Popover>
            );
        }
        // return <Input className="h-7 text-xs min-w-[80px]" value={row[col.key] || ''} onChange={e => handleRowChange(row.tempId, col.key, e.target.value)} type={col.key.includes('Qty') ? "number" : "text"} />;
        if (isLocked) {
            return <span className="text-xs px-2 py-1 block min-h-[1.75rem]">{row[col.key]}</span>;
        }
        return <Input className="h-7 text-xs min-w-[80px]" value={row[col.key] || ''} onChange={e => handleRowChange(row.tempId, col.key, e.target.value)} type={col.key.includes('Qty') ? "number" : "text"} />;
    };

    // const actionColumn = (row) => (
    //     <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveRow(row)}><Trash2 className="h-3.5 w-3.5" /></Button>
    // );
    const actionColumn = (row) => {
        const isLocked = !isAdmin && row.isSave === 1;
        return (
            <Button 
                variant="ghost" 
                size="icon" 
                disabled={isLocked}
                className={cn("h-7 w-7 text-destructive", isLocked && "opacity-50 cursor-not-allowed text-muted-foreground")} 
                onClick={() => handleRemoveRow(row)}
            >
                <Trash2 className="h-3.5 w-3.5" />
            </Button>
        );
    };
    return (
        <div className="@container/main flex flex-col h-full space-y-4 p-4">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft /></Button>
                    <h1 className="text-xl font-bold text-brand-500 whitespace-nowrap">{request ? `View Request: GTI-${new Date(request.ReqDate).getFullYear()}-RG-${request.RequestId}` : 'New Request'}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button hidden={!isAdmin} onClick={handleSave} disabled={isSaving || !date} className={cn("w-24", isSaving && "opacity-80")}>{isSaving ? <Loader2 className="animate-spin h-4 w-4"/> : <Save className="mr-2 h-4 w-4"/>} Save</Button>
                    {/* <Popover><PopoverTrigger asChild><Button variant={"outline"} className="w-[200px] justify-start text-left px-3"><CalendarIcon className="mr-2 h-4 w-4"/>{date ? format(date, "PPP") : <span>Pick date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent></Popover> */}
                    {/* <ItemCodeSelector hidden options={itemCodeOptions} selectedValues={rows.map(r => r.MaterialCode)} onSelect={handleAddItem} disabled={!date} /> */}
                    <AnimatedExportButton onExport={() => exportToPDF({ data: rows, reqDate: date, reqNo: request ? `GTI-${new Date(date).getFullYear()}-RG-${request.RequestId}` : '' })} text="Print PDF" icon={<Printer className="h-4 w-4 mr-2"/>} />
                </div>
            </header>

            {isLoading ? <div className="flex justify-center h-full items-center"><Loader2 className="animate-spin"/></div> :
                <DataTable 
                    columns={detailColumns} 
                    data={rows} 
                    renderCell={renderCell} 
                    actionColumn={actionColumn} 
                />
            }
        </div>
    );
}