"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Save,
  Loader2,
  Calendar as CalendarIcon,
  Plus,
  Printer,
  Trash2,
  Check,
  UserCheck,
  XCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { format } from "date-fns";
import SecureLS from "secure-ls";
import { exportToPDF } from "./excelExporter";
import AnimatedExportButton from "@/components/ui/AnimatedExportButton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import DataTable from "./DataTable";
import { useAdminAccessCheck } from "@/lib/checkAdmin";

const detailColumns = [
  {
    key: "MaterialCode",
    label: "Material Code",
    filterable: true,
    hidden: false,
  },
  {
    key: "ItemSpecification",
    label: "Specification",
    filterable: true,
    hidden: false,
  },
  {
    key: "ProjectName",
    label: "Project Name",
    filterable: true,
    hidden: false,
  },
  { key: "OrderQty", label: "Order Qty", filterable: true, hidden: false },
  {
    key: "good_parts_qty",
    label: "Good Parts",
    filterable: true,
    hidden: false,
  },
  {
    key: "rejected_parts_qty",
    label: "Rejected Parts",
    filterable: true,
    hidden: false,
  },
  { key: "CheckNGQty", label: "Check NG", filterable: true, hidden: true },
  {
    key: "DetermineOrderQty",
    label: "Det. Order Qty",
    filterable: true,
    hidden: true,
  },
  {
    key: "ConfirmationByUser",
    label: "Confirmed By User",
    filterable: true,
    hidden: true,
  },
  { key: "DemandDate", label: "Demand Date", filterable: true, hidden: false },
  { key: "Remarks", label: "Remarks", filterable: true, hidden: false },
  {
    key: "Receiver_remarks",
    label: "Receiver Remarks",
    filterable: true,
    hidden: false,
  },
];

