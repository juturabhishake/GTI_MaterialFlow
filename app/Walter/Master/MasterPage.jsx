"use client";

import React, { useState, useEffect } from 'react';
import SecureLS from 'secure-ls';
import { motion } from 'framer-motion';
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const MasterPage = () => {
    const initialFormState = {
        itemCode: "",
        sizeSpecifications: "",
        cycleTime: "",
        piece: "",
        setupMinutes: "",
    };
    const [items, setItems] = useState([]);
    const [formData, setFormData] = useState(initialFormState);
    const [errors, setErrors] = useState({});
    const [open, setOpen] = useState(false);
    const [isFetchingItems, setIsFetchingItems] = useState(true);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);
    const [submitStatus, setSubmitStatus] = useState('idle');

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await fetch('/api/walter/items');
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                setItems(data);
            } catch (error) {
                toast.error("Fetch Error", { description: "Failed to fetch items." });
            } finally {
                setIsFetchingItems(false);
            }
        };
        fetchItems();
    }, []);

    useEffect(() => {
        if (submitStatus === 'success' || submitStatus === 'error') {
            const timer = setTimeout(() => {
                setSubmitStatus('idle');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [submitStatus]);

    const handleItemSelect = async (selectedItemCode) => {
        setFormData(prev => ({ ...initialFormState, itemCode: selectedItemCode }));
        setErrors({});
        setOpen(false);
        setIsFetchingDetails(true);
        try {
            const response = await fetch('/api/walter/item-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemCode: selectedItemCode }),
            });
            if (!response.ok) throw new Error('Failed to fetch details');
            const result = await response.json();
            setFormData(prev => ({ ...prev, sizeSpecifications: result.sizeSpecifications }));
        } catch (error) {
            toast.error("Error", { description: "Could not fetch size specifications." });
        } finally {
            setIsFetchingDetails(false);
        }
    };
    
    const validateForm = () => {
        const newErrors = {};
        if (!formData.itemCode) newErrors.itemCode = "Please select an item.";
        if (!formData.cycleTime || Number(formData.cycleTime) <= 0) newErrors.cycleTime = "Must be a positive number.";
        if (!formData.piece || !Number.isInteger(Number(formData.piece)) || Number(formData.piece) <= 0) newErrors.piece = "Must be a positive integer.";
        if (!formData.setupMinutes || !Number.isInteger(Number(formData.setupMinutes)) || Number(formData.setupMinutes) <= 0) newErrors.setupMinutes = "Must be a positive integer.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setSubmitStatus('submitting');
        try {
            let employeeId = '';
            try{
                const ls = new SecureLS({ encodingType: 'aes' });
                employeeId = ls.get('employee_id');
            }
            catch{
                employeeId = 'SYSTEM';
            }
            if (!employeeId) throw new Error("Employee ID not found.");
            const payload = {
                spName: 'SP_Insert_WalterMaster',
                data: { ...formData, employeeId }
            };
            const response = await fetch('/api/walter/master/insert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            toast.success("Success", { description: result.message });
            setFormData(initialFormState);
            setErrors({});
            setSubmitStatus('success');
        } catch (error) {
            toast.error("Submission Failed", { description: error.message });
            setSubmitStatus('error');
        }
    };

    const handleReset = () => {
        setFormData(initialFormState);
        setErrors({});
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="w-full">
            <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                onSubmit={handleSubmit}
                className="space-y-6"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <div className="space-y-1.5">
                        <Label htmlFor="itemCode" className="text-sm font-medium text-slate-400">Item Code</Label>
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button id="itemCode" variant="outline" role="combobox" disabled={isFetchingItems} className={cn("w-full justify-between", !formData.itemCode && "text-slate-400")}>
                                    {isFetchingItems ? "Loading..." : formData.itemCode || "Select item..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search item code..." />
                                    <CommandEmpty>No item found.</CommandEmpty>
                                    <CommandGroup className="max-h-60 overflow-y-auto">
                                        {items.map((item) => (
                                            <CommandItem key={item.ItemCode} value={item.ItemCode} onSelect={() => handleItemSelect(item.ItemCode)}>
                                                <Check className={cn("mr-2 h-4 w-4", item.ItemCode === formData.itemCode ? "opacity-100" : "opacity-0")} />
                                                {item.ItemCode}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {errors.itemCode && <p className="text-xs text-red-500 mt-1">{errors.itemCode}</p>}
                    </div>

                    <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                        <Label htmlFor="sizeSpecifications" className="text-sm font-medium text-slate-400">Size Specifications</Label>
                        <div className="relative">
                            <Input id="sizeSpecifications" name="sizeSpecifications" value={formData.sizeSpecifications} readOnly className="cursor-not-allowed" placeholder='Select Itemcode' />
                            {isFetchingDetails && (
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="cycleTime" className="text-sm font-medium text-slate-400">Cycle Time</Label>
                        <Input id="cycleTime" name="cycleTime" type="number" step="0.01" placeholder="e.g., 10.5" value={formData.cycleTime} onChange={handleChange} className="focus:border-primary" />
                        {errors.cycleTime && <p className="text-xs text-red-500 mt-1">{errors.cycleTime}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="piece" className="text-sm font-medium text-slate-400">Piece</Label>
                        <Input id="piece" name="piece" type="number" placeholder="e.g., 1" value={formData.piece} onChange={handleChange} className="focus:border-primary" />
                        {errors.piece && <p className="text-xs text-red-500 mt-1">{errors.piece}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="setupMinutes" className="text-sm font-medium text-slate-400">Setup Minutes</Label>
                        <Input id="setupMinutes" name="setupMinutes" type="number" placeholder="e.g., 30" value={formData.setupMinutes} onChange={handleChange} className="focus:border-primary" />
                        {errors.setupMinutes && <p className="text-xs text-red-500 mt-1">{errors.setupMinutes}</p>}
                    </div>
                </div>

                <div className="flex justify-end gap-x-4 pt-2">
                    <Button type="button" variant="ghost" onClick={handleReset} className="hover:bg-slate-700">
                        Reset
                    </Button>
                    <Button 
                        type="submit" 
                        className={cn(
                            "font-bold tracking-wider transition-all duration-300 w-24",
                            submitStatus === 'idle' && "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
                            submitStatus === 'success' && "bg-green-500",
                            submitStatus === 'error' && "bg-red-500"
                        )}
                        disabled={submitStatus !== 'idle'}
                    >
                        {submitStatus === 'submitting' && <Loader2 className="h-5 w-5 animate-spin" />}
                        {submitStatus === 'success' && <Check className="h-5 w-5" />}
                        {submitStatus === 'error' && <X className="h-5 w-5" />}
                        {submitStatus === 'idle' && "Submit"}
                    </Button>
                </div>
            </motion.form>
        </div>
    );
};

export default MasterPage;