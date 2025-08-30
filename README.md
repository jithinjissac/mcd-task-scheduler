# McDonald's Task Scheduler - Burgernomics

A comprehensive web application designed to help McDonald's restaurant managers assign employees to specific roles and tasks across different day parts. The application features an intuitive drag-and-drop interface, Google Sheets integration, and supports importing shift data from CSV/XLSX files.

## 🚀 Features

### Core Features
- **Google Sheet Integration**: Import employee shift data from CSV/XLSX files
- **Different Day Part Layouts**: Breakfast layout vs Day Part layout (lunch/dinner)
- **Minor Employee Tracking**: Special handling and visual indicators for employees under 18
- **Drag-and-Drop Interface**: Intuitive assignment of employees to tasks
- **Three Day Parts**: Support for Breakfast, Day Part 1, and Day Part 2 shifts
- **Print-Ready PDF Export**: Generates schedules that match the original paper format exactly
- **Flexible Assignment**: Employees can be assigned to multiple positions
- **Warning System**: Alerts for potential conflicts (e.g., double assignments)
- **CSV Template Download**: Provides properly formatted template for data entry
- **Real-time Updates**: Immediate visual feedback for all assignments

### Day Part Specific Features

**Breakfast Specific:**
- Simplified layout with breakfast-specific stations
- Hash browns station
- Batch cooking (Muffins, Sausage, Eggs)
- Oven operations
- DIVE times: 09:00, 11:00
- DFS Discards and Calibrations schedule table

**Day Part Specific:**
- Full kitchen operations layout
- Initiator/Assembler/Finisher workflow
- Separate Batch Grill and Batch Chicken stations
- Fries station
- Extended DIVE times: 11:00, 15:00, 19:00, CLOSE
- Delivery operations

## 🏗️ System Architecture

```
┌─────────────────────────────────────┐
│           Frontend (Next.js)        │
│  ┌─────────────────────────────────┐ │
│  │     Employee Pool Component     │ │
│  └─────────────────────────────────┘ │
│  ┌─────────────────────────────────┐ │
│  │   Assignment Grid Component     │ │
│  └─────────────────────────────────┘ │
│  ┌─────────────────────────────────┐ │
│  │    Header and Navigation        │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
               │
┌─────────────────────────────────────┐
│          State Management           │
│  • Employee Data                    │
│  • Assignment Data                  │
│  • Layout Configuration             │
│  • UI State                         │
└─────────────────────────────────────┘
               │
┌─────────────────────────────────────┐
│          Data Processing            │
│  • CSV/XLSX Parsing (PapaParse)     │
│  • Assignment Logic                 │
│  • PDF Export (jsPDF)               │
│  • File Download Management         │
└─────────────────────────────────────┘
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **File Processing**: PapaParse (CSV parsing)
- **PDF Generation**: jsPDF
- **State Management**: React Hooks (useState, useEffect)
- **Development**: Node.js, npm

## 📋 Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager
- Modern web browser with HTML5 support

## 🚀 Installation

1. **Clone the Repository**
```bash
git clone [repository-url]
cd mcdonalds-task-scheduler
```

2. **Install Dependencies**
```bash
npm install
```

3. **Development Server**
```bash
npm run dev
```

4. **Production Build**
```bash
npm run build
npm start
```

## 📖 Usage Guide

### Getting Started

1. **Initial Setup**
   - Launch the application at `http://localhost:3000`
   - Import your employee shift data to begin scheduling

2. **Import Your Data**
   - Click "Upload" button in the header
   - Select your CSV or XLSX file with employee shifts
   - Verify data import in the Employee Pool

### Daily Workflow

1. **Download Template (First Time)**
   - Click "Template" button to download CSV template
   - Fill in employee data with proper format:
     ```csv
     Minor,Employee Name,Shift Start Time,Shift End Time,Task
     No,John Doe,6:00,15:00,
     Yes,Jane Smith,7:00,16:00,
     ```

2. **Import Employee Data**
   - Click "Upload" button
   - Select your completed CSV file
   - Minor employees are highlighted in yellow

3. **Select Day Part**
   - Choose between "Breakfast", "Day Part 1", or "Day Part 2"
   - Note different layouts for different shifts

4. **Assign Employees**
   - Drag employees from the "Available Staff" pool to specific task columns
   - Minor employees are visually distinguished with yellow highlighting
   - Employees can be assigned to multiple roles if needed

5. **Review Assignments**
   - Check the assignment summary for coverage
   - Ensure critical positions are filled
   - Make adjustments as needed

