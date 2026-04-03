"use client";
import React, { useState, useEffect, useRef } from 'react';
import SecureLS from "secure-ls";
import { Check, X, Loader2, AlertCircle, Save, RefreshCw, Calendar as CalendarIcon, ChevronsUpDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addDays  } from 'date-fns';

const cn = (...classes) => classes.filter(Boolean).join(" ");

const Calendar = ({ value, onChange }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const header = () => {
    return (
      <div className="flex justify-between items-center mb-4 px-1">
        <span className="text-sm font-semibold">{format(currentMonth, "MMMM yyyy")}</span>
        <div className="flex gap-1">
          <button onClick={(e) => { e.preventDefault(); setCurrentMonth(subMonths(currentMonth, 1)); }} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-primary/50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={(e) => { e.preventDefault(); setCurrentMonth(addMonths(currentMonth, 1)); }} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-primary/50">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  const days = () => {
    const startDate = startOfWeek(startOfMonth(currentMonth));
    const endDate = endOfWeek(endOfMonth(currentMonth));
    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        const isSelected = value ? isSameDay(day, new Date(value)) : false;
        const isCurrentMonth = isSameMonth(day, currentMonth);

        days.push(
          <div
            className={`p-1 w-full`}
            // key={day}
            key={day.toString()}
          >
             <button
                type="button"
                disabled={!isCurrentMonth}
                onClick={() => onChange(cloneDay)}
                className={cn(
                  "h-8 w-8 text-sm rounded-md flex items-center justify-center transition-all",
                  !isCurrentMonth ? "text-gray-300 dark:text-gray-600" : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white",
                  isSelected && isCurrentMonth ? "bg-brand-500 text-white hover:bg-brand-600 hover:text-white" : ""
                )}
             >
              {formattedDate}
             </button>
          </div>
        );
        // day = new Date(day.setDate(day.getDate() + 1));
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day}>
          {days}
        </div>
      );
      days = [];
    }
    
    return (
        <div>
            <div className="grid grid-cols-7 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="text-xs text-center font-medium text-gray-500">{d}</div>
                ))}
            </div>
            {rows}
        </div>
    );
  };

  return (
    <div className="p-3 w-64">
      {header()}
      {days()}
    </div>
  );
};

