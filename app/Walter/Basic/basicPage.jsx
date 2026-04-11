'use client';

import React, { useState, useEffect, useRef } from 'react';
import SecureLS from 'secure-ls';
import { motion } from 'framer-motion';
import { Check, ChevronsUpDown, Loader2, X, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { useAccessCheck } from '@/lib/useAccessCheck';
const WalterBasicEntry = () => {
    const PAGE_ID_FOR_THIS_FORM = 2027;
    const { isLoading: isAccessLoading, hasAccess } = useAccessCheck(PAGE_ID_FOR_THIS_FORM);
    const initialFormState = {
        TransactionDate: new Date(),
        Shift: '', ItemCode: '', SizeSpecifications: '', FullOrderQuantity: '', OKQuantity: '', NGQuantity: '',
        TotalOrderCompletionTime: '', CycleTimePerPiece: '', ToolDebuggingTime: '', ReworkQty: '', ReworkTime: '',
        WarmUp: '', IdleTime: '', EquipmentBreakdownTime: '', ToolsNotAvailableTime: '', Remarks: ''
    };
    const [items, setItems] = useState([]);
    const [shiftOptions, setShiftOptions] = useState([]);
    const [formData, setFormData] = useState(initialFormState);
    const [open, setOpen] = useState(false);
    const [isFetchingItems, setIsFetchingItems] = useState(true);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);
    const [submitStatus, setSubmitStatus] = useState('idle');
    const ls = useRef(null);

    useEffect(() => {
        // ls.current = new SecureLS({ encodingType: "aes" });
        const fetchInitialData = async () => {
            try {
                const itemsResponse = await fetch('/api/walter/master/items');
                if (!itemsResponse.ok) throw new Error('Network error on items');
                const itemsData = await itemsResponse.json();
                setItems(itemsData);

                const shiftsResponse = await fetch('/api/options/shifts');
                if (!shiftsResponse.ok) throw new Error('Network error on shifts');
                const shiftsData = await shiftsResponse.json();
                setShiftOptions(shiftsData);
            } catch (error) {
                toast.error("Fetch Error", { description: "Failed to fetch initial data." });
            } finally {
                setIsFetchingItems(false);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        if (submitStatus === 'success' || submitStatus === 'error') {
            const timer = setTimeout(() => setSubmitStatus('idle'), 3000);
            return () => clearTimeout(timer);
        }
    }, [submitStatus]);

    const handleItemSelect = async (selectedItemCode) => {
        setFormData(prev => ({ ...initialFormState, TransactionDate: prev.TransactionDate, Shift: prev.Shift, ItemCode: selectedItemCode }));
        setOpen(false);
        setIsFetchingDetails(true);
        try {
            const response = await fetch('/api/walter/master/master-details', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemCode: selectedItemCode }) });
            if (!response.ok) throw new Error('Failed to fetch master details');
            const result = await response.json();
            setFormData(prev => ({
                ...prev,
                SizeSpecifications: result.SizeSpecifications || '',
                CycleTimePerPiece: result.CycleTimePerPiece || ''
            }));
        } catch (error) {
            toast.error("Error", { description: "Could not fetch master details." });
        } finally {
            setIsFetchingDetails(false);
        }
    };
    
    const handleSubmit = async (e) => {
        console.log("Form Data:", formData);
        e.preventDefault();
        setSubmitStatus('submitting');
        try {
            let employeeId = 'SYSTEM';
            try{
                const ls = new SecureLS({ encodingType: 'aes' });
                employeeId = ls.get('employee_id');
                console.log("Retrieved employee ID:", employeeId);
            }
            catch{
                // employeeId = 'SYSTEM';
                throw new Error("Employee ID not found. Please log in again.");
            }
            if (!employeeId) {
                throw new Error("Employee ID not found. Please log in again.");
            }
            
            const payload = { ...formData, TransactionDate: format(formData.TransactionDate, 'yyyy-MM-dd'), CreatedBy: employeeId };
            
            const response = await fetch('/api/walter/basic/insert', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ data: payload }) 
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || "An unknown error occurred.");
            }
            
            toast.success("Success", { description: result.message });
            setFormData(initialFormState);
            setSubmitStatus('success');

        } catch (error) {
            toast.error("Submission Failed", { description: error.message });
            setSubmitStatus('error');
        }
    };

    const handleReset = () => { setFormData(initialFormState); };
    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };

    return (
        <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div className="space-y-1.5">
                    <Label>Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.TransactionDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.TransactionDate ? format(formData.TransactionDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={formData.TransactionDate} onSelect={(date) => setFormData(p => ({...p, TransactionDate: date}))} initialFocus />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-1.5">
                    <Label>Shift</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className={cn("w-full justify-between", !formData.Shift && "text-slate-400")}>
                                {formData.Shift || "Select shift..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search shift..." />
                                <CommandEmpty>No shift found.</CommandEmpty>
                                <CommandGroup>
                                    {shiftOptions.map((option) => (
                                        <CommandItem key={option.value} value={option.value} onSelect={() => setFormData(p => ({...p, Shift: option.value}))}>
                                            <Check className={cn("mr-2 h-4 w-4", formData.Shift === option.value ? "opacity-100" : "opacity-0")} />
                                            {option.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-1.5">
                    <Label>Item Code</Label>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" disabled={isFetchingItems} className={cn("w-full justify-between", !formData.ItemCode && "text-slate-400")}>
                                {isFetchingItems ? "Loading..." : formData.ItemCode || "Select item..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search..." />
                                <CommandEmpty>No item found.</CommandEmpty>
                                <CommandGroup className="max-h-60 overflow-y-auto">
                                    {items.map((item) => (
                                        <CommandItem key={item.ItemCode} value={item.ItemCode} onSelect={() => handleItemSelect(item.ItemCode)}>
                                            <Check className={cn("mr-2 h-4 w-4", item.ItemCode === formData.ItemCode ? "opacity-100" : "opacity-0")} />
                                            {item.ItemCode}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-1.5">
                    <Label>Size Specifications</Label>
                    <div className="relative">
                        <Input value={formData.SizeSpecifications} readOnly className="cursor-not-allowed" placeholder='Auto-filled' />
                        {isFetchingDetails && (<div className="absolute inset-y-0 right-0 flex items-center pr-3"><Loader2 className="h-5 w-5 text-slate-400 animate-spin" /></div>)}
                    </div>
                </div>
                <div className="space-y-1.5"><Label>Full Order Qty</Label><Input type="number" name="FullOrderQuantity" value={formData.FullOrderQuantity} onChange={handleChange} /></div>
                <div className="space-y-1.5"><Label>OK Qty</Label><Input type="number" name="OKQuantity" value={formData.OKQuantity} onChange={handleChange} /></div>
                <div className="space-y-1.5"><Label>NG Qty</Label><Input type="number" name="NGQuantity" value={formData.NGQuantity} onChange={handleChange} /></div>
                <div className="space-y-1.5"><Label>Total Completion Time</Label><Input type="number" step="0.01" name="TotalOrderCompletionTime" value={formData.TotalOrderCompletionTime} onChange={handleChange} /></div>
                <div className="space-y-1.5">
                    <Label>Cycle Time/Piece</Label>
                    <div className="relative">
                        <Input readOnly type="number" step="0.01" name="CycleTimePerPiece" value={formData.CycleTimePerPiece} onChange={handleChange} placeholder="Auto-filled" />
                        {isFetchingDetails && (<div className="absolute inset-y-0 right-0 flex items-center pr-3"><Loader2 className="h-5 w-5 text-slate-400 animate-spin" /></div>)}
                    </div>
                </div>
                <div className="space-y-1.5"><Label>Tool Debugging Time</Label><Input type="number" name="ToolDebuggingTime" value={formData.ToolDebuggingTime} onChange={handleChange} /></div>
                <div className="space-y-1.5"><Label>Rework Qty</Label><Input type="number" name="ReworkQty" value={formData.ReworkQty} onChange={handleChange} /></div>
                <div className="space-y-1.5"><Label>Rework Time</Label><Input type="number" step="0.01" name="ReworkTime" value={formData.ReworkTime} onChange={handleChange} /></div>
                <div className="space-y-1.5"><Label>Warm up</Label><Input type="number" name="WarmUp" value={formData.WarmUp} onChange={handleChange} /></div>
                <div className="space-y-1.5"><Label>Idle time</Label><Input type="number" name="IdleTime" value={formData.IdleTime} onChange={handleChange} /></div>
                <div className="space-y-1.5"><Label>Equip. Breakdown Time</Label><Input type="number" name="EquipmentBreakdownTime" value={formData.EquipmentBreakdownTime} onChange={handleChange} /></div>
                <div className="space-y-1.5"><Label>Tools Not Available Time</Label><Input type="number" name="ToolsNotAvailableTime" value={formData.ToolsNotAvailableTime} onChange={handleChange} /></div>
                <div className="space-y-1.5 md:col-span-2 lg:col-span-3 xl:col-span-4"><Label>Remarks</Label><Textarea name="Remarks" value={formData.Remarks} onChange={handleChange} /></div>
            </div>
            <div className="flex justify-end gap-x-4 pt-2">
                <Button type="button" variant="ghost" onClick={handleReset}>Reset</Button>
                <Button type="submit" className={cn("font-bold w-24", submitStatus === 'idle' && "bg-gradient-to-r from-blue-500 to-purple-600", submitStatus === 'success' && "bg-green-500", submitStatus === 'error' && "bg-red-500")} disabled={submitStatus !== 'idle'}>
                    {submitStatus === 'submitting' && <Loader2 className="h-5 w-5 animate-spin" />}
                    {submitStatus === 'success' && <Check className="h-5 w-5" />}
                    {submitStatus === 'error' && <X className="h-5 w-5" />}
                    {submitStatus === 'idle' && "Submit"}
                </Button>
            </div>
        </motion.form>
    );
};

export default WalterBasicEntry;