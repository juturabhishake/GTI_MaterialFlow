"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Loader2, Search, X, Pencil, Eye, Image as ImageIcon, ChevronsUpDown, Check, FileText, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Save, FileSpreadsheet, ArrowUpDown, ArrowUp, ArrowDown, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import SecureLS from "secure-ls";
import { exportToExcel } from "@/components/exportUtils"; 
import { useAdminAccessCheck } from "@/lib/checkAdmin";
import { useAccessCheck } from '@/lib/useAccessCheck';

const MultiSelectCombobox = ({ options, selected = [], onSelectedChange, placeholder }) => {
    const [open, setOpen] = useState(false);
    const safeSelected = Array.isArray(selected) ? selected : []; 
    
    const handleSelect = (val) => onSelectedChange(safeSelected.includes(val) ? safeSelected.filter(i => i !== val) : [...safeSelected, val]);
    
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-9 px-3 font-normal text-xs md:text-sm cursor-pointer">
                    <div className="flex items-center gap-1 truncate">
                        {safeSelected.length > 0 ? `${safeSelected.length} selected` : <span className="text-muted-foreground">{placeholder}</span>}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 ml-2 opacity-50 shrink-0" />
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
                                    <Check className={cn("mr-2 h-4 w-4", safeSelected.includes(o.value) ? "opacity-100" : "opacity-0")} />
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

export default function ItemMasterView() {
    const PAGE_ID_FOR_THIS_FORM = 2036;
    const { hasAccess: isAdmin } = useAdminAccessCheck(PAGE_ID_FOR_THIS_FORM);
    const { isLoading: isAccessLoading, hasAccess } = useAccessCheck(PAGE_ID_FOR_THIS_FORM);
    const [data, setData] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [globalSearch, setGlobalSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [filters, setFilters] = useState({ Item_Code: [], Item_Spec: [], Item_Des: [], Is_Critical: [] });
    const [tableColumnFilters, setTableColumnFilters] = useState({ Item_Code: [], Item_Spec: [], Item_Des: [], UOM: [], Item_Location: [], Standard_Stock: [], Safety_Stock: [], Is_Critical: [] });
    const [filterOptions, setFilterOptions] = useState({ Item_Code: [], Item_Spec: [], Item_Des: [], Is_Critical: [] });
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    
    const [modalConfig, setModalConfig] = useState({ isOpen: false, mode: 'view', row: null });
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [exportState, setExportState] = useState('idle');
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const ls = useRef(null);
    const [empId, setEmpId] = useState("SYSTEM");

    useEffect(() => {
        ls.current = new SecureLS({ encodingType: "aes" });
        try {
            setEmpId(ls.current.get("employee_id") || "SYSTEM");
        } catch (e) {}
        fetchFilterOptions();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setGlobalSearch(searchInput), 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        fetchData();
    }, [page, pageSize, globalSearch, filters]);

    const fetchFilterOptions = async () => {
        try {
            const res = await fetch('/api/item-master/get-filters');
            if (res.ok) {
                const json = await res.json();
                setFilterOptions({
                    Item_Code: json[0].map(i => ({ label: i.Item_Code, value: i.Item_Code })),
                    Item_Spec: json[1].map(i => ({ label: i.Item_Spec, value: i.Item_Spec })),
                    Item_Des: json[2].map(i => ({ label: i.Item_Des, value: i.Item_Des })),
                    Is_Critical: json[3].map(i => ({ label: i.Is_Critical === '1' ? 'Yes' : 'No', value: i.Is_Critical }))
                });
            }
        } catch (e) {}
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/item-master/get-paginated", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    page,
                    pageSize: pageSize === 'All' ? 999999 : pageSize,
                    search: globalSearch,
                    itemCodes: filters.Item_Code,
                    itemSpecs: filters.Item_Spec,
                    itemDescs: filters.Item_Des,
                    isCriticals: filters.Is_Critical,
                    sortCol: 'Item_Id',
                    sortDir: 'DESC'
                })
            });
            const json = await res.json();
            setData(json);
            setTotalRecords(json.length > 0 ? json[0].TotalRecords : 0);
        } catch (e) {
            toast.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    const processedData = useMemo(() => {
        let result = [...data];
        Object.keys(tableColumnFilters).forEach(key => {
            const selectedVals = tableColumnFilters[key];
            if (selectedVals && selectedVals.length > 0) {
                result = result.filter(item => selectedVals.includes(String(item[key] || "")));
            }
        });
        if (sortConfig.key && sortConfig.direction) {
            result.sort((a, b) => {
                let valA = a[sortConfig.key] || "";
                let valB = b[sortConfig.key] || "";
                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();
                if (valA < valB) return sortConfig.direction === 'ASC' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ASC' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [data, tableColumnFilters, sortConfig]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/item-master/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    itemId: formData.Item_Id,
                    itemCode: formData.Item_Code,
                    location: formData.Item_Location,
                    stdStock: parseInt(formData.Standard_Stock) || 0,
                    safetyStock: parseFloat(formData.Safety_Stock) || 0,
                    image: formData.Item_Image,
                    isCritical: formData.Is_Critical,
                    updatedBy: empId
                })
            });
            if (res.ok) {
                toast.success("Updated successfully");
                setModalConfig({ isOpen: false, mode: 'view', row: null });
                fetchData();
            } else throw new Error();
        } catch (e) {
            toast.error("Update failed");
        } finally {
            setIsSaving(false);
        }
    };

    const handleImage = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setFormData(p => ({ ...p, Item_Image: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    const handleExportClick = async () => {
        if (processedData.length === 0) return;
        setExportState('loading');
        try {
            await exportToExcel(processedData, "Item_Master_Report"); 
            setExportState('success');
            setTimeout(() => setExportState('idle'), 2000);
        } catch (error) {
            setExportState('error');
            toast.error("Export failed");
            setTimeout(() => setExportState('idle'), 2000);
        }
    };

    const openModal = (row, mode) => {
        setFormData({ ...row });
        setModalConfig({ isOpen: true, mode, row });
        setPosition({ x: 0, y: 0 });
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
        };
        const handleMouseUp = () => setIsDragging(false);
        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
        }
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging]);

    const handleSort = (key) => {
        setSortConfig((current) => {
            if (current.key === key) {
                if (current.direction === 'ASC') return { key, direction: 'DESC' };
                if (current.direction === 'DESC') return { key: null, direction: null };
            }
            return { key, direction: 'ASC' };
        });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key || !sortConfig.direction) return <ArrowUpDown className="h-3 w-3 opacity-30 ml-1" />;
        if (sortConfig.direction === 'ASC') return <ArrowUp className="h-3 w-3 ml-1" />;
        return <ArrowDown className="h-3 w-3 ml-1" />;
    };

    const getUniqueOptions = (key) => {
        const uniqueValues = Array.from(new Set(data.map(item => item[key]))).filter(v => v !== null && v !== undefined && v !== '');
        return uniqueValues.map(v => {
            let label = String(v);
            if (key === 'Is_Critical') {
                label = (v === true || v === 1 || v === '1' || v === 'true') ? 'Yes' : 'No';
            }
            return { label, value: String(v) };
        });
    };

    const totalPages = pageSize === 'All' ? 1 : Math.ceil(totalRecords / pageSize);
    const currentLimit = pageSize === 'All' ? totalRecords : pageSize;

    return (
        <div className="@container/main flex flex-col h-screen overflow-hidden bg-background space-y-2 font-sans w-full">
            <div hidden className="flex-none flex flex-col md:flex-row items-start md:items-center justify-between bg-card p-4 rounded-lg shadow-sm border border-border gap-4">
                <div>
                    <h1 className="text-xl font-bold text-primary">Item Master</h1>
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
                </div>
            </div>

            <div className="flex-none flex flex-wrap xl:flex-row gap-4 bg-card p-4 rounded-lg shadow-sm border border-border">
                <div className="relative flex-grow min-w-[250px]">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Global search..." value={searchInput} onChange={e => setSearchInput(e.target.value)} className="pl-9 w-full" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 w-full xl:w-auto">
                    <MultiSelectCombobox options={filterOptions.Item_Code} selected={filters.Item_Code} onSelectedChange={(v) => { setFilters(p => ({ ...p, Item_Code: v })); setPage(1); }} placeholder="Item Code" />
                    <MultiSelectCombobox options={filterOptions.Item_Spec} selected={filters.Item_Spec} onSelectedChange={(v) => { setFilters(p => ({ ...p, Item_Spec: v })); setPage(1); }} placeholder="Item Spec" />
                    <MultiSelectCombobox options={filterOptions.Item_Des} selected={filters.Item_Des} onSelectedChange={(v) => { setFilters(p => ({ ...p, Item_Des: v })); setPage(1); }} placeholder="Item Desc" />
                    <MultiSelectCombobox options={filterOptions.Is_Critical} selected={filters.Is_Critical} onSelectedChange={(v) => { setFilters(p => ({ ...p, Is_Critical: v })); setPage(1); }} placeholder="Critical" />
                    <Button 
                        variant={exportState === 'error' ? "destructive" : exportState === 'success' ? "default" : "outline"} 
                        onClick={handleExportClick} 
                        disabled={processedData.length === 0 || exportState === 'loading'}
                        className={cn("w-full h-9 p-0 transition-all duration-300 cursor-pointer", exportState === 'success' && "bg-green-600 hover:bg-green-700")}
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
                    <table className="w-full text-xs text-left border-collapse min-w-[1200px]">
                        <thead className="bg-primary text-primary-foreground uppercase font-bold text-[10px] sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-3 w-16 text-center border-r border-primary-foreground/20 bg-primary">Action</th>
                                <th className="p-3 border-r border-primary-foreground/20 bg-primary">
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center cursor-pointer select-none hover:text-yellow-200" onClick={() => handleSort('Item_Code')}>
                                            Item Code {getSortIcon('Item_Code')}
                                        </div>
                                        <ColumnFilterPopover options={getUniqueOptions('Item_Code')} selected={tableColumnFilters.Item_Code} onSelectedChange={(v) => setTableColumnFilters(p => ({ ...p, Item_Code: v }))} title="Item Code" />
                                    </div>
                                </th>
                                <th className="p-3 border-r border-primary-foreground/20 bg-primary">
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center cursor-pointer select-none hover:text-yellow-200" onClick={() => handleSort('Item_Spec')}>
                                            Specification {getSortIcon('Item_Spec')}
                                        </div>
                                        <ColumnFilterPopover options={getUniqueOptions('Item_Spec')} selected={tableColumnFilters.Item_Spec} onSelectedChange={(v) => setTableColumnFilters(p => ({ ...p, Item_Spec: v }))} title="Specification" />
                                    </div>
                                </th>
                                <th className="p-3 border-r border-primary-foreground/20 bg-primary">
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center cursor-pointer select-none hover:text-yellow-200" onClick={() => handleSort('Item_Des')}>
                                            Description {getSortIcon('Item_Des')}
                                        </div>
                                        <ColumnFilterPopover options={getUniqueOptions('Item_Des')} selected={tableColumnFilters.Item_Des} onSelectedChange={(v) => setTableColumnFilters(p => ({ ...p, Item_Des: v }))} title="Description" />
                                    </div>
                                </th>
                                <th className="p-3 border-r border-primary-foreground/20 bg-primary">
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center cursor-pointer select-none hover:text-yellow-200" onClick={() => handleSort('UOM')}>
                                            UOM {getSortIcon('UOM')}
                                        </div>
                                        <ColumnFilterPopover options={getUniqueOptions('UOM')} selected={tableColumnFilters.UOM} onSelectedChange={(v) => setTableColumnFilters(p => ({ ...p, UOM: v }))} title="UOM" />
                                    </div>
                                </th>
                                <th className="p-3 border-r border-primary-foreground/20 bg-primary">
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center cursor-pointer select-none hover:text-yellow-200" onClick={() => handleSort('Item_Location')}>
                                            Location {getSortIcon('Item_Location')}
                                        </div>
                                        <ColumnFilterPopover options={getUniqueOptions('Item_Location')} selected={tableColumnFilters.Item_Location} onSelectedChange={(v) => setTableColumnFilters(p => ({ ...p, Item_Location: v }))} title="Location" />
                                    </div>
                                </th>
                                <th className="p-3 border-r border-primary-foreground/20 bg-primary">
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center cursor-pointer select-none hover:text-yellow-200" onClick={() => handleSort('Standard_Stock')}>
                                            Standard Stock {getSortIcon('Standard_Stock')}
                                        </div>
                                        <ColumnFilterPopover options={getUniqueOptions('Standard_Stock')} selected={tableColumnFilters.Standard_Stock} onSelectedChange={(v) => setTableColumnFilters(p => ({ ...p, Standard_Stock: v }))} title="Standard Stock" />
                                    </div>
                                </th>
                                <th className="p-3 border-r border-primary-foreground/20 bg-primary">
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center cursor-pointer select-none hover:text-yellow-200" onClick={() => handleSort('Safety_Stock')}>
                                            Safety Stock {getSortIcon('Safety_Stock')}
                                        </div>
                                        <ColumnFilterPopover options={getUniqueOptions('Safety_Stock')} selected={tableColumnFilters.Safety_Stock} onSelectedChange={(v) => setTableColumnFilters(p => ({ ...p, Safety_Stock: v }))} title="Safety Stock" />
                                    </div>
                                </th>
                                <th className="p-3 bg-primary">
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center cursor-pointer select-none hover:text-yellow-200" onClick={() => handleSort('Is_Critical')}>
                                            Critical {getSortIcon('Is_Critical')}
                                        </div>
                                        <ColumnFilterPopover options={getUniqueOptions('Is_Critical')} selected={tableColumnFilters.Is_Critical} onSelectedChange={(v) => setTableColumnFilters(p => ({ ...p, Is_Critical: v }))} title="Critical" />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan="9" className="h-[calc(100vh-340px)] text-center align-middle"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></td></tr>
                            ) : processedData.length > 0 ? processedData.map((row) => (
                                <tr key={row.Item_Id} className="hover:bg-muted/50 transition-colors">
                                    <td className="p-2 border-r text-center">
                                        <Button disabled={!isAdmin && !row.Item_Image} variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => openModal(row, isAdmin ? 'edit' : 'view')}>
                                            {isAdmin ? <Pencil className="h-3.5 w-3.5 text-primary" /> : <Eye className="h-3.5 w-3.5 text-gray-600" />}
                                        </Button>
                                    </td>
                                    <td className="p-2 border-r">{row.Item_Code || "-"}</td>
                                    <td className="p-2 border-r">{row.Item_Spec || "-"}</td>
                                    <td className="p-2 border-r truncate max-w-[200px]" title={row.Item_Des}>{row.Item_Des || "-"}</td>
                                    <td className="p-2 border-r">{row.UOM || "-"}</td>
                                    <td className="p-2 border-r">{row.Item_Location || "-"}</td>
                                    <td className="p-2 border-r">{row.Standard_Stock ?? "-"}</td>
                                    <td className="p-2 border-r">{row.Safety_Stock ?? "-"}</td>
                                    <td className="p-2">{row.Is_Critical ? "Yes" : "No"}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="9" className="h-[calc(100vh-340px)] text-center text-muted-foreground align-middle"><FileText className="h-10 w-10 opacity-20 mx-auto mb-2" />No records found</td></tr>
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

            {modalConfig.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" onMouseDown={(e) => { if(e.target === e.currentTarget) setModalConfig({isOpen: false}) }}>
                    <div 
                        // className="bg-card w-full max-w-2xl p-6 rounded-xl shadow-xl border relative flex flex-col max-h-[90vh]"
                        className="bg-card w-[calc(100%-2rem)] max-w-2xl p-4 sm:p-6 rounded-xl shadow-xl border relative flex flex-col max-h-[75vh] sm:max-h-[90vh]"
                        style={{ transform: `translate(${position.x}px, ${position.y}px)`, transition: isDragging ? "none" : "transform 0.05s ease-out" }}
                    >
                        <div className="flex justify-between items-center mb-4 border-b pb-2 cursor-move select-none" onMouseDown={handleMouseDown}>
                            <h3 className="text-lg font-bold text-primary flex items-center gap-2 pointer-events-none">
                                {modalConfig.mode === 'edit' ? <Pencil className="h-5 w-5"/> : <Eye className="h-5 w-5"/>} 
                                {modalConfig.mode === 'edit' ? 'Edit Item' : 'View Item'} - {modalConfig.row?.Item_Code}
                            </h3>
                            <Button variant="ghost" size="icon" onMouseDown={e => e.stopPropagation()} onClick={() => setModalConfig({isOpen: false})} className="h-8 w-8 rounded-full cursor-pointer"><X className="h-5 w-5" /></Button>
                        </div>
                        
                        {/* <div className="flex-1 overflow-auto p-1"> */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-1 sm:p-2 min-h-0 pr-2">
                            {/* <div className="flex flex-col sm:flex-row sm:items-start justify-between bg-muted/30 p-3 rounded-md mb-4 gap-4"> */}
                            <div className={cn("flex flex-col sm:flex-row sm:items-start justify-between bg-muted/30 p-3 rounded-md mb-4 gap-4", modalConfig.mode === 'view' && "hidden")}>
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <p><strong className="text-foreground">Spec:</strong> {modalConfig.row?.Item_Spec}</p>
                                    <p><strong className="text-foreground">Desc:</strong> {modalConfig.row?.Item_Des}</p>
                                </div>
                                <div className="flex items-center gap-3 bg-background/50 p-2 rounded-lg border border-border/50 shrink-0">
                                    <span className="text-xs font-semibold">Critical Part?</span>
                                    <Button
                                        type="button"
                                        variant={formData.Is_Critical ? "destructive" : "secondary"}
                                        size="sm"
                                        className={cn("h-7 px-3 text-xs cursor-pointer transition-colors", 
                                            !formData.Is_Critical && "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300"
                                        )}
                                        onClick={() => modalConfig.mode === 'edit' && setFormData(p => ({ ...p, Is_Critical: !p.Is_Critical }))}
                                        disabled={modalConfig.mode === 'view'}
                                    >
                                        {formData.Is_Critical ? "YES (Critical)" : "NO (Uncritical)"}
                                    </Button>
                                </div>
                            </div>
                            <div className={cn("flex gap-4", modalConfig.mode === 'edit' ? "flex-col md:flex-row" : "flex-col")}>
                                <div className={cn("flex flex-col", modalConfig.mode === 'edit' ? "w-full md:w-1/2 border border-primary/10 rounded-lg p-2 group " : "w-full")}>
                                    {/* <span className="text-[10px] font-bold uppercase text-center block mb-2 opacity-70 tracking-wider">Item Image</span> */}
                                    {modalConfig.mode === 'edit' && (
                                        <span className="text-[10px] font-bold uppercase text-center block mb-2 opacity-70 tracking-wider">
                                            Item Image
                                        </span>
                                    )}
                                    <div className={cn("h-48 border-2 border-dashed border-primary/20 rounded-lg flex flex-col items-center justify-center relative overflow-hidden group-hover:border-primary/50", modalConfig.mode === 'view' && "h-95 border-2 border-dashed border-primary/20 rounded-lg flex flex-col items-center justify-center relative overflow-hidden group-hover:border-primary/50")}>
                                        {formData.Item_Image ? (
                                            <>
                                                <img 
                                                    src={formData.Item_Image} 
                                                    className="w-full h-full object-contain" 
                                                />
                                                {modalConfig.mode === 'edit' && (
                                                    <button onClick={() => setFormData(p=>({...p, Item_Image: null}))} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full cursor-pointer z-10 shadow-lg"><X size={12}/></button>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-center">
                                                <ImageIcon size={32} className="opacity-10 mx-auto" />
                                                <p className="text-[10px] font-bold opacity-30 uppercase mt-2">{modalConfig.mode === 'edit' ? 'UPLOAD IMAGE' : 'NO IMAGE'}</p>
                                                {modalConfig.mode === 'edit' && <input type="file" onChange={handleImage} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {modalConfig.mode === 'edit' && (
                                    <div className="w-full md:w-1/2 flex flex-col gap-3 justify-center">
                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Item Location</label>
                                            <Input value={formData.Item_Location || ''} onChange={e => setFormData(p => ({...p, Item_Location: e.target.value}))} className="h-9 text-sm" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Standard Stock</label>
                                            <Input type="number" value={formData.Standard_Stock || ''} onChange={e => setFormData(p => ({...p, Standard_Stock: e.target.value}))} className="h-9 text-sm" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Safety Stock</label>
                                            <Input type="number" step="any" value={formData.Safety_Stock || ''} onChange={e => setFormData(p => ({...p, Safety_Stock: e.target.value}))} className="h-9 text-sm" />
                                        </div>
                                        <Button onClick={handleSave} disabled={isSaving} className="w-full mt-2 cursor-pointer">
                                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save Changes
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}