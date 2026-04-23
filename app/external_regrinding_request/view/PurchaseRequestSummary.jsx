"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Plus, Loader2, Calendar as CalendarIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subMonths } from "date-fns";
import DataTable from "./DataTable";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAdminAccessCheck } from "@/lib/checkAdmin";
import { useAccessCheck } from '@/lib/useAccessCheck';
// const summaryColumns = [
//     { key: 'FormattedRequestId', label: 'Request ID', filterable: true, hidden: false },
//     { key: 'TotalOrderQty', label: 'Total Order Qty', filterable: true, hidden: false },
//     { key: 'DemandDate', label: 'Demand Date', filterable: true, hidden: false },
//     { key: 'Status', label: 'Status', filterable: true, hidden: false },
// ];
// const renderStatusFilterUI = (statusText) => {
//   const hosApp = ["Pending REC", "Pending Final", "Approved"].includes(
//     statusText,
//   );
//   const recApp = ["Pending Final", "Approved"].includes(statusText);
//   const finApp = statusText === "Approved";

//   return (
//     <div className="flex items-center w-full gap-2 pointer-events-none">
//       <div className="flex items-center scale-75 origin-left w-16">
//         <div
//           className={cn(
//             "h-5 w-5 rounded-full flex items-center justify-center border-2",
//             hosApp
//               ? "bg-green-500 border-green-500 text-white"
//               : "border-amber-500 text-amber-500 bg-amber-50",
//           )}
//         >
//           {hosApp ? (
//             <Check size={10} strokeWidth={3} />
//           ) : (
//             <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
//           )}
//         </div>
//         <div className="h-[2px] w-4 bg-gray-200 mx-0.5 rounded-full overflow-hidden relative">
//           <div
//             className={cn(
//               "absolute top-0 left-0 h-full bg-green-500",
//               hosApp ? "w-full" : "w-0",
//             )}
//           ></div>
//         </div>
//         <div
//           className={cn(
//             "h-5 w-5 rounded-full flex items-center justify-center border-2",
//             recApp
//               ? "bg-green-500 border-green-500 text-white"
//               : hosApp
//                 ? "border-amber-500 text-amber-500 bg-amber-50"
//                 : "border-gray-300 bg-gray-50",
//           )}
//         >
//           {recApp ? (
//             <Check size={10} strokeWidth={3} />
//           ) : hosApp ? (
//             <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
//           ) : null}
//         </div>
//         <div
//           className={cn(
//             "h-5 w-5 rounded-full flex items-center justify-center border-2",
//             finApp
//               ? "bg-green-500 border-green-500 text-white"
//               : recApp
//                 ? "border-amber-500 text-amber-500 bg-amber-50"
//                 : "border-gray-300 bg-gray-50",
//           )}
//         >
//           {finApp ? (
//             <Check size={10} strokeWidth={3} />
//           ) : recApp ? (
//             <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
//           ) : null}
//         </div>
//       </div>
//       <span className="text-xs font-medium">{statusText}</span>
//     </div>
//   );
// };
const renderStatusFilterUI = (statusText) => {
  const hosApp = ["Pending REC", "Pending Coating", "Coating In Progress", "Returned to Toolmaking"].includes(statusText);
  const recApp = ["Pending Coating", "Coating In Progress", "Returned to Toolmaking"].includes(statusText);
  const coatApp = ["Coating In Progress", "Returned to Toolmaking"].includes(statusText);
  const toolApp = statusText === "Returned to Toolmaking";

  return (
    <div className="flex items-center w-full gap-2 pointer-events-none">
      <div className="flex items-center scale-[0.65] origin-left">
        <div className={cn("h-5 w-5 rounded-full flex items-center justify-center border-2", hosApp ? "bg-green-500 border-green-500 text-white" : "border-amber-500 text-amber-500 bg-amber-50")}>
          {hosApp ? <Check size={10} strokeWidth={3} /> : <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>}
        </div>
        <div className="h-[2px] w-3 bg-gray-200 mx-0.5"><div className={cn("h-full bg-green-500", hosApp ? "w-full" : "w-0")}></div></div>
        <div className={cn("h-5 w-5 rounded-full flex items-center justify-center border-2", recApp ? "bg-green-500 border-green-500 text-white" : hosApp ? "border-amber-500 text-amber-500 bg-amber-50" : "border-gray-300 bg-gray-50")}>
          {recApp ? <Check size={10} strokeWidth={3} /> : hosApp ? <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div> : null}
        </div>
        <div className="h-[2px] w-3 bg-gray-200 mx-0.5"><div className={cn("h-full bg-green-500", recApp ? "w-full" : "w-0")}></div></div>
        <div className={cn("h-5 w-5 rounded-full flex items-center justify-center border-2", coatApp ? "bg-green-500 border-green-500 text-white" : recApp ? "border-amber-500 text-amber-500 bg-amber-50" : "border-gray-300 bg-gray-50")}>
          {coatApp ? <Check size={10} strokeWidth={3} /> : recApp ? <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div> : null}
        </div>
        <div className="h-[2px] w-3 bg-gray-200 mx-0.5"><div className={cn("h-full bg-green-500", coatApp ? "w-full" : "w-0")}></div></div>
        <div className={cn("h-5 w-5 rounded-full flex items-center justify-center border-2", toolApp ? "bg-green-500 border-green-500 text-white" : coatApp ? "border-amber-500 text-amber-500 bg-amber-50" : "border-gray-300 bg-gray-50")}>
          {toolApp ? <Check size={10} strokeWidth={3} /> : coatApp ? <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div> : null}
        </div>
      </div>
      <span className="text-[10px] font-medium whitespace-nowrap">{statusText}</span>
    </div>
  );
};
const summaryColumns = [
  {
    key: "FormattedRequestId",
    label: "Request ID",
    filterable: true,
    hidden: false,
  },
  {
    key: "TotalOrderQty",
    label: "Total Order Qty",
    filterable: true,
    hidden: false,
  },
  { key: "DemandDate", label: "Demand Date", filterable: true, hidden: false },
  {
    key: "Status",
    label: "Status",
    filterable: true,
    hidden: false,
    renderFilterOption: renderStatusFilterUI,
  },
];
export default function PurchaseRequestSummary({ onViewDetails, onCreateNew }) {
  const PAGE_ID_FOR_THIS_FORM = 3038;
  const { hasAccess: isAdmin, isLoading: accessLoading } = useAdminAccessCheck(
    PAGE_ID_FOR_THIS_FORM,
  );
  const { isLoading: isAccessLoading, hasAccess } = useAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const fetchSummary = useCallback(async (start, end) => {
    if (!start || !end) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/ExternalRegrindingRequest/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: format(start, "yyyy-MM-dd"),
          endDate: format(end, "yyyy-MM-dd"),
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const result = await res.json();
      // const formatted = result.map(row => ({
      //     ...row,
      //     FormattedRequestId: `GTI-${new Date(row.ReqDate).getFullYear()}-RG-${row.RequestId}`,
      //     DemandDate: row.DemandDate ? format(new Date(row.DemandDate), 'dd-MMM-yyyy') : '-',
      // }));
      //   const formatted = result.map((row) => {
      //     const hos = row.isHOSApproved === 1 || row.isHOSApproved === true;
      //     const rec =
      //       row.isReceiverApproved === 1 || row.isReceiverApproved === true;
      //     const fin =
      //       row.is_Final_HOS_Approval === 1 || row.is_Final_HOS_Approval === true;

      //     let statusVal = "Pending HOS";
      //     if (hos && !rec) statusVal = "Pending REC";
      //     if (hos && rec) statusVal = "Approved";

      //     return {
      //       ...row,
      //       FormattedRequestId: `GTI-${new Date(row.ReqDate).getFullYear()}-RG-${row.RequestId}`,
      //       DemandDate: row.DemandDate
      //         ? format(new Date(row.DemandDate), "dd-MMM-yyyy")
      //         : "-",
      //       Status: statusVal,
      //     };
      //   });
      const formatted = result.map((row) => {
        const hos = row.isHOSApproved === 1 || row.isHOSApproved === true;
        const rec = row.isReceiverApproved === 1 || row.isReceiverApproved === true;
        const coat = row.Send_to_coating === 1 || row.Send_to_coating === true;
        const tool = row.is_Return_to_Toolmaking === 1 || row.is_Return_to_Toolmaking === true;

        let statusVal = "Pending HOS";
        if (hos && !rec) statusVal = "Pending REC";
        if (hos && rec && !coat) statusVal = "Pending Coating";
        if (hos && rec && coat && !tool) statusVal = "Coating In Progress";
        if (hos && rec && coat && tool) statusVal = "Returned to Toolmaking";

        return {
          ...row,
          FormattedRequestId: `GTI-${new Date(row.ReqDate).getFullYear()}-RG-${row.RequestId}`,
          DemandDate: row.DemandDate ? format(new Date(row.DemandDate), "dd-MMM-yyyy") : "-",
          Status: statusVal,
        };
      });
      setData(formatted);
    } catch (error) {
      toast.error("Failed to load summary data.");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary(dateRange.from, dateRange.to);
  }, []);
  //   const renderCell = (row, col) => {
  //     if (col.key === "Status") {
  //       const hosApp = row.isHOSApproved === 1 || row.isHOSApproved === true;
  //       const recApp =
  //         row.isReceiverApproved === 1 || row.isReceiverApproved === true;

  //       return (
  //         <div className="flex items-center py-1">
  //           <div
  //             className="flex flex-col items-center w-10"
  //             title={
  //               hosApp
  //                 ? `Approved by: ${row.HOSName || "HOS"}`
  //                 : "Pending HOS Approval"
  //             }
  //           >
  //             <div
  //               className={cn(
  //                 "h-5 w-5 rounded-full flex items-center justify-center border-2 transition-all duration-300",
  //                 hosApp
  //                   ? "bg-green-500 border-green-500 text-white"
  //                   : "border-amber-500 text-amber-500 bg-amber-50",
  //               )}
  //             >
  //               {hosApp ? (
  //                 <Check size={12} strokeWidth={3} />
  //               ) : (
  //                 <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></div>
  //               )}
  //             </div>
  //             <span className="text-[9px] mt-1 font-bold text-muted-foreground uppercase">
  //               HOS
  //             </span>
  //           </div>
  //           <div className="relative h-[2px] w-8 bg-gray-200 mx-1 rounded-full overflow-hidden">
  //             <div
  //               className={cn(
  //                 "absolute top-0 left-0 h-full bg-green-500 transition-all duration-500",
  //                 hosApp ? "w-full" : "w-0",
  //               )}
  //             ></div>
  //           </div>
  //           <div
  //             className="flex flex-col items-center w-10"
  //             title={
  //               recApp
  //                 ? `Approved by: ${row.ReceiverName || "Receiver"}`
  //                 : "Pending Receiver Approval"
  //             }
  //           >
  //             <div
  //               className={cn(
  //                 "h-5 w-5 rounded-full flex items-center justify-center border-2 transition-all duration-300",
  //                 recApp
  //                   ? "bg-green-500 border-green-500 text-white"
  //                   : hosApp
  //                     ? "border-amber-500 text-amber-500 bg-amber-50"
  //                     : "border-gray-300 bg-gray-50",
  //               )}
  //             >
  //               {recApp ? (
  //                 <Check size={12} strokeWidth={3} />
  //               ) : hosApp ? (
  //                 <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></div>
  //               ) : null}
  //             </div>
  //             <span className="text-[9px] mt-1 font-bold text-muted-foreground uppercase">
  //               REC
  //             </span>
  //           </div>
  //         </div>
  //       );
  //     }
  //     return row[col.key];
  //   };
  const renderCell = (row, col) => {
      if (col.key === "Status") {
        const hosApp = row.isHOSApproved === 1 || row.isHOSApproved === true;
        const recApp = row.isReceiverApproved === 1 || row.isReceiverApproved === true;
        const coatApp = row.Send_to_coating === 1 || row.Send_to_coating === true;
        const toolApp = row.is_Return_to_Toolmaking === 1 || row.is_Return_to_Toolmaking === true;
  
        const Step = ({ active, done, label, title }) => (
          <div className="flex flex-col items-center w-8" title={title}>
            <div className={cn("h-5 w-5 rounded-full flex items-center justify-center border-2 transition-all duration-300", done ? "bg-green-500 border-green-500 text-white" : active ? "border-amber-500 text-amber-500 bg-amber-50" : "border-gray-300 bg-gray-50")}>
              {done ? <Check size={12} strokeWidth={3} /> : active ? <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></div> : null}
            </div>
            <span className="text-[8px] mt-1 font-bold text-muted-foreground uppercase">{label}</span>
          </div>
        );
  
        const Line = ({ done }) => (
          <div className="relative h-[2px] w-4 bg-gray-200 mx-0.5 mt-[-14px] rounded-full overflow-hidden">
            <div className={cn("absolute inset-0 bg-green-500 transition-all duration-500", done ? "w-full" : "w-0")}></div>
          </div>
        );
  
        return (
          <div className="flex items-center py-1 cursor-help">
            <Step done={hosApp} active={!hosApp} label="HOS" title={hosApp ? `Approved By: ${row.HOSName || "HOS"}` : "Pending HOS"} />
            <Line done={hosApp} />
            
            <Step done={recApp} active={hosApp && !recApp} label="REC" title={recApp ? `Approved By: ${row.ReceiverName || "Receiver"}` : "Pending Receiver"} />
            <Line done={recApp} />
            
            <Step done={coatApp} active={recApp && !coatApp} label="COAT" title={coatApp ? `Sent By: ${row.Send_by_name || "Coating"}` : "Pending Send to Coating"} />
            <Line done={coatApp} />
  
            <Step done={toolApp} active={coatApp && !toolApp} label="TOOL" title={toolApp ? `Returned By: ${row.Return_to_Toolmaking_by_name || "Toolmaking"}` : "Pending Return to Toolmaking"} />
          </div>
        );
      }
      return row[col.key];
    };
  const handleApplyFilter = () => {
    if (dateRange?.from && dateRange?.to) {
      fetchSummary(dateRange.from, dateRange.to);
    } else {
      toast.warning("Please select both Start and End dates.");
    }
  };

  const handleResetFilter = () => {
    const defaultFrom = subMonths(new Date(), 1);
    const defaultTo = new Date();
    setDateRange({ from: defaultFrom, to: defaultTo });
    fetchSummary(defaultFrom, defaultTo);
  };

  return (
    <div className="@container/main flex flex-col h-full space-y-4 p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-brand-500 whitespace-nowrap">
          Ext. Regrinding Requests
        </h1>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[260px] justify-start text-left font-normal cursor-pointer",
                  !dateRange && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={isMobile ? 1 : 2}
              />
              <div className="p-3 border-t flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={handleResetFilter}>
                  Reset
                </Button>
                <Button size="sm" onClick={handleApplyFilter}>
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button onClick={onCreateNew} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" /> New Request
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      ) : (
        <DataTable
          columns={summaryColumns}
          data={data}
          onRowClick={(row) => onViewDetails(row)}
          renderCell={renderCell}
        />
      )}
    </div>
  );
}
