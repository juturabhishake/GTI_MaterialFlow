import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export const exportToPDF = ({ data, reqDate, reqNo }) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const dateObj = reqDate ? new Date(reqDate) : new Date();
  const formattedDate = format(dateObj, "dd-MM-yyyy");
  const year = dateObj.getFullYear();
  const requestNumber = `${reqNo || '___'}`;

  const drawHeader = (doc) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Purchase Request Form (Regrinding Tool)", 14, 10);
    // const title = "Purchase Request Form (Regrinding Tool)";
    // doc.text(title, 14, 10);
    // const textWidth = doc.getTextWidth(title);
    // doc.setLineWidth(0.5);
    // doc.line(14, 11, 14 + textWidth, 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text('We are following "IATF 16949 CAPD method 10.3 Continuous Improvement Spirit" to improve our GTI', 14, 14);

    doc.setFontSize(9);
    doc.rect(190, 6, 3, 3);
    doc.rect(190, 6, 3, 3, "F");
    doc.text("MG-Toolroom", 195, 8.5);

    doc.rect(190, 11, 3, 3);
    doc.text("FD-Tooling", 195, 13.5);

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
  };

  const drawFooter = (doc, pageNum, totalPages) => {
    const footerHeight = 50;
    const startY = pageHeight - footerHeight;
    const remarksText = "";//data.length > 0 && data[0].Remarks ? data[0].Remarks : "NA"

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.rect(14, startY - 5, pageWidth - 28, 13);
    doc.text(`Remarks: ${remarksText}`, 16, startY + 1);

    autoTable(doc, {
      startY: startY + 4,
      head: [[
        { content: "Applicant", styles: { halign: 'center', fillColor: [240, 240, 240] } },
        { content: "Tool Room HOS", styles: { halign: 'center', fillColor: [240, 240, 240] } },
        { content: "Tool making HOS", styles: { halign: 'center', fillColor: [240, 240, 240] } },
        { content: "Tooling HOD", styles: { halign: 'center', fillColor: [240, 240, 240] } },
      ]],
      body: [[
        { content: `Emp Name: \n\nEmpCode: ${data[0]?.CreatedBy || ''}`, styles: { valign: 'top', minCellHeight: 20, halign: 'left' } },
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
        lineColor: [0, 0, 0],
        minCellHeight: 8,
        valign: 'middle'
      },
      margin: { left: 14, right: 14 },
      tableWidth: 'auto'
    });

    const bottomTextY = pageHeight - 5;
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.text("Greentech Industries(India)Pvt.Ltd @ MG Tool making 29.03.2024 by Ramprasad", pageWidth / 2, bottomTextY, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.text(`Page ${pageNum}/${totalPages}`, pageWidth - 14, bottomTextY, { align: "right" });
  };

  const tableData = data.map((row, index) => {
    let spec = row.ItemSpecification || "";
    spec = spec.replace(/Φ/g, "Ø").replace(/°/g, " deg");

    return [
      index + 1,
      row.MaterialCode || "",
      spec,
      row.OrderQty || "",
      row.CheckNGQty || "",
      row.DetermineOrderQty || "",
      row.ConfirmationByUser || "",
      row.ProjectName || "",
      row.DemandDate ? format(new Date(row.DemandDate), "dd/MMM/yyyy") : ""
    ];
  });

  const rowsPerPage = 10;
  // const totalPages = Math.ceil(tableData.length / rowsPerPage);
  const totalPages = tableData.length > 0 ? Math.ceil(tableData.length / rowsPerPage) : 1;

  for (let i = 0; i < totalPages; i++) {
    if (i > 0) {
      doc.addPage();
    }

    drawHeader(doc);

    const currentData = tableData.slice(i * rowsPerPage, (i + 1) * rowsPerPage);
    while (currentData.length < rowsPerPage) {
        currentData.push(["", "", "", "", "", "", "", "", ""]);
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
      body: currentData,
      theme: 'grid',
      styles: {
        font: "helvetica",
        fontSize: 10,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        cellPadding: 2,
        textColor: [0, 0, 0],
        valign: 'middle',
        overflow: 'linebreak',
        minCellHeight: 12
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
        fontSize: 9,
        cellPadding: 1,
        minCellHeight: 10
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
      },
      margin: { top: 20, left: 14, right: 14 }
    });

    drawFooter(doc, i + 1, totalPages);
  }

  doc.save(`PurchaseRequest_${formattedDate}.pdf`);
};  