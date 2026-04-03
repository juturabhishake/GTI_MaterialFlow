"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Check, Loader2, AlertCircle, Save, RefreshCw, Calendar as CalendarIcon, ChevronsUpDown, Search, ChevronLeft, ChevronRight, FileDown, Trash2, ArrowLeft } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isSameMonth, isSameDay, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { generateCuttingToolPDF } from './cuttingToolsPdf';
import { useAdminAccessCheck } from '@/lib/checkAdmin';

const cn = (...classes) => classes.filter(Boolean).join(" ");

const Calendar = ({ value, onChange }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(value || new Date()));
  const header = () => (
    <div className="flex justify-between items-center mb-4 px-1">
      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{format(currentMonth, "MMMM yyyy")}</span>
      <div className="flex gap-1">
        <button onClick={(e) => { e.preventDefault(); setCurrentMonth(subMonths(currentMonth, 1)); }} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-primary/50 text-gray-600 dark:text-gray-300"><ChevronLeft className="h-4 w-4" /></button>
        <button onClick={(e) => { e.preventDefault(); setCurrentMonth(addMonths(currentMonth, 1)); }} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-primary/50 text-gray-600 dark:text-gray-300"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
  const days = () => {
    const startDate = startOfWeek(startOfMonth(currentMonth));
    const endDate = endOfWeek(endOfMonth(currentMonth));
    const rows = [];
    let days = [];
    let day = startDate;
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const isSelected = value ? isSameDay(day, new Date(value)) : false;
        const isCurrentMonth = isSameMonth(day, currentMonth);
        days.push(
          <div className="p-1 w-full" key={day.toString()}>
             <button type="button" disabled={!isCurrentMonth} onClick={() => onChange(cloneDay)} className={cn("h-8 w-8 text-sm rounded-md flex items-center justify-center transition-all", !isCurrentMonth ? "text-gray-300 dark:text-gray-600" : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100", isSelected && isCurrentMonth ? "bg-brand-500 text-white hover:bg-brand-600" : "")}>{format(day, "d")}</button>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7" key={day}>{days}</div>);
      days = [];
    }
    return <div><div className="grid grid-cols-7 mb-2">{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="text-xs text-center font-medium text-gray-500 dark:text-gray-400">{d}</div>)}</div>{rows}</div>;
  };
  return <div className="p-3 w-64 bg-card rounded-md border border-primary/10">{header()}{days()}</div>;
};

const ShadcnDatePicker = ({ value, onChange, label }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleSelect = (date) => { onChange(format(date, "yyyy-MM-dd")); setOpen(false); };
  return (
    <div className="flex flex-col gap-1 w-full" ref={ref}>
      {label && <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>}
      <div className="relative">
        <button type="button" onClick={() => setOpen(!open)} className={cn("w-full h-10 px-3 py-2 text-left font-normal rounded-lg border  flex items-center gap-2 focus:ring-2 focus:ring-brand-500 outline-none transition-all", "text-gray-900 dark:text-gray-100", !value && "text-gray-500")}>
          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />{value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
        </button>
        {open && <div className="absolute top-12 left-0 z-50 shadow-xl"><Calendar value={value} onChange={handleSelect} /></div>}
      </div>
    </div>
  );
};

const Combobox = ({ options, value, onChange, placeholder, loading, error, disabledValue, disabled }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const filteredOptions = query === "" ? options : options.filter((option) => option.ItemCode.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="relative w-full" ref={ref}>
      <button type="button" onClick={() => !loading && !disabled && setOpen(!open)} disabled={loading || disabled} className={cn("cursor-pointer flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", error ? "border-red-500" : "text-gray-900 dark:text-gray-100")}>
        <span className="truncate">{value ? value : placeholder}</span><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md bg-card border border-primary/40 shadow-lg overflow-hidden">
          <div className="flex items-center border-b dark:border-primary/40 px-3 py-2"><Search className="mr-2 h-4 w-4 opacity-50 dark:text-gray-300" /><input className="flex h-6 w-full bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-500" placeholder="Search..." onChange={(e) => setQuery(e.target.value)} autoFocus /></div>
          <div className="max-h-60 overflow-y-auto">{filteredOptions.length === 0 ? <div className="py-2 px-4 text-sm text-gray-500 dark:text-gray-400">No item found.</div> : filteredOptions.map((item) => {
            const isDisabled = item.ItemCode === disabledValue;
            return <div key={item.ItemCode} className={cn("relative select-none py-2 pl-2 pr-4 flex items-center sm:text-sm text-gray-900 dark:text-gray-100", isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-primary/10", value === item.ItemCode && "bg-primary/20 font-medium")} onClick={() => { if (!isDisabled) { onChange(item.ItemCode); setOpen(false); setQuery(""); } }}><Check className={cn("mr-2 h-4 w-4", value === item.ItemCode ? "opacity-100 text-brand-600 dark:text-brand-400" : "opacity-0")} />{item.ItemCode}</div>
          })}</div>
        </div>
      )}
      {error && <span className="text-xs text-red-500 flex items-center gap-1 mt-1"><AlertCircle size={10} /> {error}</span>}
    </div>
  );
};

const InputField = ({ label, value, onChange, type = "text", disabled = false, error, required = false }) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label} {required && <span className="text-red-500">*</span>}</label>}
    <input type={type} value={value} onChange={onChange} disabled={disabled} className={cn("w-full p-2.5 rounded-lg border text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 outline-none transition-all", disabled ? 'cursor-not-allowed text-gray-500 dark:text-gray-400' : '', error ? 'border-red-500' : '')} />
    {error && <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={10} /> {error}</span>}
  </div>
);