6. **Export Schedule**
   - Set the correct date using the date picker
   - Use "Print PDF" for printing and posting
   - Use "Export CSV" for data analysis and record keeping

## 📊 Data Structure

### Employee Object
```typescript
{
  minor: boolean,           // true if under 18
  name: string,            // Primary identifier
  shiftStart: string,      // Shift start time (e.g., "6:00")
  shiftEnd: string,        // Shift end time (e.g., "15:00")
  task?: string            // Optional pre-assigned task
}
```

### CSV File Format
Required columns:
- **Minor** (Yes/No or True/False)
- **Employee Name** (Primary identifier)
- **Shift Start Time** (Time format: HH:MM or H:MM)
- **Shift End Time** (Time format: HH:MM or H:MM)  
- **Task** (Optional - can be blank)

## 🎯 Key Components

### EmployeePool
- Displays available and assigned staff
- Shows shift times and minor status
- Provides drag source for assignments
- Real-time statistics

### AssignmentGrid
- Dynamic table layout based on day part
- Drop zones for each task/role combination
- Visual feedback during drag operations
- Assignment summary

### Header
- File upload functionality
- Export options (CSV/PDF)
- Date selection
- Application branding

### DayPartTabs
- Navigation between different shifts
- Context-specific information
- Layout switching

## 🔧 Layout Configuration

The application supports different layouts for different day parts:

**Breakfast Layout:**
- Handheld, Window 1 & 2, Order Assembly
- Kitchen Leader/Hand Wash, Line 1
- Batch (Muffins, Sausage, Eggs), Oven
- Hash browns, DIVE (09:00, 11:00)
- DFS Discards and Calibrations

**Day Part Layout:**
- Handheld, Windows, Order Assembly
- Kitchen Leader/Hand Wash (Initiator/Assembler/Finisher)
- Line 1 & 2 (Initiator/Assembler/Finisher)
- Batch Grill, Batch Chicken, Fries
- DIVE (11:00, 15:00, 19:00, CLOSE), Delivery

## 📤 Export Options

### CSV Export
- Comprehensive data export including all assignments
- Compatible with Excel and Google Sheets
- Suitable for reporting and analysis

### PDF Export
- Print-ready schedule format
- Visual layout matching original paper forms
- Professional formatting for in-store posting
- Automatic print dialog

## 🎨 Design Features

- **McDonald's Brand Colors**: Red (#DA291C) and Yellow (#FFC72C)
- **Responsive Design**: Works on tablets and desktop computers
- **Accessibility**: Clear visual indicators and intuitive interactions
- **Print Optimization**: Clean layouts for posting schedules

## 🐛 Troubleshooting

### Common Issues

1. **File Upload Not Working**
   - Ensure file is in CSV or XLSX format
   - Check that required columns are present
   - Verify data format matches template

2. **Drag and Drop Not Working**
   - Ensure using a modern browser
   - Check that JavaScript is enabled
   - Try refreshing the page

3. **PDF Export Issues**
   - Allow pop-ups in browser settings
   - Ensure sufficient data is present
   - Try using a different browser

## 🔐 Best Practices

- **Consistent Naming**: Use standardized employee names across all shifts
- **Regular Exports**: Save both PDF (for posting) and CSV (for records) versions
- **Minor Compliance**: Pay attention to yellow-highlighted minor employees
- **Date Management**: Always set the correct date before exporting
- **Backup Planning**: Keep CSV exports as backup records

## 🚀 Development

### Project Structure
```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── TaskScheduler.tsx   # Main application component
│   └── globals.css         # Global styles
├── components/
│   ├── AssignmentGrid.tsx  # Assignment table grid
│   ├── DayPartTabs.tsx     # Day part navigation
│   ├── DropZone.tsx        # Drag-and-drop target
│   ├── EmployeeCard.tsx    # Employee display card
│   ├── EmployeePool.tsx    # Available staff sidebar
│   └── Header.tsx          # Application header
├── data/
│   └── layouts.ts          # Layout configurations
├── types/
│   └── index.ts            # TypeScript definitions
└── utils/
    ├── fileUtils.ts        # File processing utilities
    └── pdfUtils.ts         # PDF generation utilities
```

### Adding New Features

1. **New Layout**: Modify `src/data/layouts.ts`
2. **New Day Part**: Update `DayPart` type and add logic
3. **New Export Format**: Add utility function in `src/utils/`
4. **UI Changes**: Update corresponding component files

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the documentation
3. Create an issue in the repository

---

**McDonald's Task Scheduler - Burgernomics**  
*Streamlining restaurant operations with intelligent task assignment*
