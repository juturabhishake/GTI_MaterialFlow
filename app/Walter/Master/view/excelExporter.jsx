import * as XLSX from 'xlsx';
export const exportToExcel = async ({ jsonData, arrayOfArrays, filename }) => {
  return new Promise((resolve, reject) => {
    try {
      setTimeout(() => {
        let worksheet;

        if (arrayOfArrays) {
          worksheet = XLSX.utils.aoa_to_sheet(arrayOfArrays);
          const columnWidths = arrayOfArrays[0].map((_, colIndex) => {
            const maxLength = arrayOfArrays.reduce((max, row) => {
              const cellValue = row[colIndex];
              const cellLength = cellValue ? String(cellValue).length : 0;
              return Math.max(max, cellLength);
            }, 0);
            return { wch: maxLength + 2 };
          });
          worksheet['!cols'] = columnWidths;

        } else if (jsonData) {
          worksheet = XLSX.utils.json_to_sheet(jsonData);
          const columnWidths = Object.keys(jsonData[0] || {}).map(key => ({
            wch: Math.max(key.length, ...jsonData.map(row => String(row[key] || '').length)) + 2,
          }));
          worksheet['!cols'] = columnWidths;

        } else {
          throw new Error("No data provided for export. Use 'jsonData' or 'arrayOfArrays'.");
        }
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Data');

        XLSX.writeFile(workbook, `${filename}.xlsx`);
        
        resolve();
      }, 500);
    } catch (error) {
      console.error("Excel export failed:", error);
      reject(error);
    }
  });
};