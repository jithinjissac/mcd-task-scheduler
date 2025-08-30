'use client';

import React, { useRef } from 'react';
import { 
  Upload, 
  Download, 
  FileText, 
  Calendar,
  Printer
} from 'lucide-react';
import { Employee, Assignment } from '@/types';
import { parseEmployeeFile, downloadTemplate, exportToCSV, convertAssignmentsToExportData } from '@/utils/fileUtils';
import { generatePDF, printSchedule } from '@/utils/pdfUtils';

interface HeaderProps {
  employees: Employee[];
  assignments: Assignment;
  layouts: { breakfast: any; dayPart: any };
  selectedDate: Date;
  onEmployeesUploaded: (employees: Employee[]) => void;
  onDateChange: (date: Date) => void;
}

const Header: React.FC<HeaderProps> = ({
  employees,
  assignments,
  layouts,
  selectedDate,
  onEmployeesUploaded,
  onDateChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseEmployeeFile(file);
      
      if (result.success && result.employees) {
        onEmployeesUploaded(result.employees);
        alert(`Successfully imported schedule with ${result.employees.length} employees!`);
      } else {
        alert(`Error importing file: ${result.error}`);
      }
    } catch (error) {
      alert('Error reading file. Please ensure it is a valid CSV or Excel file.');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportCSV = () => {
    try {
      const exportData = convertAssignmentsToExportData(assignments, employees);
      const filename = `mcdonalds-schedule-${selectedDate.toISOString().split('T')[0]}.csv`;
      exportToCSV(exportData, filename);
    } catch (error) {
      alert('Error exporting CSV. Please try again.');
    }
  };

  const handleExportPDF = () => {
    try {
      generatePDF(assignments, employees, layouts, selectedDate);
    } catch (error) {
      alert('Error generating PDF. Please try again.');
    }
  };

  const handlePrint = () => {
    try {
      printSchedule(assignments, employees, layouts, selectedDate);
    } catch (error) {
      alert('Error opening print dialog. Please try again.');
    }
  };

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const handleDateInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value);
    onDateChange(newDate);
  };

  return (
    <header className="header">
      <div className="header-content">
        {/* Modern Header with Typography */}
        <div className="text-center mb-8">
          {/* Store name with modern styling */}
          <div className="mb-6">
            <h1 className="text-5xl font-black leading-tight text-mcdonalds-yellow drop-shadow-lg tracking-tight">
              McDonald&apos;s Hitchin
            </h1>
            <p className="text-xl font-medium text-white/90 mt-1 tracking-widest uppercase">
              A505 Nightingale Road
            </p>
          </div>
          
          {/* App branding with modern effects */}
          <div className="relative">
            <h2 className="text-3xl font-bold leading-tight text-white drop-shadow-md mb-2">
              Burgernomics
            </h2>
            <p className="header-subtitle text-xl font-semibold text-white/90 tracking-wide">
              Station/Task Assigner
            </p>
            
            {/* Decorative line */}
            <div className="mx-auto mt-4 w-24 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"></div>
          </div>
        </div>

        {/* Modern Date Picker - Glassmorphism */}
        <div className="flex justify-center mb-12 mx-8">
          <div className="group relative">
            {/* Main container with modern glass effect - no borders */}
            <div className="flex items-center gap-6 bg-white/8 backdrop-blur-xl rounded-2xl px-10 py-6 shadow-2xl transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:scale-105">
              {/* Calendar icon with modern styling */}
              <div className="p-3 bg-white/10 rounded-xl">
                <Calendar className="w-7 h-7 text-mcdonalds-yellow drop-shadow-sm" />
              </div>
              
              {/* Label with modern typography */}
              <span className="text-white font-semibold text-xl tracking-wide">
                Schedule Date
              </span>
              
              {/* Modern date input with more spacing */}
              <div className="relative ml-4">
                <input
                  type="date"
                  value={formatDateForInput(selectedDate)}
                  onChange={handleDateInputChange}
                  className="modern-date-input bg-white/95 backdrop-blur-sm text-mcdonalds-dark rounded-xl px-8 py-4 font-semibold text-lg shadow-lg focus:shadow-xl focus:outline-none focus:ring-4 focus:ring-mcdonalds-yellow/30 focus:bg-white transition-all duration-300 hover:bg-white hover:shadow-lg cursor-pointer min-w-[200px]"
                />
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-xl pointer-events-none"></div>
              </div>
            </div>
            
            {/* Ambient glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-mcdonalds-yellow/20 via-transparent to-mcdonalds-red/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 -z-10"></div>
          </div>
        </div>

        {/* Modern Action Buttons */}
        <div className="flex justify-center mb-8 px-4">
          <div className="modern-action-buttons w-full max-w-4xl flex justify-between items-center p-8 bg-white/5 backdrop-blur-lg rounded-2xl" style={{gap: '10px'}}>
          {/* File Upload */}
          <div className="file-input-wrapper flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="file-input"
              id="schedule-upload"
            />
            <label htmlFor="schedule-upload" className="file-input-label w-full justify-center">
              <Upload className="w-5 h-5" />
              <span>Import Schedule</span>
            </label>
          </div>

          {/* Template Download */}
          <button
            onClick={downloadTemplate}
            className="btn btn-outline flex-1"
            title="Download CSV template"
          >
            <FileText className="w-5 h-5" />
            <span>Template</span>
          </button>

          {/* Print PDF */}
          <button
            onClick={handlePrint}
            className="btn btn-primary flex-1"
            title="Print schedule"
          >
            <Printer className="w-5 h-5" />
            <span>Print PDF</span>
          </button>
          </div>
        </div>

        {/* Modern Status Display */}
        <div className="text-center mt-4">
          <div className="inline-flex items-center gap-3 px-8 py-4 bg-white/8 backdrop-blur-sm rounded-full">
            <div className="w-3 h-3 bg-mcdonalds-yellow rounded-full animate-pulse"></div>
            <span className="text-white font-medium tracking-wide text-lg">
              Schedule for {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
