'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { parseEmployeeFile } from '@/utils/fileUtils';
import { Employee } from '@/types';

const emptyEmployees: Employee[] = [];
const emptyAssignments = {} as any;
const emptyLayouts = { breakfast: {}, dayPart: {} };

export default function Landing() {
	const today = new Date();
	const router = useRouter();
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
	const [existingSchedule, setExistingSchedule] = useState<{
		employees: any[];
		uploadedAt: string;
		fileName: string;
	} | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date>(today);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
	const [pendingFile, setPendingFile] = useState<File | null>(null);

	// Check for existing schedule when date changes
	useEffect(() => {
		const dateKey = selectedDate.toISOString().split('T')[0];
		try {
			const existingData = localStorage.getItem(`schedule_${dateKey}`);
			if (existingData) {
				const scheduleData = JSON.parse(existingData);
				setExistingSchedule(scheduleData);
			} else {
				setExistingSchedule(null);
			}
		} catch (err) {
			console.warn('Failed to load existing schedule', err);
			setExistingSchedule(null);
		}
	}, [selectedDate]);

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Check if there are existing assignments for this date
		const dateKey = selectedDate.toISOString().split('T')[0];
		const assignmentKey = `assignments_${dateKey}`;
		const existingAssignments = localStorage.getItem(assignmentKey);

		if (existingAssignments) {
			try {
				const parsedAssignments = JSON.parse(existingAssignments);
				// Check if there are any actual assignments (not just empty structures)
				const hasAssignments = Object.values(parsedAssignments.assignments || {}).some((dayPartAssignments: any) =>
					Object.values(dayPartAssignments).some((tableAssignments: any) =>
						Object.values(tableAssignments).some((columnAssignments: any) =>
							Array.isArray(columnAssignments) && columnAssignments.length > 0
						)
					)
				);

				if (hasAssignments) {
					setPendingFile(file);
					setShowReplaceConfirm(true);
					return;
				}
			} catch (error) {
				console.warn('Error checking existing assignments:', error);
			}
		}

		// No existing assignments, proceed with upload
		processFileUpload(file);
	};

	const processFileUpload = async (file: File) => {
		const result = await parseEmployeeFile(file);
		if (result.success && result.employees) {
			// Create a key for the selected date
			const dateKey = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format

			// Store employees with date key in localStorage
			try {
				const scheduleData = {
					employees: result.employees,
					uploadedAt: new Date().toISOString(),
					fileName: file.name
				};
				localStorage.setItem(`schedule_${dateKey}`, JSON.stringify(scheduleData));

				// Also store in sessionStorage for immediate navigation
				sessionStorage.setItem('uploadedEmployees', JSON.stringify(result.employees));
				sessionStorage.setItem('selectedDate', selectedDate.toISOString());
				sessionStorage.setItem('replaceAllAssignments', 'true'); // Flag to indicate replace all assignments

				console.log('Employees stored for date:', dateKey, result.employees.length);
				setUploadSuccess(`Successfully imported ${result.employees.length} employees for ${selectedDate.toLocaleDateString()}!`);
				setUploadError(null);
			} catch (err) {
				console.warn('Failed to store schedule data', err);
				setUploadError('Failed to store employee data. Please try again.');
				setUploadSuccess(null);
			}

			// Always redirect to assignments after successful file parsing
			router.push('/assignments');
		} else {
			setUploadError(result.error || 'Failed to parse file.');
			setUploadSuccess(null);
		}
	};

	const processFileUploadPoolOnly = async (file: File) => {
		const result = await parseEmployeeFile(file);
		if (result.success && result.employees) {
			// Create a key for the selected date
			const dateKey = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format

			// Store employees with date key in localStorage (pool update only)
			try {
				const scheduleData = {
					employees: result.employees,
					uploadedAt: new Date().toISOString(),
					fileName: file.name
				};
				localStorage.setItem(`schedule_${dateKey}`, JSON.stringify(scheduleData));

				// Also store in sessionStorage for immediate navigation
				sessionStorage.setItem('uploadedEmployees', JSON.stringify(result.employees));
				sessionStorage.setItem('selectedDate', selectedDate.toISOString());
				sessionStorage.setItem('poolUpdateOnly', 'true'); // Flag to indicate pool-only update

				console.log('Employee pool updated for date:', dateKey, result.employees.length);
				setUploadSuccess(`Successfully updated employee pool for ${selectedDate.toLocaleDateString()}! Existing assignments preserved.`);
				setUploadError(null);
			} catch (err) {
				console.warn('Failed to store schedule data', err);
				setUploadError('Failed to update employee pool. Please try again.');
				setUploadSuccess(null);
			}

			// Always redirect to assignments after successful file parsing
			router.push('/assignments');
		} else {
			setUploadError(result.error || 'Failed to parse file.');
			setUploadSuccess(null);
		}
	};

	const confirmReplaceAssignments = () => {
		if (pendingFile) {
			processFileUpload(pendingFile);
		}
		setShowReplaceConfirm(false);
		setPendingFile(null);
	};

	const confirmUpdatePoolOnly = () => {
		if (pendingFile) {
			processFileUploadPoolOnly(pendingFile);
		}
		setShowReplaceConfirm(false);
		setPendingFile(null);
	};

	const cancelReplaceAssignments = () => {
		setShowReplaceConfirm(false);
		setPendingFile(null);
		// Clear the file input
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const date = new Date(e.target.value);
		setSelectedDate(date);
	};

	const triggerUpload = () => {
		setUploadError(null);
		setUploadSuccess(null);
		fileInputRef.current?.click();
	};

	const navigateToScheduler = () => {
		// Store selected date in sessionStorage
		sessionStorage.setItem('selectedDate', selectedDate.toISOString());

		// If there's existing schedule data, load it into sessionStorage
		if (existingSchedule) {
			sessionStorage.setItem('uploadedEmployees', JSON.stringify(existingSchedule.employees));
		}

		router.push('/assignments');
	};

	return (
		<div style={{
			minHeight: '100vh',
			background: '#f8fafc',
			display: 'flex',
			flexDirection: 'column'
		}}>
			{/* Tablet App Header */}
			<header style={{
				background: '#ffffff',
				borderBottom: '1px solid #e2e8f0',
				padding: '1rem 2rem',
				boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
				position: 'sticky',
				top: 0,
				zIndex: 10
			}}>
				<div style={{
					maxWidth: '1200px',
					margin: '0 auto',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between'
				}}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
						<div style={{
							width: '40px',
							height: '40px',
							background: 'linear-gradient(135deg, #dc2626 0%, #f59e0b 100%)',
							borderRadius: '8px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: '1.25rem',
							fontWeight: 'bold',
							color: 'white'
						}}>
							M
						</div>
						<div>
							<h1 style={{
								margin: 0,
								fontSize: '1.25rem',
								fontWeight: '600',
								color: '#1e293b'
							}}>
								McDonald&apos;s Scheduler
							</h1>
							<p style={{
								margin: 0,
								fontSize: '0.875rem',
								color: '#64748b'
							}}>
								Task Assignment System
							</p>
						</div>
					</div>

					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<div style={{
							width: '8px',
							height: '8px',
							background: '#10b981',
							borderRadius: '50%'
						}}></div>
						<span style={{
							fontSize: '0.875rem',
							color: '#64748b',
							fontWeight: '500'
						}}>
							Online
						</span>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main style={{
				flex: 1,
				padding: '2rem',
				maxWidth: '1200px',
				margin: '0 auto',
				width: '100%'
			}}>
				{/* Welcome Card */}
				<div style={{
					background: '#ffffff',
					borderRadius: '16px',
					padding: '2.5rem',
					marginBottom: '2rem',
					boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
					border: '1px solid #e2e8f0'
				}}>
					<div style={{ textAlign: 'center', marginBottom: '2rem' }}>
						<h2 style={{
							fontSize: '2rem',
							fontWeight: '700',
							color: '#1e293b',
							marginBottom: '0.5rem'
						}}>
							Welcome to Task Scheduler
						</h2>
						<p style={{
							fontSize: '1.125rem',
							color: '#64748b',
							margin: 0
						}}>
							Professional station assignment for McDonald&apos;s restaurants
						</p>
					</div>

					{/* Date Selection */}
					<div style={{
						background: '#f8fafc',
						borderRadius: '12px',
						padding: '1.5rem',
						marginBottom: '2rem',
						border: '1px solid #e2e8f0'
					}}>
						<div style={{ textAlign: 'center', marginBottom: '1rem' }}>
							<h3 style={{
								fontSize: '1.25rem',
								fontWeight: '600',
								color: '#1e293b',
								marginBottom: '0.5rem'
							}}>
								📅 Select Shift Date
							</h3>
							<p style={{
								color: '#64748b',
								margin: 0,
								fontSize: '0.9rem'
							}}>
								Choose the date for your shift schedule
							</p>
						</div>
						<div style={{ display: 'flex', justifyContent: 'center' }}>
							<div style={{
								display: 'flex',
								alignItems: 'center',
								gap: '1rem',
								background: '#ffffff',
								borderRadius: '8px',
								padding: '0.75rem 1rem',
								border: '1px solid #d1d5db',
								boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
							}}>
								<label htmlFor="datePicker" style={{
									fontSize: '0.9rem',
									fontWeight: '500',
									color: '#374151'
								}}>
									Date:
								</label>
								<input
									id="datePicker"
									type="date"
									value={selectedDate.toISOString().split('T')[0]}
									onChange={handleDateChange}
									style={{
										border: 'none',
										outline: 'none',
										fontSize: '0.9rem',
										color: '#1e293b',
										fontWeight: '500',
										background: 'transparent',
										minWidth: '140px'
									}}
								/>
							</div>
						</div>
						<div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
							<span style={{
								fontSize: '0.875rem',
								color: '#64748b',
								fontWeight: '500'
							}}>
								Selected: {selectedDate.toLocaleDateString('en-US', {
									weekday: 'long',
									year: 'numeric',
									month: 'long',
									day: 'numeric'
								})}
							</span>
							{existingSchedule && (
								<div style={{
									marginTop: '0.5rem',
									padding: '0.5rem 0.75rem',
									background: '#f0fdf4',
									borderRadius: '6px',
									border: '1px solid #bbf7d0',
									display: 'inline-block'
								}}>
									<span style={{
										fontSize: '0.8rem',
										color: '#059669',
										fontWeight: '600'
									}}>
										📋 {existingSchedule.employees.length} employees loaded
									</span>
									<div style={{
										fontSize: '0.75rem',
										color: '#047857',
										marginTop: '0.25rem'
									}}>
										File: {existingSchedule.fileName}
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Action Cards */}
					<div style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
						gap: '1.5rem',
						marginBottom: '2rem'
					}}>
						{/* Import Card */}
						<div style={{
							background: '#f8fafc',
							borderRadius: '12px',
							padding: '2rem',
							border: '2px dashed #cbd5e1',
							textAlign: 'center',
							cursor: 'pointer',
							transition: 'all 0.2s ease',
							position: 'relative'
						}}
						onClick={triggerUpload}
						onMouseEnter={(e) => {
							e.currentTarget.style.borderColor = '#10b981';
							e.currentTarget.style.background = '#f0fdf4';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.borderColor = '#cbd5e1';
							e.currentTarget.style.background = '#f8fafc';
						}}
						>
							<input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} style={{display:'none'}} />
							<div style={{
								width: '64px',
								height: '64px',
								background: '#10b981',
								borderRadius: '12px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								margin: '0 auto 1rem',
								fontSize: '2rem'
							}}>
								📁
							</div>
							<h3 style={{
								fontSize: '1.25rem',
								fontWeight: '600',
								color: '#1e293b',
								marginBottom: '0.5rem'
							}}>
								Import Schedule
							</h3>
							<p style={{
								color: '#64748b',
								margin: 0,
								fontSize: '0.9rem'
							}}>
								Upload CSV or Excel files to import employee schedules
							</p>
						</div>

						{/* Open Scheduler Card */}
						<div style={{ textDecoration: 'none' }}>
							<div style={{
								background: '#f8fafc',
								borderRadius: '12px',
								padding: '2rem',
								border: '1px solid #e2e8f0',
								textAlign: 'center',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
								height: '100%'
							}}
							onClick={navigateToScheduler}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = '#fef3c7';
								e.currentTarget.style.borderColor = '#f59e0b';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = '#f8fafc';
								e.currentTarget.style.borderColor = '#e2e8f0';
							}}
							>
								<div style={{
									width: '64px',
									height: '64px',
									background: '#f59e0b',
									borderRadius: '12px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									margin: '0 auto 1rem',
									fontSize: '2rem'
								}}>
									📋
								</div>
								<h3 style={{
									fontSize: '1.25rem',
									fontWeight: '600',
									color: '#1e293b',
									marginBottom: '0.5rem'
								}}>
									Open Scheduler
								</h3>
								<p style={{
									color: '#64748b',
									margin: 0,
									fontSize: '0.9rem'
								}}>
									Access the task assignment interface
								</p>
							</div>
						</div>
					</div>

					{/* Status Messages */}
					{uploadError && (
						<div style={{
							background: '#fef2f2',
							border: '1px solid #fecaca',
							borderRadius: '8px',
							padding: '1rem',
							marginBottom: '1rem',
							display: 'flex',
							alignItems: 'center',
							gap: '0.75rem'
						}}>
							<div style={{
								width: '20px',
								height: '20px',
								background: '#dc2626',
								borderRadius: '50%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '0.75rem',
								color: 'white',
								fontWeight: 'bold'
							}}>
								!
							</div>
							<div>
								<p style={{
									margin: 0,
									color: '#dc2626',
									fontWeight: '500',
									fontSize: '0.9rem'
								}}>
									{uploadError}
								</p>
							</div>
						</div>
					)}

					{uploadSuccess && (
						<div style={{
							background: '#f0fdf4',
							border: '1px solid #bbf7d0',
							borderRadius: '8px',
							padding: '1rem',
							marginBottom: '1rem',
							display: 'flex',
							alignItems: 'center',
							gap: '0.75rem'
						}}>
							<div style={{
								width: '20px',
								height: '20px',
								background: '#10b981',
								borderRadius: '50%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '0.75rem',
								color: 'white',
								fontWeight: 'bold'
							}}>
								✓
							</div>
							<div>
								<p style={{
									margin: 0,
									color: '#059669',
									fontWeight: '500',
									fontSize: '0.9rem'
								}}>
									{uploadSuccess}
								</p>
							</div>
						</div>
					)}

				</div>

				{/* Replace Assignments Confirmation Dialog */}
				{showReplaceConfirm && (
					<div style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'rgba(0, 0, 0, 0.5)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 1000
					}}>
						<div style={{
							background: '#ffffff',
							borderRadius: '12px',
							padding: '2rem',
							maxWidth: '400px',
							width: '90%',
							boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
						}}>
							<div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
								<div style={{
									width: '48px',
									height: '48px',
									background: '#fef3c7',
									borderRadius: '50%',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									margin: '0 auto 1rem',
									fontSize: '1.5rem'
								}}>
									⚠️
								</div>
								<h3 style={{
									fontSize: '1.25rem',
									fontWeight: '600',
									color: '#1e293b',
									marginBottom: '0.5rem'
								}}>
									Existing Assignments Found
								</h3>
								<p style={{
									color: '#64748b',
									margin: 0,
									fontSize: '0.9rem',
									lineHeight: '1.5'
								}}>
									There are existing employee assignments for {selectedDate.toLocaleDateString()}.
									Choose how you want to handle the new schedule:
								</p>
							</div>

							<div style={{
								display: 'flex',
								flexDirection: 'column',
								gap: '0.75rem',
								justifyContent: 'center'
							}}>
								<button
									onClick={confirmReplaceAssignments}
									style={{
										padding: '0.75rem 1.5rem',
										border: 'none',
										borderRadius: '6px',
										background: '#dc2626',
										color: '#ffffff',
										fontSize: '0.9rem',
										fontWeight: '500',
										cursor: 'pointer',
										transition: 'all 0.2s'
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.background = '#b91c1c';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.background = '#dc2626';
									}}
								>
									🔄 Replace All Assignments
								</button>
								<button
									onClick={confirmUpdatePoolOnly}
									style={{
										padding: '0.75rem 1.5rem',
										border: '1px solid #10b981',
										borderRadius: '6px',
										background: '#ffffff',
										color: '#10b981',
										fontSize: '0.9rem',
										fontWeight: '500',
										cursor: 'pointer',
										transition: 'all 0.2s'
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.background = '#f0fdf4';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.background = '#ffffff';
									}}
								>
									👥 Update Employee Pool Only
								</button>
								<button
									onClick={cancelReplaceAssignments}
									style={{
										padding: '0.75rem 1.5rem',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
										background: '#ffffff',
										color: '#374151',
										fontSize: '0.9rem',
										fontWeight: '500',
										cursor: 'pointer',
										transition: 'all 0.2s'
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.background = '#f9fafb';
										e.currentTarget.style.borderColor = '#9ca3af';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.background = '#ffffff';
										e.currentTarget.style.borderColor = '#d1d5db';
									}}
								>
									Cancel Upload
								</button>
							</div>
						</div>
					</div>
				)}

			</main>
		</div>
	);
}
