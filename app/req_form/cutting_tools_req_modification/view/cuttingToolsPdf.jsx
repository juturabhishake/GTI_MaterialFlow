import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const generateCuttingToolPDF = (data) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const cleanText = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/Φ/g, 'Ø') 
      .replace(/φ/g, 'ø')
      .replace(/°/g, String.fromCharCode(176));
  };

  const pageWidth = doc.internal.pageSize.width;
  const margins = 10;
  const contentWidth = pageWidth - (margins * 2);

  const globalStyles = {
    font: 'helvetica',
    fontSize: 10,
    lineColor: [0, 0, 0],
    lineWidth: 0.3,
    textColor: [0, 0, 0],
    cellPadding: 2,
  };

  const labelStyles = {
    fillColor: [230, 230, 230],
    fontStyle: 'bold',
    halign: 'left',
    valign: 'middle'
  };

  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Cutting Tools Modification Request Form", pageWidth / 2, 15, { align: "center" });
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text('We are following "IATF16949 CAPD method 10.3 Continuous Improvement Spirit to Improve our GTI"', pageWidth / 2, 20, { align: "center" });

  doc.setLineWidth(0.3);
  doc.line(margins, 23, pageWidth - margins, 23);

  const col1Width = 35;
  const col3Width = 35;
  const col2Width = (contentWidth - col1Width - col3Width) / 2;
  const col4Width = col2Width;

  autoTable(doc, {
    startY: 25,
    theme: 'grid',
    styles: globalStyles,
    tableWidth: contentWidth,
    margin: { left: margins },
    columnStyles: {
        0: { cellWidth: col1Width, ...labelStyles },
        1: { cellWidth: col2Width }, 
        2: { cellWidth: col3Width, ...labelStyles },
        3: { cellWidth: col4Width } 
    },
    body: [
      [
        'Request Section:', 
        data.RequestSection, 
        'Date:', 
        data.RequestDate ? format(new Date(data.RequestDate), 'dd-MM-yyyy') : ''
      ],
      [
        'Request By:', 
        data.RequestedBy, 
        'Received Qty:', 
        cleanText(data.ReceivedQty)
      ],
      [
        'Checked By:', 
        data.CheckedBy, 
        'Received By:', 
        data.ReceivedBy
      ],
    ],
  });

  const mainCol1Width = 35;
  const mainColDataWidth = (contentWidth - mainCol1Width) / 2;

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY, 
    theme: 'grid',
    styles: globalStyles,
    tableWidth: contentWidth,
    margin: { left: margins },
    columnStyles: { 
      0: { cellWidth: mainCol1Width, ...labelStyles }, 
      1: { cellWidth: mainColDataWidth }, 
      2: { cellWidth: mainColDataWidth } 
    },
    headStyles: { ...labelStyles, halign: 'center', fillColor: [230, 230, 230] },
    head: [
      [
        'Content', 
        'Current Specification of Tool', 
        'Required Specification of the Tool'
      ]
    ],
    body: [
      ['Item Code', cleanText(data.From_ItemCode), cleanText(data.To_ItemCode)],
      ['Specification', cleanText(data.From_Specification), cleanText(data.To_Specification)],
      ['Project', cleanText(data.From_Project), cleanText(data.To_Project)],
      ['Operation', cleanText(data.From_Operation), cleanText(data.To_Operation)],
      ['Drawing No', cleanText(data.From_DrawingNo), cleanText(data.To_DrawingNo)],
    ],
  });

  const purposeOptions = ['Tool Life Issue', 'Quality Issue', 'Less Inventory', 'Implementation', 'Others'];
  const selectedPurposes = data.Purpose ? data.Purpose.split(', ').map(s => s.trim()) : [];

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY,
    theme: 'grid',
    styles: globalStyles,
    tableWidth: contentWidth,
    margin: { left: margins },
    columnStyles: {
        0: { cellWidth: mainCol1Width, ...labelStyles },
        1: { cellWidth: (contentWidth - mainCol1Width) } 
    },
    body: [
      [
        'Purpose of Modification:', 
        '' 
      ],
      [
        'Reason:', 
        { content: cleanText(data.Reason), styles: { minCellHeight: 20, valign: 'top' } }
      ]
    ],
    didDrawCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 1 && hookData.row.index === 0) {
            const cell = hookData.cell;
            const xStart = cell.x + 2;
            const yCenter = cell.y + (cell.height / 2);
            let currentX = xStart;

            const standardOptions = ['Tool Life Issue', 'Quality Issue', 'Less Inventory', 'Implementation'];
            
            const optionsLoop = [...standardOptions, 'Others'];

            const currentPurpose = data.Purpose || '';

            optionsLoop.forEach((opt) => {
                let isSelected = false;
                let textToDisplay = opt;

                if (opt !== 'Others') {
                    if (currentPurpose === opt) {
                        isSelected = true;
                    }
                } else {
                    if (currentPurpose && !standardOptions.includes(currentPurpose)) {
                        isSelected = true;
                        textToDisplay = `Others (${cleanText(currentPurpose)})`;
                    }
                }
                
                doc.setLineWidth(0.2);
                doc.setDrawColor(0);
                doc.rect(currentX, yCenter - 2, 4, 4); 

                if (isSelected) {
                    doc.setFillColor(0); 
                    doc.rect(currentX, yCenter - 2, 4, 4, 'F');
                }

                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(0);
                doc.text(textToDisplay, currentX + 6, yCenter + 1.5);

                const textWidth = doc.getTextWidth(textToDisplay);
                currentX += 6 + textWidth + 8; 
            });
        }
    }
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY,
    theme: 'grid',
    tableWidth: contentWidth,
    margin: { left: margins },
    styles: { ...globalStyles, valign: 'bottom', minCellHeight: 25 },
    columnStyles: {
        0: { cellWidth: contentWidth / 2 },
        1: { cellWidth: contentWidth / 2 }
    },
    body: [
      [
        { content: 'Tool Making HOD/HOS', styles: { halign: 'left' } },
        { content: 'Department HOD/HOS', styles: { halign: 'right' } }
      ]
    ]
  });

  doc.save(`CuttingToolRequest_${data.Id}.pdf`);
};