const ShadcnDatePicker = ({ value, onChange, label }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (date) => {
    onChange(format(date, "yyyy-MM-dd"));
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-1 w-full" ref={ref}>
      {label && <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full h-10 px-3 py-2 text-left font-normal rounded-lg border flex items-center gap-2 focus:ring-2 focus:ring-brand-500 outline-none transition-all",
            "border-primary/50 text-gray-900 dark:text-white",
            !value && "text-gray-500 dark:text-gray-400"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
          {value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
        </button>
        {open && (
          <div className="absolute top-12 left-0 z-50 bg-card border border-primary/50 rounded-md shadow-lg animate-in fade-in zoom-in-95 duration-200">
            <Calendar value={value} onChange={handleSelect} />
          </div>
        )}
      </div>
    </div>
  );
};

const Combobox = ({ options, value, onChange, placeholder, loading, error, disabledValue }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = query === ""
    ? options
    : options.filter((option) =>
        option.ItemCode.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => !loading && setOpen(!open)}
        disabled={loading}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-red-500 ring-red-500" : "border-input",
          loading ? "opacity-50" : "text-gray-900 dark:text-white border-primary/50 focus:ring-brand-500"
        )}
      >
        <span className="truncate">
          {value ? value : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-primary/50 bg-card shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden">
          <div className="flex items-center border-b border-primary/50 px-3 pb-2 pt-2 bg-primary/1 z-10 relative">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-6 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 dark:text-white"
              placeholder="Search item..."
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300 sm:text-sm">
                No item found.
              </div>
            ) : (
              filteredOptions.map((item) => {
                const isDisabled = item.ItemCode === disabledValue;
                return (
                  <div
                    key={item.ItemCode}
                    className={cn(
                      "relative select-none py-2 pl-2 pr-4 flex items-center sm:text-sm",
                      isDisabled ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800 text-gray-400" : "cursor-pointer hover:bg-brand-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100",
                      value === item.ItemCode && !isDisabled && "bg-brand-50 dark:bg-gray-700 font-medium"
                    )}
                    onClick={() => {
                      if (!isDisabled) {
                        onChange(item.ItemCode);
                        setOpen(false);
                        setQuery("");
                      }
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === item.ItemCode ? "opacity-100 text-brand-600" : "opacity-0"
                      )}
                    />
                    {item.ItemCode}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
      {error && <span className="text-xs text-red-500 animate-pulse flex items-center gap-1 mt-1"><AlertCircle size={10} /> {error}</span>}
    </div>
  );
};

const InputField = ({ label, value, onChange, type = "text", disabled = false, placeholder = "", error, required = false }) => (
  <div className="flex flex-col gap-1 w-full transition-all duration-300">
    {label && <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label} {required && <span className="text-red-500">*</span>}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className={`w-full p-2.5 rounded-lg border text-gray-900 dark:text-white 
      focus:ring-2 focus:ring-brand-500 outline-none transition-all duration-200
      ${disabled ? 'cursor-not-allowed text-gray-500' : 'hover:border-brand-400'}
      ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-primary/50'}`}
    />
    {error && <span className="text-xs text-red-500 animate-pulse flex items-center gap-1"><AlertCircle size={10} /> {error}</span>}
  </div>
);

const CuttingToolReq = () => {
  const ls = useRef(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsList, setItemsList] = useState([]);
  
  const [formData, setFormData] = useState({
    requestSection: 'Tool Room',
    date: new Date().toISOString().split('T')[0],
    requestedBy: '',
    receivedQty: '',
    receivedBy: '',
    checkedBy: ''
  });

  const [toolData, setToolData] = useState({
    from: { itemCode: '', spec: '', project: '', op: '', drawing: '' },
    to:   { itemCode: '', spec: '', project: '', op: '', drawing: '' }
  });

  // const [purpose, setPurpose] = useState({
  //   toolLife: false, quality: false, lessInventory: false, implementation: false, others: false
  // });
  const [purpose, setPurpose] = useState('');
  const [othersDetail, setOthersDetail] = useState("");
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState('idle');

  useEffect(() => {
    ls.current = new SecureLS({ encodingType: 'aes' });
    try {
        const user = ls.current.get('full_name');
        if (user) {
            setFormData(prev => ({ ...prev, requestedBy: user }));
        } else {
            setFormData(prev => ({ ...prev, requestedBy: 'SYSTEM' }));
        }
    } catch {
        setFormData(prev => ({ ...prev, requestedBy: 'SYSTEM' }));
    }
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      setLoadingItems(true);
      try {
        const res = await fetch('/api/walter/items');
        if (res.ok) {
          const data = await res.json();
          setItemsList(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingItems(false);
      }
    };
    fetchItems();
  }, []);

  const handleHeaderChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if(errors[field]) setErrors(prev => ({...prev, [field]: null}));
  };

  const handleItemSelect = async (side, code) => {
    setToolData(prev => ({
      ...prev,
      [side]: { ...prev[side], itemCode: code, spec: 'Loading...', project: 'Loading...' }
    }));

    if(errors[`${side}_itemCode`]) setErrors(prev => ({...prev, [`${side}_itemCode`]: null}));

    if (!code) {
      setToolData(prev => ({
        ...prev,
        [side]: { ...prev[side], itemCode: '', spec: '', project: '' }
      }));
      return;
    }

    try {
      const res = await fetch('/api/purchaserequest/item-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemCode: code })
      });
      
      const data = await res.json();
      
      setToolData(prev => ({
        ...prev,
        [side]: { 
          ...prev[side], 
          itemCode: code, 
          spec: data.SizeSpecifications || 'N/A', 
          project: data.ProjectName || 'N/A' 
        }
      }));

    } catch (error) {
      setToolData(prev => ({
        ...prev,
        [side]: { ...prev[side], spec: 'Error fetching', project: 'Error' }
      }));
    }
  };

  const handleToolInput = (side, field, value) => {
    setToolData(prev => ({
      ...prev,
      [side]: { ...prev[side], [field]: value }
    }));
    if(errors[`${side}_${field}`]) setErrors(prev => ({...prev, [`${side}_${field}`]: null}));
  };

  // const handleCheckbox = (key) => {
  //   setPurpose(prev => ({ ...prev, [key]: !prev[key] }));
  //   if(key === 'others' && purpose.others) {
  //     setOthersDetail("");
  //   }
  // };
  const handlePurposeSelect = (key) => {
    setPurpose(key);
    if(key !== 'others') {
      setOthersDetail("");
    }
    if(errors.purpose) setErrors(prev => ({...prev, purpose: null}));
  };
  const validate = () => {
    let newErrors = {};
    if (!formData.receivedQty) newErrors.receivedQty = "Required";
    if (!formData.receivedBy) newErrors.receivedBy = "Required";
    if (!formData.checkedBy) newErrors.checkedBy = "Required";
    
    if (!toolData.from.itemCode) newErrors.from_itemCode = "Required";
    if (!toolData.from.op) newErrors.from_op = "Required";
    if (!toolData.from.drawing) newErrors.from_drawing = "Required";

    if (!toolData.to.itemCode) newErrors.to_itemCode = "Required";
    if (!toolData.to.op) newErrors.to_op = "Required";
    if (!toolData.to.drawing) newErrors.to_drawing = "Required";

    if (toolData.from.itemCode && toolData.to.itemCode && toolData.from.itemCode === toolData.to.itemCode) {
      newErrors.to_itemCode = "Item Code cannot be same as 'From' side";
    }
    
    if (!reason.trim()) newErrors.reason = "Reason is required";

    // const isPurposeSelected = Object.values(purpose).some(val => val === true);
    // if(!isPurposeSelected) newErrors.purpose = "Select at least one purpose";

    // if(purpose.others && !othersDetail.trim()) newErrors.others = "Please specify details";
    if (!purpose) {
      newErrors.purpose = "Select a purpose";
    }

    if (purpose === 'others' && !othersDetail.trim()) {
      newErrors.others = "Please specify details";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitStatus('loading');
    
    // const selectedPurposes = [];
    // if(purpose.toolLife) selectedPurposes.push("Tool Life Issue");
    // if(purpose.quality) selectedPurposes.push("Quality Issue");
    // if(purpose.lessInventory) selectedPurposes.push("Less Inventory");
    // if(purpose.implementation) selectedPurposes.push("Implementation");
    // if(purpose.others && othersDetail.trim()) selectedPurposes.push(othersDetail.trim());

    // const finalPurposeString = selectedPurposes.join(', ');
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

    try {
      const res = await fetch('/api/cutting-tools/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSubmitStatus('success');
        setTimeout(() => {
          setSubmitStatus('idle');
          handleReset();
        }, 3000);
      } else {
        throw new Error("Submission Failed");
      }
    } catch (error) {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    }
  };

  const handleReset = () => {
    setFormData(prev => ({ ...prev, receivedQty: '', receivedBy: '', checkedBy: '', date: new Date().toISOString().split('T')[0] }));
    setToolData({
      from: { itemCode: '', spec: '', project: '', op: '', drawing: '' },
      to:   { itemCode: '', spec: '', project: '', op: '', drawing: '' }
    });
    setPurpose({ toolLife: false, quality: false, lessInventory: false, implementation: false, others: false });
    setOthersDetail("");
    setReason('');
    setErrors({});
  };

  return (
    <div className="flex justify-center items-start font-sans">
      <div className="w-full rounded-2xl shadow-xl overflow-hidden border border-primary/50 bg-card">
        
        <div className="p-6 border-b border-primary/50">
          <h1 hidden className="text-2xl md:text-3xl font-bold text-center text-brand-500 uppercase tracking-wide">
            Cutting Tools Modification Request Form
          </h1>
          <p className="text-center text-xs text-gray-400 mt-2">IATF16949 CAPD Method 10.3 Continuous Improvement Spirit</p>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 rounded-xl border border-primary/50 bg-card">
            <InputField label="Request Section" value={formData.requestSection} disabled={true} />
            
            <ShadcnDatePicker 
              label="Date" 
              value={formData.date} 
              onChange={(val) => handleHeaderChange('date', val)} 
            />

            <InputField label="Requested By" value={formData.requestedBy} disabled={true} />
            
            <InputField 
              label="Checked By" 
              placeholder="Enter Name" 
              value={formData.checkedBy} 
              onChange={(e) => handleHeaderChange('checkedBy', e.target.value)} 
              error={errors.checkedBy}
              required
            />
             <InputField 
              label="Received Qty" 
              type="number" 
              placeholder="0" 
              value={formData.receivedQty} 
              onChange={(e) => handleHeaderChange('receivedQty', e.target.value)}
              error={errors.receivedQty}
              required
            />
            <InputField 
              label="Received By" 
              placeholder="Enter Name" 
              value={formData.receivedBy} 
              onChange={(e) => handleHeaderChange('receivedBy', e.target.value)}
              error={errors.receivedBy}
              required
            />
          </div>

          <div className="relative">
             <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-primary/50 transform -translate-x-1/2 z-0"></div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 relative z-10">
                
                <div className="flex flex-col gap-4">
                  <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 border-b pb-2 mb-2 flex items-center gap-2">
                    <span className="bg-red-100 text-red-600 p-1 rounded">FROM</span> <span className='text-brand-500'>Current Specification</span>
                  </h3>
                  
                  <div className="flex flex-col gap-1 w-full">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Item Code <span className="text-red-500">*</span></label>
                    <Combobox
                      options={itemsList}
                      value={toolData.from.itemCode}
                      onChange={(code) => handleItemSelect('from', code)}
                      placeholder="Select Item Code"
                      loading={loadingItems}
                      error={errors.from_itemCode}
                      disabledValue={toolData.to.itemCode}
                    />
                  </div>

                  <InputField label="Specification" value={toolData.from.spec} disabled={true} placeholder="Auto-filled" />
                  <InputField label="Project" value={toolData.from.project} disabled={true} placeholder="Auto-filled" />
                  
                  <InputField 
                    label="Operation" 
                    value={toolData.from.op} 
                    onChange={(e) => handleToolInput('from', 'op', e.target.value)} 
                    error={errors.from_op}
                    required
                  />
                  <InputField 
                    label="Drawing No" 
                    value={toolData.from.drawing} 
                    onChange={(e) => handleToolInput('from', 'drawing', e.target.value)} 
                    error={errors.from_drawing}
                    required
                  />
                </div>

                <div className="flex flex-col gap-4">
                  <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 border-b pb-2 mb-2 flex items-center gap-2">
                     <span className="bg-green-100 text-green-600 p-1 rounded">TO</span> <span className='text-brand-500'>Required Specification</span>
                  </h3>
                  
                  <div className="flex flex-col gap-1 w-full">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Item Code <span className="text-red-500">*</span></label>
                    <Combobox
                      options={itemsList}
                      value={toolData.to.itemCode}
                      onChange={(code) => handleItemSelect('to', code)}
                      placeholder="Select Item Code"
                      loading={loadingItems}
                      error={errors.to_itemCode}
                      disabledValue={toolData.from.itemCode}
                    />
                  </div>

                  <InputField label="Specification" value={toolData.to.spec} disabled={true} placeholder="Auto-filled" />
                  <InputField label="Project" value={toolData.to.project} disabled={true} placeholder="Auto-filled" />
                  
                  <InputField 
                    label="Operation" 
                    value={toolData.to.op} 
                    onChange={(e) => handleToolInput('to', 'op', e.target.value)} 
                    error={errors.to_op}
                    required
                  />
                  <InputField 
                    label="Drawing No" 
                    value={toolData.to.drawing} 
                    onChange={(e) => handleToolInput('to', 'drawing', e.target.value)} 
                    error={errors.to_drawing}
                    required
                  />
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 rounded-xl border border-primary/50 bg-card">
            <div className="lg:col-span-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3">Purpose of Modification <span className="text-red-500">*</span></label>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-4">
                  {['toolLife', 'quality', 'lessInventory', 'implementation', 'others'].map((key) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-primary/50 hover:border-brand-400 transition-colors">
                      <input 
                        type="radio" 
                        name="purpose_option"
                        // checked={purpose[key]} 
                        checked={purpose === key} 
                        // onChange={() => handleCheckbox(key)}
                        onChange={() => handlePurposeSelect(key)}
                        className="w-5 h-5 text-brand-500 rounded focus:ring-brand-500"
                      />
                      <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')} {key === 'toolLife' || key === 'quality' ? 'Issue' : ''}</span>
                    </label>
                  ))}
                </div>
                {purpose === 'others' && (
                   <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <input 
                        type="text"
                        placeholder="Please specify other reason..."
                        value={othersDetail}
                        onChange={(e) => setOthersDetail(e.target.value)}
                        className={`w-full md:w-1/2 p-2.5 rounded-lg border focus:ring-2 focus:ring-brand-500 outline-none
                        ${errors.others ? 'border-red-500' : 'border-primary/50'}`}
                      />
                      {errors.others && <p className="text-xs text-red-500 mt-1">{errors.others}</p>}
                   </div>
                )}
              </div>
              {errors.purpose && <p className="text-xs text-red-500 mt-2 animate-pulse flex items-center gap-1"><AlertCircle size={10} /> {errors.purpose}</p>}
            </div>
            
            <div className="lg:col-span-4">
               <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">Detailed Reason <span className="text-red-500">*</span></label>
               <textarea 
                  className={`w-full p-3 rounded-lg border min-h-[100px] outline-none focus:ring-2 focus:ring-brand-500
                  ${errors.reason ? 'border-red-500' : 'border-primary/50'}`}
                  placeholder="e.g., Finish tools modification to Rough tool..."
                  value={reason}
                  onChange={(e) => {setReason(e.target.value); if(errors.reason) setErrors(prev=>({...prev, reason: null}))}}
               ></textarea>
               {errors.reason && <p className="text-xs text-red-500 mt-1 animate-pulse">{errors.reason}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-primary/50">
             
             <button 
                onClick={handleReset}
                disabled={submitStatus === 'loading'}
                className="px-6 py-3 rounded-lg border border-primary/50 text-gray-600 dark:text-gray-300 hover:bg-primary/50 cursor-pointer transition-all flex items-center gap-2 disabled:opacity-50"
             >
               <RefreshCw size={18} /> Reset
             </button>

             <button
                onClick={handleSubmit}
                disabled={submitStatus === 'loading' || submitStatus === 'success'}
                className={`relative px-8 py-3 rounded-lg text-white font-medium shadow-lg transition-all duration-300 overflow-hidden w-40 flex justify-center items-center border border-primary/50 cursor-pointer
                ${submitStatus === 'error' ? 'bg-red-500 hover:bg-red-600' : 
                  submitStatus === 'success' ? 'bg-green-500' : 
                  'bg-brand-500 hover:bg-brand-600'}`}
             >
                {submitStatus === 'idle' && (
                  <span className="flex items-center gap-2"><Save size={18} /> Submit</span>
                )}

                {submitStatus === 'loading' && (
                  <Loader2 className="animate-spin" size={24} />
                )}

                {submitStatus === 'success' && (
                  <span className="animate-in zoom-in duration-300 flex items-center gap-2">
                    <Check size={24} strokeWidth={3} /> Saved
                  </span>
                )}

                {submitStatus === 'error' && (
                   <span className="flex items-center gap-2"><X size={24} /> Retry</span>
                )}
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CuttingToolReq;