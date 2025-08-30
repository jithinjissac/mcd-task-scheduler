import jsPDF from 'jspdf';
import { Assignment, Employee, Layout } from '@/types';

export const generatePDF = (
  assignments: Assignment,
  employees: Employee[],
  layouts: { breakfast: Layout; dayPart: Layout },
  selectedDate: Date
) => {
  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const headerHeight = 20;
    const footerHeight = 15;
    const contentHeight = pageHeight - headerHeight - footerHeight - (2 * margin);

    // Helper function to add header to page
    const addHeader = (pageTitle: string, date: Date) => {
      // Make title more prominent with larger font and better positioning
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text("McDonald's Station/Task Schedule", margin, margin + 10);
      
      // Make date and schedule name prominent
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(pageTitle, margin, margin + 22);
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Date: ${date.toLocaleDateString()}`, pageWidth - margin - 80, margin + 10);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin - 80, margin + 22);
      
      // Draw line under header
      pdf.setLineWidth(0.5);
      pdf.line(margin, margin + headerHeight + 5, pageWidth - margin, margin + headerHeight + 5);
    };

    // Helper function to add footer to page
    const addFooter = (pageNumber: number) => {
      const footerY = pageHeight - margin - 5;
      
      // Draw line above footer
      pdf.setLineWidth(0.5);
      pdf.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Printed by: McDonald's Task Scheduler - Burgernomics`, margin, footerY);
      pdf.text(`Page ${pageNumber}`, pageWidth - margin - 20, footerY);
    };

    // Helper function to add shift manager section with actual assignments and shift times
    const addShiftManagerSection = (y: number, dayPartAssignments: any) => {
      const shiftManagerAssignments = dayPartAssignments?.['shift_manager']?.['Manager on Duty'] || [];
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      
      if (shiftManagerAssignments.length > 0) {
        const managerName = shiftManagerAssignments[0]; // Get first assigned manager
        const manager = employees.find(emp => emp.name === managerName);
        
        let managerText = `Shift Manager: ${managerName}`;
        
        // Add shift times if available
        if (manager?.shiftStart && manager?.shiftEnd) {
          managerText += ` (${manager.shiftStart}-${manager.shiftEnd})`;
        }
        
        // Add minor indicator if applicable
        if (manager?.minor) {
          managerText += ' (Minor)';
        }
        
        pdf.text(managerText, margin, y);
      } else {
        pdf.text('Shift Manager: ________________', margin, y);
      }
      
      return y + 12;
    };

    // Helper function to draw a station box
    const drawStationBox = (x: number, y: number, width: number, height: number, title: string, columns: string[], stationId: string, dayPartAssignments: any) => {
      // Draw station title box
      pdf.setLineWidth(0.5);
      pdf.rect(x, y, width, 8, 'S');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      
      // Center the title text
      const textWidth = pdf.getTextWidth(title);
      const textX = x + (width - textWidth) / 2;
      pdf.text(title, textX, y + 5.5);

      let currentY = y + 8;
      
      // Draw column boxes with labels and values on same line
      columns.forEach(column => {
        const columnAssignments = dayPartAssignments?.[stationId]?.[column] || [];
        const columnBoxHeight = Math.max(12, columnAssignments.length * 4 + 8); // Reduced height since text is on same line
        
        pdf.rect(x, currentY, width, columnBoxHeight, 'S');
        
        // Column title on the left side
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text(column + ":", x + 2, currentY + 6);
        
        // Add employee names with shift times on the same line, starting after the column title
        const titleWidth = pdf.getTextWidth(column + ": ");
        let textX = x + titleWidth + 4;
        let textY = currentY + 6;
        
        columnAssignments.forEach((employeeName: string, index: number) => {
          const employee = employees.find(emp => emp.name === employeeName);
          let text = employeeName;
          if (employee?.minor) {
            text += ' (M)';
          }
          // Add actual shift time if available
          if (employee?.shiftStart && employee?.shiftEnd) {
            text += ` - ${employee.shiftStart}-${employee.shiftEnd}`;
          } else {
            text += ' - 6:00-14:00'; // Default time
          }
          
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(14); // Increased from 12 to 14 for better readability
          
          // Check if text fits on current line, if not move to next line
          const employeeTextWidth = pdf.getTextWidth(text);
          if (textX + employeeTextWidth > x + width - 2) {
            textY += 5; // Increased line spacing for larger font
            textX = x + 2;
          }
          
          pdf.text(text, textX, textY);
          textX += employeeTextWidth + 8; // Add some spacing between names
        });
        
        currentY += columnBoxHeight;
      });

      return currentY;
    };

    // Helper function to draw DFS section (informational text only)
    const drawDFSSection = (x: number, y: number, width: number) => {
      const title = "DFS discards and Calibrations";
      const columns = ["Item", "Day"];
      const dfsItems = [
        { label: "milk and hot chocolate discard", day: "Monday" },
        { label: "Shakes, sunday and topping discard", day: "Tuesday" }, 
        { label: "Oil drop temperatures recorded", day: "Wednesday" },
        { label: "Muffin, Toaster calibration", day: "Friday" },
        { label: "Egg cookers calibrations", day: "Sunday" }
      ];
      
      // Draw title box
      pdf.setLineWidth(0.5);
      pdf.rect(x, y, width, 8, 'S');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      
      // Center the title text
      const textWidth = pdf.getTextWidth(title);
      const textX = x + (width - textWidth) / 2;
      pdf.text(title, textX, y + 5.5);

      let currentY = y + 8;
      const columnWidth = width / 2; // Two columns: Item and Day
      
      // Draw column headers
      columns.forEach((column, index) => {
        const colX = x + (index * columnWidth);
        pdf.rect(colX, currentY, columnWidth, 6, 'S');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        const colTextWidth = pdf.getTextWidth(column);
        const colTextX = colX + (columnWidth - colTextWidth) / 2;
        pdf.text(column, colTextX, currentY + 4);
      });
      
      currentY += 6;
      
      // Draw content rows with DFS items and days
      dfsItems.forEach((item, rowIndex) => {
        // Item column
        pdf.rect(x, currentY, columnWidth, 8, 'S');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        const lines = pdf.splitTextToSize(item.label, columnWidth - 4);
        pdf.text(lines, x + 2, currentY + 5);
        
        // Day column with the day value
        pdf.rect(x + columnWidth, currentY, columnWidth, 8, 'S');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        pdf.text(item.day, x + columnWidth + 2, currentY + 5);
        
        currentY += 8;
      });
      
      return currentY;
    };

    // Generate Breakfast page (first page)
    if (assignments['Breakfast']) {
      // Add header
      addHeader('Breakfast Schedule', selectedDate);
      
      // Add shift manager section
      let currentY = margin + headerHeight + 10;
      const breakfastAssignments = assignments['Breakfast'] || {};
      currentY = addShiftManagerSection(currentY, breakfastAssignments);
      currentY += 5;
      
      // Left column stations
      let leftY = currentY;
      const leftX = margin;
      const stationWidth = 85;
      
      // Handheld
      leftY = drawStationBox(leftX, leftY, stationWidth, 25, "Handheld", ["Staff"], "handheld", breakfastAssignments) + 5;
      
      // Window 1
      leftY = drawStationBox(leftX, leftY, stationWidth, 35, "Window 1", ["Order Taker", "Cashier"], "window1", breakfastAssignments) + 5;
      
      // Window 2
      leftY = drawStationBox(leftX, leftY, stationWidth, 60, "Window 2", ["Presenter", "Checker", "Runner", "Holds"], "window2", breakfastAssignments) + 5;
      
      // Front Hand Wash
      leftY = drawStationBox(leftX, leftY, stationWidth, 25, "Front Hand Wash", ["Staff"], "front_hand_wash", breakfastAssignments) + 5;
      
      // Order Assembly
      leftY = drawStationBox(leftX, leftY, stationWidth, 75, "Order Assembly", ["1. R/P", "2. R/P", "3. Delivery checker", "4. Expeditator", "5. Delivery Drinks"], "order_assembly", breakfastAssignments) + 5;
      
      // Middle column stations
      let middleY = currentY;
      const middleX = leftX + stationWidth + 10;
      
      // Kitchen Leader/Hand Wash
      middleY = drawStationBox(middleX, middleY, stationWidth, 25, "Kitchen Leader/Hand Wash", ["Staff"], "kitchen_leader", breakfastAssignments) + 5;
      
      // Line 1
      middleY = drawStationBox(middleX, middleY, stationWidth, 35, "Line 1", ["Screen", "Rolls"], "line1", breakfastAssignments) + 5;
      
      // Line 2
      middleY = drawStationBox(middleX, middleY, stationWidth, 35, "Line 2", ["Screen", "Rolls"], "line2", breakfastAssignments) + 5;
      
      // Batch
      middleY = drawStationBox(middleX, middleY, stationWidth, 45, "Batch", ["Muffins", "Sausage", "Eggs"], "batch", breakfastAssignments) + 5;
      
      // Oven
      middleY = drawStationBox(middleX, middleY, stationWidth, 25, "Oven", ["Staff"], "oven", breakfastAssignments) + 5;
      
      // Backroom/Change Over
      middleY = drawStationBox(middleX, middleY, stationWidth, 25, "Backroom/Change Over", ["Staff"], "backroom", breakfastAssignments) + 5;
      
      // Hash browns
      drawStationBox(middleX, middleY, stationWidth, 25, "Hash browns", ["Staff"], "hash_browns", breakfastAssignments);
      
      // Right column stations
      let rightY = currentY;
      const rightX = middleX + stationWidth + 10;
      
      // Customer Care
      rightY = drawStationBox(rightX, rightY, stationWidth, 25, "Customer Care", ["Staff"], "customer_care", breakfastAssignments) + 5;
      
      // Beverage Cell
      rightY = drawStationBox(rightX, rightY, stationWidth, 45, "Beverage Cell", ["Soft Drinks", "Shakes", "Hot Drinks"], "beverage_cell", breakfastAssignments) + 5;
      
      // Breaks
      rightY = drawStationBox(rightX, rightY, stationWidth, 35, "Breaks", ["Kitchen", "Front"], "breaks", breakfastAssignments) + 5;
      
      // DIVE
      rightY = drawStationBox(rightX, rightY, stationWidth, 35, "DIVE", ["09:00", "11:00"], "dive", breakfastAssignments) + 5;
      
      // DFS discards and Calibrations
      drawDFSSection(rightX, rightY, stationWidth);
      
      // Add footer
      addFooter(1);
    }

    // Generate Day Part 1 page
    if (assignments['Day Part 1']) {
      // Add new page if Breakfast exists
      if (assignments['Breakfast']) {
        pdf.addPage();
      }
      
      // Add header
      addHeader('Day Part 1 Schedule', selectedDate);
      
      // Add shift manager section
      let currentY = margin + headerHeight + 10;
      const dayPart1Assignments = assignments['Day Part 1'] || {};
      currentY = addShiftManagerSection(currentY, dayPart1Assignments);
      currentY += 5;
      
      // Left column stations
      let leftY = currentY;
      const leftX = margin;
      const stationWidth = 85;
      
      // Handheld
      leftY = drawStationBox(leftX, leftY, stationWidth, 30, "Handheld", ["Staff"], "handheld", dayPart1Assignments) + 5;
      
      // Window 1
      leftY = drawStationBox(leftX, leftY, stationWidth, 30, "Window 1", ["Order Taker", "Cashier"], "window1", dayPart1Assignments) + 5;
      
      // Window 2
      leftY = drawStationBox(leftX, leftY, stationWidth, 50, "Window 2", ["Presenter", "Checker", "Runner", "Holds"], "window2", dayPart1Assignments) + 5;
      
      // Front Hand Wash
      leftY = drawStationBox(leftX, leftY, stationWidth, 25, "Front Hand Wash", ["Staff"], "front_hand_wash", dayPart1Assignments) + 5;
      
      // Order Assembly
      drawStationBox(leftX, leftY, stationWidth, 70, "Order Assembly", ["1. R/P", "2. R/P", "3. Delivery checker", "4. Expeditator", "5. Delivery Drinks"], "order_assembly", dayPart1Assignments);
      
      // Middle column stations
      let middleY = currentY;
      const middleX = leftX + stationWidth + 10;
      
      // Kitchen Leader/Hand Wash
      middleY = drawStationBox(middleX, middleY, stationWidth, 25, "Kitchen Leader/Hand Wash", ["Staff"], "kitchen_leader", dayPart1Assignments) + 5;
      
      // Line 1
      middleY = drawStationBox(middleX, middleY, stationWidth, 45, "Line 1", ["Initiator", "Assembler", "Finisher"], "line1", dayPart1Assignments) + 5;
      
      // Line 2
      middleY = drawStationBox(middleX, middleY, stationWidth, 45, "Line 2", ["Initiator", "Assembler", "Finisher"], "line2", dayPart1Assignments) + 5;
      
      // Batch Grill
      middleY = drawStationBox(middleX, middleY, stationWidth, 25, "Batch Grill", ["Staff"], "batch_grill", dayPart1Assignments) + 5;
      
      // Batch Chicken
      middleY = drawStationBox(middleX, middleY, stationWidth, 25, "Batch Chicken", ["Staff"], "batch_chicken", dayPart1Assignments) + 5;
      
      // Backroom
      middleY = drawStationBox(middleX, middleY, stationWidth, 25, "Backroom", ["Staff"], "backroom", dayPart1Assignments) + 5;
      
      // Fries
      drawStationBox(middleX, middleY, stationWidth, 25, "Fries", ["Staff"], "fries", dayPart1Assignments);
      
      // Right column stations
      let rightY = currentY;
      const rightX = middleX + stationWidth + 10;
      
      // Customer Care
      rightY = drawStationBox(rightX, rightY, stationWidth, 25, "Customer Care", ["Staff"], "customer_care", dayPart1Assignments) + 5;
      
      // Beverage Cell
      rightY = drawStationBox(rightX, rightY, stationWidth, 45, "Beverage Cell", ["Soft Drinks", "Shakes", "Hot Drinks"], "beverage_cell", dayPart1Assignments) + 5;
      
      // Breaks
      rightY = drawStationBox(rightX, rightY, stationWidth, 35, "Breaks", ["Kitchen", "Front"], "breaks", dayPart1Assignments) + 5;
      
      // DIVE
      rightY = drawStationBox(rightX, rightY, stationWidth, 60, "DIVE", ["11:00", "15:00", "19:00", "CLOSE"], "dive", dayPart1Assignments) + 5;
      
      // DELIVERY
      drawStationBox(rightX, rightY, stationWidth, 25, "DELIVERY", ["Staff"], "delivery", dayPart1Assignments);
      
      // Add footer
      const pageNumber = assignments['Breakfast'] ? 2 : 1;
      addFooter(pageNumber);
    }

    // Generate Day Part 2 page
    if (assignments['Day Part 2']) {
      // Add new page if Day Part 1 exists
      if (assignments['Day Part 1']) {
        pdf.addPage();
      }
      
      // Add header
      addHeader('Day Part 2 Schedule', selectedDate);
      
      // Add shift manager section
      let currentY = margin + headerHeight + 10;
      const dayPart2Assignments = assignments['Day Part 2'] || {};
      currentY = addShiftManagerSection(currentY, dayPart2Assignments);
      currentY += 5;
      
      // Left column stations
      let leftY = currentY;
      const leftX = margin;
      const stationWidth = 85;
      
      // Handheld
      leftY = drawStationBox(leftX, leftY, stationWidth, 30, "Handheld", ["Staff"], "handheld", dayPart2Assignments) + 5;
      
      // Window 1
      leftY = drawStationBox(leftX, leftY, stationWidth, 30, "Window 1", ["Order Taker", "Cashier"], "window1", dayPart2Assignments) + 5;
      
      // Window 2
      leftY = drawStationBox(leftX, leftY, stationWidth, 50, "Window 2", ["Presenter", "Checker", "Runner", "Holds"], "window2", dayPart2Assignments) + 5;
      
      // Front Hand Wash
      leftY = drawStationBox(leftX, leftY, stationWidth, 25, "Front Hand Wash", ["Staff"], "front_hand_wash", dayPart2Assignments) + 5;
      
      // Order Assembly
      drawStationBox(leftX, leftY, stationWidth, 70, "Order Assembly", ["1. R/P", "2. R/P", "3. Delivery checker", "4. Expeditator", "5. Delivery Drinks"], "order_assembly", dayPart2Assignments);
      
      // Middle column stations
      let middleY = currentY;
      const middleX = leftX + stationWidth + 10;
      
      // Kitchen Leader/Hand Wash
      middleY = drawStationBox(middleX, middleY, stationWidth, 25, "Kitchen Leader/Hand Wash", ["Staff"], "kitchen_leader", dayPart2Assignments) + 5;
      
      // Line 1
      middleY = drawStationBox(middleX, middleY, stationWidth, 45, "Line 1", ["Initiator", "Assembler", "Finisher"], "line1", dayPart2Assignments) + 5;
      
      // Line 2
      middleY = drawStationBox(middleX, middleY, stationWidth, 45, "Line 2", ["Initiator", "Assembler", "Finisher"], "line2", dayPart2Assignments) + 5;
      
      // Batch Grill
      middleY = drawStationBox(middleX, middleY, stationWidth, 25, "Batch Grill", ["Staff"], "batch_grill", dayPart2Assignments) + 5;
      
      // Batch Chicken
      middleY = drawStationBox(middleX, middleY, stationWidth, 25, "Batch Chicken", ["Staff"], "batch_chicken", dayPart2Assignments) + 5;
      
      // Backroom
      middleY = drawStationBox(middleX, middleY, stationWidth, 25, "Backroom", ["Staff"], "backroom", dayPart2Assignments) + 5;
      
      // Fries
      drawStationBox(middleX, middleY, stationWidth, 25, "Fries", ["Staff"], "fries", dayPart2Assignments);
      
      // Right column stations
      let rightY = currentY;
      const rightX = middleX + stationWidth + 10;
      
      // Customer Care
      rightY = drawStationBox(rightX, rightY, stationWidth, 25, "Customer Care", ["Staff"], "customer_care", dayPart2Assignments) + 5;
      
      // Beverage Cell
      rightY = drawStationBox(rightX, rightY, stationWidth, 45, "Beverage Cell", ["Soft Drinks", "Shakes", "Hot Drinks"], "beverage_cell", dayPart2Assignments) + 5;
      
      // Breaks
      rightY = drawStationBox(rightX, rightY, stationWidth, 35, "Breaks", ["Kitchen", "Front"], "breaks", dayPart2Assignments) + 5;
      
      // DIVE
      rightY = drawStationBox(rightX, rightY, stationWidth, 60, "DIVE", ["11:00", "15:00", "19:00", "CLOSE"], "dive", dayPart2Assignments) + 5;
      
      // DELIVERY
      drawStationBox(rightX, rightY, stationWidth, 25, "DELIVERY", ["Staff"], "delivery", dayPart2Assignments);
      
      // Add footer with correct page number
      let pageNumber = 1;
      if (assignments['Breakfast']) pageNumber++;
      if (assignments['Day Part 1']) pageNumber++;
      addFooter(pageNumber);
    }

    // Save the PDF
    const fileName = `McDonald's Schedule - ${selectedDate.toLocaleDateString()}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

// Export print function for HTML version
export const printSchedule = (
  assignments: Assignment,
  employees: Employee[],
  layouts: { breakfast: Layout; dayPart: Layout },
  selectedDate: Date
) => {
  try {
    // Create HTML structure that matches the paper forms
    let htmlContent = '';
    
    // Generate Breakfast page HTML (first page)
    if (assignments['Breakfast']) {
      const breakfastAssignments = assignments['Breakfast'] || {};
      
      htmlContent += `
        <div class="page">
          <div class="page-header">
            <h1>McDonald's Station/Task Schedule</h1>
            <div class="header-info">
              <span class="schedule-name">Breakfast Schedule</span>
              <span class="schedule-date">Date: ${selectedDate.toLocaleDateString()}</span>
              <span>Generated: ${new Date().toLocaleString()}</span>
            </div>
          </div>
          <div class="shift-manager-section">
            ${(() => {
              const shiftManagerAssignments = breakfastAssignments?.['shift_manager']?.['Manager on Duty'] || [];
              if (shiftManagerAssignments.length > 0) {
                const managerName = shiftManagerAssignments[0];
                const manager = employees.find(emp => emp.name === managerName);
                const minorIndicator = manager?.minor ? ' (Minor)' : '';
                const shiftTimes = manager?.shiftStart && manager?.shiftEnd ? ` (${manager.shiftStart}-${manager.shiftEnd})` : '';
                return `<span>Shift Manager: ${managerName}${shiftTimes}${minorIndicator}</span>`;
              } else {
                return `<span>Shift Manager: ________________</span>`;
              }
            })()}
          </div>
          <div class="content">
            <div class="column">
              ${generateStationHTML("Handheld", ["Staff"], "handheld", breakfastAssignments, employees)}
              ${generateStationHTML("Window 1", ["Order Taker", "Cashier"], "window1", breakfastAssignments, employees)}
              ${generateStationHTML("Window 2", ["Presenter", "Checker", "Runner", "Holds"], "window2", breakfastAssignments, employees)}
              ${generateStationHTML("Front Hand Wash", ["Staff"], "front_hand_wash", breakfastAssignments, employees)}
              ${generateStationHTML("Order Assembly", ["1. R/P", "2. R/P", "3. Delivery checker", "4. Expeditator", "5. Delivery Drinks"], "order_assembly", breakfastAssignments, employees)}
            </div>
            <div class="column">
              ${generateStationHTML("Kitchen Leader/Hand Wash", ["Staff"], "kitchen_leader", breakfastAssignments, employees)}
              ${generateStationHTML("Line 1", ["Screen", "Rolls"], "line1", breakfastAssignments, employees)}
              ${generateStationHTML("Line 2", ["Screen", "Rolls"], "line2", breakfastAssignments, employees)}
              ${generateStationHTML("Batch", ["Muffins", "Sausage", "Eggs"], "batch", breakfastAssignments, employees)}
              ${generateStationHTML("Oven", ["Staff"], "oven", breakfastAssignments, employees)}
              ${generateStationHTML("Backroom/Change Over", ["Staff"], "backroom", breakfastAssignments, employees)}
              ${generateStationHTML("Hash browns", ["Staff"], "hash_browns", breakfastAssignments, employees)}
            </div>
            <div class="column">
              ${generateStationHTML("Customer Care", ["Staff"], "customer_care", breakfastAssignments, employees)}
              ${generateStationHTML("Beverage Cell", ["Soft Drinks", "Shakes", "Hot Drinks"], "beverage_cell", breakfastAssignments, employees)}
              ${generateStationHTML("Breaks", ["Kitchen", "Front"], "breaks", breakfastAssignments, employees)}
              ${generateStationHTML("DIVE", ["09:00", "11:00"], "dive", breakfastAssignments, employees)}
              ${generateDFSHTML()}
            </div>
          </div>
          <div class="page-footer">
            <span>Printed by: McDonald's Task Scheduler - Burgernomics</span>
            <span>Page 1</span>
          </div>
        </div>
      `;
    }

    // Generate Day Part 1 page HTML
    if (assignments['Day Part 1']) {
      const dayPart1Assignments = assignments['Day Part 1'] || {};
      
      htmlContent += `
        <div class="page">
          <div class="page-header">
            <h1>McDonald's Station/Task Schedule</h1>
            <div class="header-info">
              <span class="schedule-name">Day Part 1 Schedule</span>
              <span class="schedule-date">Date: ${selectedDate.toLocaleDateString()}</span>
              <span>Generated: ${new Date().toLocaleString()}</span>
            </div>
          </div>
          <div class="shift-manager-section">
            ${(() => {
              const shiftManagerAssignments = dayPart1Assignments?.['shift_manager']?.['Manager on Duty'] || [];
              if (shiftManagerAssignments.length > 0) {
                const managerName = shiftManagerAssignments[0];
                const manager = employees.find(emp => emp.name === managerName);
                const minorIndicator = manager?.minor ? ' (Minor)' : '';
                const shiftTimes = manager?.shiftStart && manager?.shiftEnd ? ` (${manager.shiftStart}-${manager.shiftEnd})` : '';
                return `<span>Shift Manager: ${managerName}${shiftTimes}${minorIndicator}</span>`;
              } else {
                return `<span>Shift Manager: ________________</span>`;
              }
            })()}
          </div>
          <div class="content">
            <div class="column">
              ${generateStationHTML("Handheld", ["Staff"], "handheld", dayPart1Assignments, employees)}
              ${generateStationHTML("Window 1", ["Order Taker", "Cashier"], "window1", dayPart1Assignments, employees)}
              ${generateStationHTML("Window 2", ["Presenter", "Checker", "Runner", "Holds"], "window2", dayPart1Assignments, employees)}
              ${generateStationHTML("Front Hand Wash", ["Staff"], "front_hand_wash", dayPart1Assignments, employees)}
              ${generateStationHTML("Order Assembly", ["1. R/P", "2. R/P", "3. Delivery checker", "4. Expeditator", "5. Delivery Drinks"], "order_assembly", dayPart1Assignments, employees)}
            </div>
            <div class="column">
              ${generateStationHTML("Kitchen Leader/Hand Wash", ["Staff"], "kitchen_leader", dayPart1Assignments, employees)}
              ${generateStationHTML("Line 1", ["Initiator", "Assembler", "Finisher"], "line1", dayPart1Assignments, employees)}
              ${generateStationHTML("Line 2", ["Initiator", "Assembler", "Finisher"], "line2", dayPart1Assignments, employees)}
              ${generateStationHTML("Batch Grill", ["Staff"], "batch_grill", dayPart1Assignments, employees)}
              ${generateStationHTML("Batch Chicken", ["Staff"], "batch_chicken", dayPart1Assignments, employees)}
              ${generateStationHTML("Backroom", ["Staff"], "backroom", dayPart1Assignments, employees)}
              ${generateStationHTML("Fries", ["Staff"], "fries", dayPart1Assignments, employees)}
            </div>
            <div class="column">
              ${generateStationHTML("Customer Care", ["Staff"], "customer_care", dayPart1Assignments, employees)}
              ${generateStationHTML("Beverage Cell", ["Soft Drinks", "Shakes", "Hot Drinks"], "beverage_cell", dayPart1Assignments, employees)}
              ${generateStationHTML("Breaks", ["Kitchen", "Front"], "breaks", dayPart1Assignments, employees)}
              ${generateStationHTML("DIVE", ["11:00", "15:00", "19:00", "CLOSE"], "dive", dayPart1Assignments, employees)}
              ${generateStationHTML("DELIVERY", ["Staff"], "delivery", dayPart1Assignments, employees)}
            </div>
          </div>
          <div class="page-footer">
            <span>Printed by: McDonald's Task Scheduler - Burgernomics</span>
            <span>Page ${assignments['Breakfast'] ? '2' : '1'}</span>
          </div>
        </div>
      `;
    }

    // Generate Day Part 2 page HTML
    if (assignments['Day Part 2']) {
      const dayPart2Assignments = assignments['Day Part 2'] || {};
      
      htmlContent += `
        <div class="page">
          <div class="page-header">
            <h1>McDonald's Station/Task Schedule</h1>
            <div class="header-info">
              <span class="schedule-name">Day Part 2 Schedule</span>
              <span class="schedule-date">Date: ${selectedDate.toLocaleDateString()}</span>
              <span>Generated: ${new Date().toLocaleString()}</span>
            </div>
          </div>
          <div class="shift-manager-section">
            ${(() => {
              const shiftManagerAssignments = dayPart2Assignments?.['shift_manager']?.['Manager on Duty'] || [];
              if (shiftManagerAssignments.length > 0) {
                const managerName = shiftManagerAssignments[0];
                const manager = employees.find(emp => emp.name === managerName);
                const minorIndicator = manager?.minor ? ' (Minor)' : '';
                const shiftTimes = manager?.shiftStart && manager?.shiftEnd ? ` (${manager.shiftStart}-${manager.shiftEnd})` : '';
                return `<span>Shift Manager: ${managerName}${shiftTimes}${minorIndicator}</span>`;
              } else {
                return `<span>Shift Manager: ________________</span>`;
              }
            })()}
          </div>
          <div class="content">
            <div class="column">
              ${generateStationHTML("Handheld", ["Staff"], "handheld", dayPart2Assignments, employees)}
              ${generateStationHTML("Window 1", ["Order Taker", "Cashier"], "window1", dayPart2Assignments, employees)}
              ${generateStationHTML("Window 2", ["Presenter", "Checker", "Runner", "Holds"], "window2", dayPart2Assignments, employees)}
              ${generateStationHTML("Front Hand Wash", ["Staff"], "front_hand_wash", dayPart2Assignments, employees)}
              ${generateStationHTML("Order Assembly", ["1. R/P", "2. R/P", "3. Delivery checker", "4. Expeditator", "5. Delivery Drinks"], "order_assembly", dayPart2Assignments, employees)}
            </div>
            <div class="column">
              ${generateStationHTML("Kitchen Leader/Hand Wash", ["Staff"], "kitchen_leader", dayPart2Assignments, employees)}
              ${generateStationHTML("Line 1", ["Initiator", "Assembler", "Finisher"], "line1", dayPart2Assignments, employees)}
              ${generateStationHTML("Line 2", ["Initiator", "Assembler", "Finisher"], "line2", dayPart2Assignments, employees)}
              ${generateStationHTML("Batch Grill", ["Staff"], "batch_grill", dayPart2Assignments, employees)}
              ${generateStationHTML("Batch Chicken", ["Staff"], "batch_chicken", dayPart2Assignments, employees)}
              ${generateStationHTML("Backroom", ["Staff"], "backroom", dayPart2Assignments, employees)}
              ${generateStationHTML("Fries", ["Staff"], "fries", dayPart2Assignments, employees)}
            </div>
            <div class="column">
              ${generateStationHTML("Customer Care", ["Staff"], "customer_care", dayPart2Assignments, employees)}
              ${generateStationHTML("Beverage Cell", ["Soft Drinks", "Shakes", "Hot Drinks"], "beverage_cell", dayPart2Assignments, employees)}
              ${generateStationHTML("Breaks", ["Kitchen", "Front"], "breaks", dayPart2Assignments, employees)}
              ${generateStationHTML("DIVE", ["11:00", "15:00", "19:00", "CLOSE"], "dive", dayPart2Assignments, employees)}
              ${generateStationHTML("DELIVERY", ["Staff"], "delivery", dayPart2Assignments, employees)}
            </div>
          </div>
          <div class="page-footer">
            <span>Printed by: McDonald's Task Scheduler - Burgernomics</span>
            <span>Page ${assignments['Day Part 1'] ? '2' : '1'}</span>
          </div>
        </div>
      `;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print dialog. Please check if pop-ups are blocked.');
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>McDonald's Schedule - ${selectedDate.toLocaleDateString()}</title>
          <style>
            @media print { 
              @page { 
                size: landscape; 
                margin: 0.5in; 
              } 
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 0; 
              background: white;
            }
            .page { 
              width: 100%; 
              min-height: 100vh; 
              page-break-after: always; 
              display: flex; 
              flex-direction: column;
              box-sizing: border-box;
              padding: 15px;
            }
            .page:last-child { 
              page-break-after: avoid; 
            }
            .page-header {
              border-bottom: 2px solid black;
              margin-bottom: 15px;
              padding-bottom: 10px;
            }
            .page-header h1 {
              margin: 0;
              font-size: 20px;
              font-weight: bold;
              color: black;
            }
            .header-info {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              margin-top: 8px;
            }
            .schedule-name {
              font-size: 16px !important;
              font-weight: bold !important;
              color: black !important;
            }
            .schedule-date {
              font-size: 14px !important;
              font-weight: bold !important;
              color: black !important;
            }
            .shift-manager-section {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 15px;
              padding: 5px 0;
              border-bottom: 1px solid #000;
            }
            .page-footer {
              border-top: 1px solid black;
              margin-top: auto;
              padding-top: 10px;
              display: flex;
              justify-content: space-between;
              font-size: 10px;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              font-weight: bold; 
              font-size: 14px; 
              margin-bottom: 10px; 
              padding: 0 10px;
            }
            .shift-manager { 
              font-weight: bold; 
              margin-bottom: 10px; 
              padding: 0 10px;
            }
            .content { 
              display: flex; 
              justify-content: space-between; 
              flex: 1; 
              padding: 0 10px;
            }
            .column { 
              width: 32%; 
            }
            .station { 
              margin-bottom: 10px; 
              border: 1px solid black; 
              break-inside: avoid;
            }
            .station-title { 
              background: #f0f0f0; 
              padding: 4px; 
              text-align: center; 
              font-weight: bold; 
              border-bottom: 1px solid black; 
              font-size: 12px;
            }
            .station-column { 
              border-bottom: 1px solid black; 
            }
            .station-column:last-child {
              border-bottom: none;
            }
            .station-column-inline {
              border-bottom: 1px solid black;
              padding: 4px;
              display: flex;
              align-items: center;
            }
            .station-column-inline:last-child {
              border-bottom: none;
            }
            .column-label {
              font-weight: bold;
              font-size: 14px;
              margin-right: 8px;
              flex-shrink: 0;
              color: black;
            }
            .column-employees {
              font-size: 13px;
              font-weight: Regular;
              flex: 1;
              color: black;
            }
            .column-title { 
              padding: 2px 4px; 
              font-size: 12px; 
              background: #f8f8f8; 
              border-bottom: 1px solid black;
            }
            .column-content { 
              min-height: 20px; 
              padding: 2px 4px; 
              font-size: 16px;
              font-weight: bold;
              line-height: 1.4;
              color: black;
            }
            .dfs-table { 
              width: 100%; 
              border-collapse: collapse; 
            }
            .dfs-table td, .dfs-table th { 
              border: 1px solid black; 
              padding: 4px; 
              text-align: center; 
              font-size: 12px; 
            }
            .dfs-table th {
              background: #f0f0f0;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Add a small delay to ensure the content is loaded before printing
    setTimeout(() => {
      printWindow.print();
    }, 500);
    
  } catch (error) {
    console.error('Error opening print dialog:', error);
    throw new Error('Error opening print dialog. Please try again.');
  }
};

// Helper function to generate station HTML
const generateStationHTML = (title: string, columns: string[], stationId: string, assignments: any, employees: Employee[]): string => {
  const columnsHTML = columns.map(column => {
    const assignedEmployees = assignments?.[stationId]?.[column] || [];
    const employeesHTML = assignedEmployees.map((employeeName: string) => {
      const employee = employees.find(emp => emp.name === employeeName);
      let text = employee?.minor ? `${employeeName} (M)` : employeeName;
      // Add actual shift time if available
      if (employee?.shiftStart && employee?.shiftEnd) {
        text += ` - ${employee.shiftStart}-${employee.shiftEnd}`;
      } else {
        text += ' - 6:00-14:00';
      }
      return text;
    }).join(', ');
    
    return `
      <div class="station-column-inline">
        <span class="column-label">${column}:</span>
        <span class="column-employees">${employeesHTML}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="station">
      <div class="station-title">${title}</div>
      ${columnsHTML}
    </div>
  `;
};

// Helper function to generate DFS HTML (informational text only)
const generateDFSHTML = (): string => {
  const columns = ["Item", "Day"];
  const dfsItems = [
    { label: "milk and hot chocolate discard", day: "Monday" },
    { label: "Shakes, sunday and topping discard", day: "Tuesday" }, 
    { label: "Oil drop temperatures recorded", day: "Wednesday" },
    { label: "Muffin, Toaster calibration", day: "Friday" },
    { label: "Egg cookers calibrations", day: "Sunday" }
  ];
  
  const headerRow = `
    <tr>
      <th colspan="2">DFS discards and Calibrations</th>
    </tr>
    <tr>
      ${columns.map(column => `<th>${column}</th>`).join('')}
    </tr>
  `;
  
  const rows = dfsItems.map(item => {
    return `<tr>
      <td style="text-align: left; font-size: 12px; padding: 4px;">${item.label}</td>
      <td style="text-align: left; font-size: 12px; padding: 4px;">${item.day}</td>
    </tr>`;
  }).join('');

  return `
    <div class="station">
      <table class="dfs-table">
        ${headerRow}
        ${rows}
      </table>
    </div>
  `;
};