const CuttingToolEditForm = ({ item, onSave, onCancel, onDelete }) => {
  const PAGE_ID_FOR_THIS_FORM = 2032;
  const { hasAccess: isAdmin, isLoading: accessLoading } = useAdminAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsList, setItemsList] = useState([]);
  
  const [formData, setFormData] = useState({
    Id: item.Id,
    requestSection: item.RequestSection,
    date: item.RequestDate.split('T')[0],
    requestedBy: item.RequestedBy,
    receivedQty: item.ReceivedQty,
    receivedBy: item.ReceivedBy,
    checkedBy: item.CheckedBy
  });

  const [toolData, setToolData] = useState({
    from: { itemCode: item.From_ItemCode, spec: item.From_Specification, project: item.From_Project, op: item.From_Operation, drawing: item.From_DrawingNo },
    to: { itemCode: item.To_ItemCode, spec: item.To_Specification, project: item.To_Project, op: item.To_Operation, drawing: item.To_DrawingNo }
  });
  
  const getInitialPurposeKey = (pString) => {
    if (!pString) return '';
    if (pString === "Tool Life Issue") return 'toolLife';
    if (pString === "Quality Issue") return 'quality';
    if (pString === "Less Inventory") return 'lessInventory';
    if (pString === "Implementation") return 'implementation';
    return 'others';
  };

  const [purpose, setPurpose] = useState(getInitialPurposeKey(item.Purpose));
  const [othersDetail, setOthersDetail] = useState(getInitialPurposeKey(item.Purpose) === 'others' ? item.Purpose : "");
  
  const [reason, setReason] = useState(item.Reason);
  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState('idle');

  // Sync state if item changes
  useEffect(() => {
    const initKey = getInitialPurposeKey(item.Purpose);
    setPurpose(initKey);
    setOthersDetail(initKey === 'others' ? item.Purpose : "");
  }, [item.Purpose]);

  useEffect(() => {
    const fetchItems = async () => {
      setLoadingItems(true);
      try {
        const res = await fetch('/api/walter/items');
        if (res.ok) setItemsList(await res.json());
      } catch (error) { console.error(error); } finally { setLoadingItems(false); }
    };
    fetchItems();
  }, []);

  const handleItemSelect = async (side, code) => {
    setToolData(prev => ({ ...prev, [side]: { ...prev[side], itemCode: code, spec: 'Loading...', project: 'Loading...' } }));
    try {
      const res = await fetch('/api/purchaserequest/item-details', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemCode: code }) });
      const data = await res.json();
      setToolData(prev => ({ ...prev, [side]: { ...prev[side], itemCode: code, spec: data.SizeSpecifications || 'N/A', project: data.ProjectName || 'N/A' } }));
    } catch { setToolData(prev => ({ ...prev, [side]: { ...prev[side], spec: 'Error', project: 'Error' } })); }
  };

  const handleUpdate = async () => {
    let newErrors = {};
    if (!formData.receivedQty) newErrors.receivedQty = "Required";
    if (!toolData.from.itemCode || !toolData.to.itemCode) newErrors.itemCode = "Item Codes required";
    if (toolData.from.itemCode === toolData.to.itemCode) newErrors.to_itemCode = "Cannot be same as From";
    if (!reason.trim()) newErrors.reason = "Required";
    if (!purpose) newErrors.purpose = "Select a purpose";
    if (purpose === 'others' && !othersDetail.trim()) newErrors.others = "Specify details";

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setSubmitStatus('loading');
    
    let finalPurposeString = "";
    if (purpose === 'others') {
        finalPurposeString = othersDetail.trim();
    } else {
        const purposeMap = {
            'toolLife': "Tool Life Issue",
            'quality': "Quality Issue",
            'lessInventory': "Less Inventory",
            'implementation': "Implementation"
        };
        finalPurposeString = purposeMap[purpose] || "";
    }

    const payload = {
      Id: formData.Id,
      RequestSection: formData.requestSection,
      RequestDate: formData.date,
      RequestedBy: formData.requestedBy,
      CheckedBy: formData.checkedBy,
      ReceivedQty: parseInt(formData.receivedQty),
      ReceivedBy: formData.receivedBy,
      From_ItemCode: toolData.from.itemCode,
      From_Specification: toolData.from.spec,
      From_Project: toolData.from.project,
      From_Operation: toolData.from.op,
      From_DrawingNo: toolData.from.drawing,
      To_ItemCode: toolData.to.itemCode,
      To_Specification: toolData.to.spec,
      To_Project: toolData.to.project,
      To_Operation: toolData.to.op,
      To_DrawingNo: toolData.to.drawing,
      Purpose: finalPurposeString,
      Reason: reason
    };

    await onSave(payload);
    setSubmitStatus('success');
  };

  const handleReset = () => {
    setFormData({ ...formData, receivedQty: item.ReceivedQty, receivedBy: item.ReceivedBy, checkedBy: item.CheckedBy, date: item.RequestDate.split('T')[0] });
    setToolData({
        from: { itemCode: item.From_ItemCode, spec: item.From_Specification, project: item.From_Project, op: item.From_Operation, drawing: item.From_DrawingNo },
        to: { itemCode: item.To_ItemCode, spec: item.To_Specification, project: item.To_Project, op: item.To_Operation, drawing: item.To_DrawingNo }
    });
    const initKey = getInitialPurposeKey(item.Purpose);
    setPurpose(initKey);
    setOthersDetail(initKey === 'others' ? item.Purpose : "");
    setReason(item.Reason);
    setErrors({});
  };

  const handleExportPDF = () => {
    let finalPurposeString = "";
    if (purpose === 'others') finalPurposeString = othersDetail.trim();
    else {
        const purposeMap = { 'toolLife': "Tool Life Issue", 'quality': "Quality Issue", 'lessInventory': "Less Inventory", 'implementation': "Implementation" };
        finalPurposeString = purposeMap[purpose] || item.Purpose;
    }
    
    const exportData = {
        Id: formData.Id,
        RequestSection: formData.requestSection,
        RequestDate: formData.date,
        RequestedBy: formData.requestedBy,
        CheckedBy: formData.checkedBy,
        ReceivedQty: formData.receivedQty,
        ReceivedBy: formData.receivedBy,
        From_ItemCode: toolData.from.itemCode,
        From_Specification: toolData.from.spec,
        From_Project: toolData.from.project,
        From_Operation: toolData.from.op,
        From_DrawingNo: toolData.from.drawing,
        To_ItemCode: toolData.to.itemCode,
        To_Specification: toolData.to.spec,
        To_Project: toolData.to.project,
        To_Operation: toolData.to.op,
        To_DrawingNo: toolData.to.drawing,
        Purpose: finalPurposeString,
        Reason: reason
    };
    generateCuttingToolPDF(exportData);
  };

  return (
    <div className="@container/main bg-card rounded-xl shadow-lg border border-primary/50 p-6 space-y-6 h-full overflow-y-auto">
      <div className="flex justify-between items-center border-b dark:border-primary/20 pb-4">
        <h2 className="text-xl font-bold text-brand-500">Edit Request #{formData.Id}</h2>
        <div className="flex gap-2">
            <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 bg-primary/70 text-white rounded hover:bg-primary cursor-pointer transition-colors"><FileDown size={16} /> PDF</button>
            {isAdmin && (
                <button onClick={() => onDelete(formData.Id)} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer transition-colors"><Trash2 size={16} /> Delete</button>
            )}
            <button onClick={onCancel} className="flex items-center gap-2 px-3 py-2 border border-primary/50 cursor-pointer rounded text-gray-700 dark:text-gray-200 hover:bg-primary/30 transition-colors"><ArrowLeft size={16} /> Back</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InputField label="Request Section" value={formData.requestSection} disabled />
        {isAdmin ? (
            <ShadcnDatePicker label="Date" value={formData.date} onChange={(val) => setFormData(p => ({...p, date: val}))} />
        ) : (
            <InputField label="Date" value={formData.date} disabled />
        )}
        <InputField label="Requested By" value={formData.requestedBy} disabled />
        <InputField label="Checked By" value={formData.checkedBy} onChange={(e) => setFormData(p => ({...p, checkedBy: e.target.value}))} disabled={!isAdmin} />
        <InputField label="Received Qty" type="number" value={formData.receivedQty} onChange={(e) => setFormData(p => ({...p, receivedQty: e.target.value}))} error={errors.receivedQty} disabled={!isAdmin} />
        <InputField label="Received By" value={formData.receivedBy} onChange={(e) => setFormData(p => ({...p, receivedBy: e.target.value}))} disabled={!isAdmin} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-primary/30"></div>
        <div className="space-y-4">
            <h3 className="font-bold border-b dark:border-primary/20 pb-2 text-brand-500">Current (From)</h3>
            <Combobox options={itemsList} value={toolData.from.itemCode} onChange={(code) => handleItemSelect('from', code)} placeholder="Select Item" loading={loadingItems} disabledValue={toolData.to.itemCode} disabled={!isAdmin} />
            <InputField label="Spec" value={toolData.from.spec} disabled />
            <InputField label="Project" value={toolData.from.project} disabled />
            <InputField label="Operation" value={toolData.from.op} onChange={(e) => setToolData(p=>({...p, from: {...p.from, op: e.target.value}}))} disabled={!isAdmin} />
            <InputField label="Drawing" value={toolData.from.drawing} onChange={(e) => setToolData(p=>({...p, from: {...p.from, drawing: e.target.value}}))} disabled={!isAdmin} />
        </div>
        <div className="space-y-4">
            <h3 className="font-bold border-b dark:border-primary/20 pb-2 text-brand-500">Required (To)</h3>
            <Combobox options={itemsList} value={toolData.to.itemCode} onChange={(code) => handleItemSelect('to', code)} placeholder="Select Item" loading={loadingItems} disabledValue={toolData.from.itemCode} disabled={!isAdmin} />
            <InputField label="Spec" value={toolData.to.spec} disabled />
            <InputField label="Project" value={toolData.to.project} disabled />
            <InputField label="Operation" value={toolData.to.op} onChange={(e) => setToolData(p=>({...p, to: {...p.to, op: e.target.value}}))} disabled={!isAdmin} />
            <InputField label="Drawing" value={toolData.to.drawing} onChange={(e) => setToolData(p=>({...p, to: {...p.to, drawing: e.target.value}}))} disabled={!isAdmin} />
        </div>
      </div>
      <div>
        <label className="font-bold block mb-2 text-gray-700 dark:text-gray-300">Purpose</label>
        <div className="flex flex-wrap gap-4 mb-4">
            {['toolLife', 'quality', 'lessInventory', 'implementation', 'others'].map(k => (
                <label key={k} className={`flex items-center gap-2 cursor-pointer px-3 py-1 rounded border dark:border-primary/20 text-gray-800 dark:text-gray-200 ${!isAdmin ? 'pointer-events-none' : ''}`}>
                    <input 
                      type="radio" 
                      name="purpose_edit" 
                      checked={purpose === k} 
                      onChange={() => isAdmin && setPurpose(k)} 
                      // Removed disabled={!isAdmin} to fix visibility issue
                      className="accent-brand-500" 
                    /> 
                    <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')} {k === 'toolLife' || k === 'quality' ? 'Issue' : ''}</span>
                </label>
            ))}
        </div>
        {purpose === 'others' && <input className="w-full md:w-1/2 border border-primary/40 text-gray-900 dark:text-white rounded px-2 py-2 outline-none focus:border-brand-500 mb-2 disabled:bg-gray-100 disabled:text-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-400" value={othersDetail} onChange={e => setOthersDetail(e.target.value)} placeholder="Specify..." disabled={!isAdmin} />}
        
        <label className="font-bold block mb-2 text-gray-700 dark:text-gray-300">Reason</label>
        <textarea className="w-full border dark:border-primary/40 text-gray-900 dark:text-white rounded p-2 outline-none focus:border-brand-500 disabled:bg-gray-100 disabled:text-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-400" rows={3} value={reason} onChange={e => setReason(e.target.value)} disabled={!isAdmin} />
      </div>
      {isAdmin && (
          <div className="flex justify-end gap-4 pt-4 border-t dark:border-primary/20">
            <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 border dark:border-primary/20 text-gray-700 dark:text-gray-200 rounded hover:bg-primary/50 cursor-pointer transition-colors"><RefreshCw size={16} /> Reset</button>
            <button onClick={handleUpdate} disabled={submitStatus === 'loading'} className="flex items-center gap-2 px-6 py-2 bg-primary/70 text-white rounded hover:bg-primary cursor-pointer transition-colors">
                {submitStatus === 'loading' ? <Loader2 className="animate-spin" /> : <Save size={16} />} Update
            </button>
          </div>
      )}
    </div>
  );
};
export default CuttingToolEditForm;