const ItemCodeSelector = ({
  options,
  onSelect,
  disabled,
  selectedValues = [],
}) => {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="w-[140px] justify-start px-2"
        >
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
                <CommandItem
                  className="cursor-pointer"
                  key={option.value}
                  value={option.value}
                  onSelect={() => onSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValues.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
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

export default function PurchaseRequestDetail({ request, onBack }) {
  const PAGE_ID_FOR_THIS_FORM = 2026;
  const { hasAccess: isAdmin, isLoading: accessLoading } = useAdminAccessCheck(
    PAGE_ID_FOR_THIS_FORM,
  );
  const [rows, setRows] = useState([]);
  const [date, setDate] = useState(
    request ? new Date(request.ReqDate) : new Date(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [itemCodeOptions, setItemCodeOptions] = useState([]);
  const ls = useRef(null);
  const [currentUser, setCurrentUser] = useState({
    empId: "",
    name: "",
    role: "",
  });
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  useEffect(() => {
    ls.current = new SecureLS({ encodingType: "aes" });
  }, []);
  useEffect(() => {
    ls.current = new SecureLS({ encodingType: "aes" });
    try {
      setCurrentUser({
        empId: ls.current.get("employee_id") || "",
        name: ls.current.get("full_name") || "",
        role: ls.current.get("role") || "",
      });
    } catch (e) {}
  }, []);
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch("/api/walter/items");
        const data = await res.json();
        setItemCodeOptions(
          data.map((i) => ({ value: i.ItemCode, label: i.ItemCode })),
        );
      } catch {}
    };
    fetchItems();
  }, []);

  useEffect(() => {
    if (request) {
      setIsLoading(true);
      fetch("/api/purchaserequest/get-by-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: request.RequestId }),
      })
        .then((res) => res.json())
        .then((data) => {
          setRows(
            data.map((r) => ({
              ...r,
              ReqDate: new Date(r.ReqDate),
              DemandDate: r.DemandDate ? new Date(r.DemandDate) : null,
              tempId: r.Id,
            })),
          );
        })
        .catch(() => toast.error("Failed to load details"))
        .finally(() => setIsLoading(false));
    }
  }, [request]);

  useEffect(() => {
    if (date && rows.length > 0) {
      setRows((prev) => prev.map((row) => ({ ...row, DemandDate: date })));
    }
  }, [date]);
  const isHOSApproved = rows.length > 0 ? rows[0].isHOSApproved : false;
  const isReceiverApproved =
    rows.length > 0 ? rows[0].isReceiverApproved : false;
  const is_Final_HOS_Approval =
    rows.length > 0 ? rows[0].is_Final_HOS_Approval : false;
  const isFormEditable =
    !request ||
    isAdmin ||
    (currentUser.role === "HOS" && !isHOSApproved) ||
    (currentUser.role === "Res" && isHOSApproved && !isReceiverApproved) ||
    (currentUser.role === "HOS" &&
      isHOSApproved &&
      isReceiverApproved &&
      !is_Final_HOS_Approval);
  const handleAddItem = async (itemCode) => {
    if (rows.some((row) => row.MaterialCode === itemCode)) {
      toast.info(`Item ${itemCode} already exists.`);
      return;
    }
    try {
      const response = await fetch("/api/purchaserequest/item-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemCode }),
      });
      const details = await response.json();
      const newRow = {
        Id: 0,
        tempId: `new-${Date.now()}`,
        RequestId: request ? request.RequestId : 0,
        ReqDate: date,
        MaterialCode: itemCode,
        ItemSpecification: details.ItemSpecification || "",
        ProjectName: details.ProjectName || "",
        OrderQty: null,
        CheckNGQty: null,
        DetermineOrderQty: null,
        DemandDate: date,
        ConfirmationByUser: null,
        Remarks: null,
        isSave: 0,
      };
      setRows((prev) => [...prev, newRow]);
      toast.success(`Added ${itemCode}`);
    } catch {
      toast.error(`Failed to get details for ${itemCode}`);
    }
  };

  const handleSave = async (approvalData = null) => {
    setIsSaving(true);
    try {
      let employeeId = "SYSTEM";
      try {
        employeeId = ls.current.get("employee_id") || "SYSTEM";
      } catch {}
      const payload = rows.map((row) => ({
        ...row,
        ReqDate: format(date, "yyyy-MM-dd"),
        DemandDate: row.DemandDate
          ? format(row.DemandDate, "yyyy-MM-dd")
          : null,
        CreatedBy: row.Id === 0 ? employeeId : row.CreatedBy,
        ModifiedBy: row.Id > 0 ? employeeId : null,
        HOSName:
          approvalData?.HOSName !== undefined
            ? approvalData.HOSName
            : row.HOSName,
        HOSempid:
          approvalData?.HOSempid !== undefined
            ? approvalData.HOSempid
            : row.HOSempid,
        isHOSApproved:
          approvalData?.isHOSApproved !== undefined
            ? approvalData.isHOSApproved
            : row.isHOSApproved,
        ReceiverName:
          approvalData?.ReceiverName !== undefined
            ? approvalData.ReceiverName
            : row.ReceiverName,
        Receiver_emp_id:
          approvalData?.Receiver_emp_id !== undefined
            ? approvalData.Receiver_emp_id
            : row.Receiver_emp_id,
        isReceiverApproved:
          approvalData?.isReceiverApproved !== undefined
            ? approvalData.isReceiverApproved
            : row.isReceiverApproved,
        is_Final_HOS_Approval:
          approvalData?.is_Final_HOS_Approval !== undefined
            ? approvalData.is_Final_HOS_Approval
            : row.is_Final_HOS_Approval,
        Final_HOS_Name:
          approvalData?.Final_HOS_Name !== undefined
            ? approvalData.Final_HOS_Name
            : row.Final_HOS_Name,
        Final_HOS_empid:
          approvalData?.Final_HOS_empid !== undefined
            ? approvalData.Final_HOS_empid
            : row.Final_HOS_empid,
      }));
      const response = await fetch("/api/purchaserequest/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: payload }),
      });
      if (!response.ok) throw new Error("Save failed");
      // toast.success("Saved successfully!");
      toast.success(
        approvalData ? "Approved successfully!" : "Saved successfully!",
      );
      // const responseData = await response.json();
      // const updatedRows = Array.isArray(responseData) ? responseData : [];
      if (request) {
        const updatedData = await response.json();
        // setRows(updatedData.map(r => ({ ...r, ReqDate: new Date(r.ReqDate), DemandDate: r.DemandDate ? new Date(r.DemandDate) : null, tempId: r.Id })));
        const fetchRes = await fetch("/api/purchaserequest/get-by-id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: request.RequestId }),
        });
        const freshData = await fetchRes.json();
        setRows(
          freshData.map((r) => ({
            ...r,
            ReqDate: new Date(r.ReqDate),
            DemandDate: r.DemandDate ? new Date(r.DemandDate) : null,
            tempId: r.Id,
          })),
        );
        // setRows(prev => prev.map(r => ({...r, isSave: 1})));
      } else {
        const data = await response.json();
        setRows(
          data.map((r) => ({
            ...r,
            ReqDate: new Date(r.ReqDate),
            DemandDate: r.DemandDate ? new Date(r.DemandDate) : null,
            tempId: r.Id,
          })),
        );
      }
      setShowApprovalModal(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };
  const handleApproveHOS = () => {
    if (rows.length === 0) {
      toast.error("No items to approve.");
      return;
    }
    if (
      !confirm(
        "Are you sure you want to Approve? Form will be saved automatically.",
      )
    )
      return;
    handleSave({
      isHOSApproved: true,
      HOSName: currentUser.name,
      HOSempid: currentUser.empId,
    });
  };
  const handleApproveReceiver = () => {
    if (rows.length === 0) {
      toast.error("No items to approve.");
      return;
    }
    if (
      !confirm(
        "Are you sure you want to Approve? Form will be saved automatically.",
      )
    )
      return;
    handleSave({
      isReceiverApproved: true,
      ReceiverName: currentUser.name,
      Receiver_emp_id: currentUser.empId,
    });
  };
  const handleFinalHOSApprove = () => {
    if (rows.length === 0) {
      toast.error("No items to approve.");
      return;
    }
    if (
      !confirm(
        "Are you sure you want to Approve? Form will be saved automatically.",
      )
    )
      return;
    handleSave({
      is_Final_HOS_Approval: true,
      Final_HOS_Name: currentUser.name,
      Final_HOS_empid: currentUser.empId,
    });
  };
  //   const handleRowChange = (tempId, field, value) => {
  //     setRows((prev) =>
  //       prev.map((row) =>
  //         row.tempId === tempId ? { ...row, [field]: value } : row,
  //       ),
  //     );
  //   };
  const handleRowChange = (tempId, field, value) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.tempId === tempId) {
          const updatedRow = { ...row, [field]: value };
          if (field === "OrderQty" || field === "good_parts_qty") {
            const order = parseFloat(updatedRow.OrderQty) || 0;
            const good = parseFloat(updatedRow.good_parts_qty) || 0;
            updatedRow.rejected_parts_qty = order - good;
          }
          return updatedRow;
        }
        return row;
      }),
    );
  };
  const handleRemoveRow = async (row) => {
    if (row.Id > 0) {
      try {
        await fetch(`/api/purchaserequest/delete?id=${row.Id}`, {
          method: "DELETE",
        });
        toast.success("Deleted.");
        setRows((prev) => prev.filter((r) => r.tempId !== row.tempId));
      } catch {
        toast.error("Delete failed.");
      }
    } else {
      setRows((prev) => prev.filter((r) => r.tempId !== row.tempId));
    }
  };

  const renderCell = (row, col) => {
    const isLocked = !isFormEditable && row.isSave === 1;
    if (
      col.key === "MaterialCode" ||
      col.key === "ItemSpecification" ||
      col.key === "ProjectName"
    ) {
      return (
        <span
          className="text-xs truncate block max-w-[200px]"
          title={row[col.key]}
        >
          {row[col.key]}
        </span>
      );
    }
    // if (col.key === 'DemandDate') {
    //     return <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="h-7 text-[10px] px-2">{row.DemandDate ? format(row.DemandDate, "dd-MMM-yy") : "Pick"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={row.DemandDate} onSelect={d => handleRowChange(row.tempId, 'DemandDate', d)} /></PopoverContent></Popover>;
    // }
    if (col.key === "DemandDate") {
      if (isLocked) {
        return (
          <span className="text-xs px-2 block">
            {row.DemandDate ? format(row.DemandDate, "dd-MMM-yy") : "-"}
          </span>
        );
      }
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] px-2"
            >
              {row.DemandDate ? format(row.DemandDate, "dd-MMM-yy") : "Pick"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={row.DemandDate}
              onSelect={(d) => handleRowChange(row.tempId, "DemandDate", d)}
            />
          </PopoverContent>
        </Popover>
      );
    }
    if (col.key === "rejected_parts_qty") {
      return (
        <span className="text-xs px-2 py-1 block min-h-[1.75rem] font-medium text-muted-foreground bg-muted/30 rounded">
          {row[col.key] ?? 0}
        </span>
      );
    }
    // return <Input className="h-7 text-xs min-w-[80px]" value={row[col.key] || ''} onChange={e => handleRowChange(row.tempId, col.key, e.target.value)} type={col.key.includes('Qty') ? "number" : "text"} />;
    if (isLocked) {
      return (
        <span className="text-xs px-2 py-1 block min-h-[1.75rem]">
          {row[col.key]}
        </span>
      );
    }
    return (
      <Input
        className="h-7 text-xs min-w-[80px]"
        value={row[col.key] || ""}
        onChange={(e) => handleRowChange(row.tempId, col.key, e.target.value)}
        type={col.key.includes("Qty") ? "number" : "text"}
      />
    );
  };

  // const actionColumn = (row) => (
  //     <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveRow(row)}><Trash2 className="h-3.5 w-3.5" /></Button>
  // );
  const actionColumn = (row) => {
    const isLocked = !isFormEditable && row.isSave === 1;
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled={isLocked}
        className={cn(
          "h-7 w-7 text-destructive",
          isLocked && "opacity-50 cursor-not-allowed text-muted-foreground",
        )}
        onClick={() => handleRemoveRow(row)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    );
  };
  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);
  return (
    <div className="@container/main flex flex-col h-full space-y-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft />
          </Button>
          <h1 className="text-xl font-bold text-brand-500 whitespace-nowrap">
            {request
              ? `View Request: GTI-${new Date(request.ReqDate).getFullYear()}-RG-${request.RequestId}`
              : "New Request"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {request && (
            <Button
              variant="secondary"
              onClick={() => setShowApprovalModal(true)}
              className="w-[110px] cursor-pointer border border-gray-30"
            >
              <ShieldCheck className="mr-2 h-4 w-4" /> Approval
            </Button>
          )}
          <Button
            hidden={!isFormEditable}
            onClick={handleSave}
            disabled={isSaving || !date}
            className={cn("w-24 cursor-pointer", isSaving && "opacity-80")}
          >
            {isSaving ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}{" "}
            Save
          </Button>
          {/* <Popover><PopoverTrigger asChild><Button variant={"outline"} className="w-[200px] justify-start text-left px-3"><CalendarIcon className="mr-2 h-4 w-4"/>{date ? format(date, "PPP") : <span>Pick date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent></Popover> */}
          {/* <ItemCodeSelector hidden options={itemCodeOptions} selectedValues={rows.map(r => r.MaterialCode)} onSelect={handleAddItem} disabled={!date} /> */}
          <AnimatedExportButton
            onExport={() =>
              exportToPDF({
                data: rows,
                reqDate: date,
                reqNo: request
                  ? `GTI-${new Date(date).getFullYear()}-RG-${request.RequestId}`
                  : "",
              })
            }
            text="Print PDF"
            icon={<Printer className="h-4 w-4 mr-2" />}
          />
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center h-full items-center">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <DataTable
          columns={detailColumns}
          data={rows}
          renderCell={renderCell}
          actionColumn={actionColumn}
        />
      )}

      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="bg-card w-full max-w-md p-6 rounded-xl shadow-xl border border-border relative"
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`,
              transition: isDragging ? "none" : "transform 0.05s ease-out",
            }}
          >
            <div
              className="flex justify-between items-center mb-6 border-b pb-3 cursor-move select-none active:cursor-grabbing"
              onMouseDown={handleMouseDown}
            >
              <h3 className="text-xl font-extrabold text-primary flex items-center gap-2 pointer-events-none">
                <ShieldCheck className="h-6 w-6" /> Approval Workflow
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => {
                  setShowApprovalModal(false);
                  setPosition({ x: 0, y: 0 });
                }}
                className="h-8 w-8 cursor-pointer rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 border border-border flex flex-col justify-between">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  HOS Approval
                </h4>
                {isHOSApproved ? (
                  <div className="text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-md border border-green-200 dark:border-green-800 mb-3">
                    <p className="font-semibold flex items-center gap-2">
                      <Check size={16} /> Approved
                    </p>
                    <p className="text-xs mt-1 opacity-80">
                      By: {rows[0]?.HOSName} ({rows[0]?.HOSempid})
                    </p>
                  </div>
                ) : currentUser.role === "HOS" ? (
                  <button
                    onClick={handleApproveHOS}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-md transition-colors font-medium cursor-pointer"
                  >
                    {isSaving ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      <UserCheck size={16} />
                    )}{" "}
                    Approve as HOS
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground bg-background py-2 rounded-md border border-border cursor-not-allowed">
                    <XCircle size={16} /> Pending (HOS Only)
                  </div>
                )}
              </div>
              <div className="bg-muted/50 rounded-lg p-4 border border-border flex flex-col justify-between">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Receiver Approval
                </h4>
                {isReceiverApproved ? (
                  <div className="text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-md border border-green-200 dark:border-green-800 mb-3">
                    <p className="font-semibold flex items-center gap-2">
                      <Check size={16} /> Approved
                    </p>
                    <p className="text-xs mt-1 opacity-80">
                      By: {rows[0]?.ReceiverName} ({rows[0]?.Receiver_emp_id})
                    </p>
                  </div>
                ) : currentUser.role === "Res" ? (
                  isHOSApproved ? (
                    <button
                      onClick={handleApproveReceiver}
                      className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-md transition-colors font-medium cursor-pointer"
                    >
                      {isSaving ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                      ) : (
                        <UserCheck size={16} />
                      )}{" "}
                      Approve as Receiver
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 py-2.5 rounded-md cursor-not-allowed">
                      <Loader2 size={16} className="animate-spin" /> Waiting for
                      HOS
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground bg-background py-2 rounded-md border border-border cursor-not-allowed">
                    <XCircle size={16} /> Pending (Receiver Only)
                  </div>
                )}
              </div>
              <div className="bg-muted/50 rounded-lg p-4 border border-border flex flex-col justify-between">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Final HOS Approval
                </h4>
                {is_Final_HOS_Approval ? (
                  <div className="text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-md border border-green-200 dark:border-green-800 mb-3">
                    <p className="font-semibold flex items-center gap-2">
                      <Check size={16} /> Approved
                    </p>
                    <p className="text-xs mt-1 opacity-80">
                      By: {rows[0]?.Final_HOS_Name} ({rows[0]?.Final_HOS_empid})
                    </p>
                  </div>
                ) : currentUser.role === "HOS" ? (
                  isReceiverApproved ? (
                    <button
                      onClick={handleFinalHOSApprove}
                      className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-md transition-colors font-medium cursor-pointer"
                    >
                      {isSaving ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                      ) : (
                        <UserCheck size={16} />
                      )}{" "}
                      Final Approve
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 py-2.5 rounded-md cursor-not-allowed">
                      <Loader2 size={16} className="animate-spin" /> Waiting for
                      Receiver
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground bg-background py-2 rounded-md border border-border cursor-not-allowed">
                    <XCircle size={16} /> Pending (Final HOS Only)
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
