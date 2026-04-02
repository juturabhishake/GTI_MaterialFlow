import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export const exportToPDF = ({ data, reqDate, reqNo }) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  
  const dateObj = reqDate ? new Date(reqDate) : new Date();
  const formattedDate = format(dateObj, "dd-MM-yyyy");
  const year = dateObj.getFullYear(); 

  const requestNumber =`GTI-${year}-RG-${reqNo}`; //reqNo || `GTI-${year}-RG-___`

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Purchase Request Form (Regrinding Tool)", 10, 10);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text('We are following "IATF 16949 CAPD method 10.3 Continuous Improvement Spirit" to improve our GTI', 10, 14);

  doc.setFontSize(9);
  doc.rect(130, 6, 3, 3); 
  doc.rect(130, 6, 3, 3, "F"); 
  doc.text("MG-Toolroom", 135, 8.5);

  doc.rect(130, 11, 3, 3); 
  doc.text("FD-Tooling", 135, 13.5);

  autoTable(doc, {
    startY: 5,
    margin: { left: 220 },
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1, lineWidth: 0.1, lineColor: [0, 0, 0] },
    body: [
      [`Req No: ${requestNumber}`],
      [`Req Date: ${formattedDate}`]
    ]
  });

  const minRows = 10;
  const tableData = [];
  
  data.forEach((row, index) => {
    let spec = row.ItemSpecification || "";
    spec = spec.replace(/Φ/g, "Ø").replace(/°/g, " deg"); 

    tableData.push([
      index + 1,
      row.MaterialCode || "",
      spec,
      row.OrderQty || "",
      row.CheckNGQty || "",
      row.DetermineOrderQty || "",
      row.ConfirmationByUser || "",
      row.ProjectName || "",
      row.DemandDate ? format(new Date(row.DemandDate), "dd/MMM/yyyy") : ""
    ]);
  });

  for (let i = tableData.length; i < minRows; i++) {
    tableData.push([i + 1, "", "", "", "", "", "", "", ""]);
  }

  autoTable(doc, {
    startY: 20,
    head: [[
      { content: "S.No", styles: { halign: 'center', valign: 'middle' } },
      { content: "Material code", styles: { halign: 'center', valign: 'middle' } },
      { content: "Item Specification", styles: { halign: 'center', valign: 'middle' } },
      { content: "Order Qty", styles: { halign: 'center', valign: 'middle' } },
      { content: "Check NG Qty", styles: { halign: 'center', valign: 'middle' } },
      { content: "Determine order Qty", styles: { halign: 'center', valign: 'middle' } },
      { content: "Confirmation by user section", styles: { halign: 'center', valign: 'middle' } },
      { content: "Project Name", styles: { halign: 'center', valign: 'middle' } },
      { content: "Demand Date", styles: { halign: 'center', valign: 'middle' } },
    ]],
    body: tableData,
    theme: 'grid',
    styles: { 
      font: "helvetica", 
      fontSize: 8, 
      lineColor: [0, 0, 0], 
      lineWidth: 0.1, 
      cellPadding: 2,
      textColor: [0, 0, 0],
      valign: 'middle',
      overflow: 'linebreak'
    },
    headStyles: { 
      fillColor: [240, 240, 240], 
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.1,
      lineColor: [0, 0, 0]
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' }, 
      1: { cellWidth: 35 }, 
      2: { cellWidth: 80, halign: 'left' }, 
      3: { cellWidth: 15, halign: 'center' }, 
      4: { cellWidth: 15, halign: 'center' }, 
      5: { cellWidth: 20, halign: 'center' }, 
      6: { cellWidth: 25, halign: 'center' },
      7: { cellWidth: 41.7 }, 
      8: { cellWidth: 25, halign: 'center' }  
    }
  });

  const remarksText = data.length > 0 && data[0].Remarks ? data[0].Remarks : "";
  
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY, 
    body: [[`Remarks: `]],//${remarksText}
    theme: 'grid',
    styles: { 
      fontSize: 9, 
      fontStyle: 'bold', 
      cellPadding: 2, 
      lineWidth: 0.1, 
      lineColor: [0, 0, 0],
      textColor: [0, 0, 0]
    }
  });

  const finalY = doc.lastAutoTable.finalY;
  const pageHeight = doc.internal.pageSize.height;
  const footerHeight = 40; 

  if (finalY + footerHeight > pageHeight) {
    doc.addPage();
    doc.lastAutoTable.finalY = 20; 
  }

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY,
    head: [[
      { content: "Applicant", styles: { halign: 'left', fillColor: [240, 240, 240] } },
      { content: "Tool Room HOS", styles: { halign: 'center', fillColor: [240, 240, 240] } },
      { content: "Tool making HOS", styles: { halign: 'center', fillColor: [240, 240, 240] } },
      { content: "Tooling HOD", styles: { halign: 'center', fillColor: [240, 240, 240] } },
    ]],
    body: [[
      { content: `Emp Name: \n\nEmpCode: ${data[0]?.CreatedBy || ''}`, styles: { valign: 'top', minCellHeight: 20 } },
      { content: "", styles: { minCellHeight: 20 } },
      { content: "", styles: { minCellHeight: 20 } },
      { content: "", styles: { minCellHeight: 20 } },
    ]],
    theme: 'grid',
    styles: { 
      fontSize: 9, 
      fontStyle: 'bold', 
      lineColor: [0, 0, 0], 
      lineWidth: 0.1,
      textColor: [0, 0, 0]
    },
    headStyles: {
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.1,
      lineColor: [0, 0, 0]
    }
  });

  const footerY = doc.lastAutoTable.finalY + 5;
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text("Greentech Industries(India)Pvt.Ltd @ MG Tool making 29.03.2024 by Ramprasad", 148.5, footerY, { align: "center" });
  
  doc.setFont("helvetica", "bold");
  doc.text("TM-006-1", 280, footerY, { align: "right" });

  doc.save(`PurchaseRequest_${formattedDate}.pdf`);
};