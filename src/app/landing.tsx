'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { parseEmployeeFile } from '@/utils/fileUtils';
import { Employee } from '@/types';
import storageService from '@/services/storageService_simple';

const emptyEmployees: Employee[] = [];
const emptyAssignments = {} as any;
const emptyLayouts = { breakfast: {}, dayPart: {} };

export default function Landing() {
	const today = new Date();
	const todayKey = today.toISOString().split('T')[0];
	const router = useRouter();
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
	const [existingSchedule, setExistingSchedule] = useState<{
		employees: any[];
		uploadedAt: string;
		fileName: string;
		scheduleDate: string;
	} | null>(null);
	const [previousSchedule, setPreviousSchedule] = useState<{
		employees: any[];
		uploadedAt: string;
		fileName: string;
		scheduleDate: string;
	} | null>(null);
	const [showPreviousScheduleOption, setShowPreviousScheduleOption] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
	const [pendingFile, setPendingFile] = useState<File | null>(null);

	// Check for today's schedule and previous schedule options
	useEffect(() => {
		const checkSchedules = async () => {
			try {
				// Check for today's schedule first
				const todaySchedule = await storageService.getSchedule(todayKey);
				if (todaySchedule && todaySchedule.employees?.length > 0) {
					setExistingSchedule({
						employees: todaySchedule.employees,
						uploadedAt: todaySchedule.uploadedAt || new Date().toISOString(),
						fileName: todaySchedule.fileName || 'Unknown File',
						scheduleDate: todayKey
					});
					setShowPreviousScheduleOption(false);
				} else {
					setExistingSchedule(null);
					
					// No schedule for today, check for the most recent previous schedule
					const latestSchedule = await storageService.getLatestSchedule();
					if (latestSchedule && latestSchedule.employees?.length > 0) {
						const scheduleDate = latestSchedule.date || 'Unknown Date';
						const scheduleDateTime = new Date(scheduleDate);
						const todayTime = new Date(todayKey);
						
						// Only show previous schedule option if it's from a different (earlier) date
						if (scheduleDateTime < todayTime) {
							setPreviousSchedule({
								employees: latestSchedule.employees,
								uploadedAt: latestSchedule.uploadedAt || new Date().toISOString(),
								fileName: latestSchedule.fileName || 'Unknown File',
								scheduleDate: scheduleDate
							});
							setShowPreviousScheduleOption(true);
						} else {
							setPreviousSchedule(null);
							setShowPreviousScheduleOption(false);
						}
					} else {
						setPreviousSchedule(null);
						setShowPreviousScheduleOption(false);
					}
				}
			} catch (err) {
				console.warn('Failed to load schedules', err);
				setExistingSchedule(null);
				setPreviousSchedule(null);
				setShowPreviousScheduleOption(false);
			}
		};
		
		checkSchedules();
	}, [todayKey]); // Run when todayKey changes

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		console.log('🎯 handleFileSelect triggered');
		const file = e.target.files?.[0];
		if (!file) {
			console.log('❌ No file selected');
			return;
		}
		
		console.log('📁 File selected:', file.name, 'Size:', file.size, 'Type:', file.type);

		// Temporarily skip assignment check to isolate the issue
		console.log('⚠️ SKIPPING assignment check for debugging - going directly to upload');
		
		try {
			await processFileUpload(file);
		} catch (error) {
			console.error('💥 Error in processFileUpload:', error);
			setUploadError(`Error: ${error}`);
		}
	};

	const processFileUpload = async (file: File) => {
		console.log('🔄 Processing file upload:', file.name, 'Size:', file.size);
		setUploadError(null);
		setUploadSuccess(null);
		
		try {
			console.log('📊 Starting CSV parsing...');
			const result = await parseEmployeeFile(file);
			console.log('📊 Parse result:', result);
			
			if (result.success && result.employees) {
				console.log('✅ Successfully parsed', result.employees.length, 'employees');
				// Use today's date key
				const dateKey = todayKey;

				// Store employees with server storage
				try {
					console.log('💾 Saving to server storage for date:', dateKey);
					console.log('👥 Employees to save:', result.employees);
					await storageService.saveSchedule(dateKey, result.employees, file.name, true);
					console.log('✅ Successfully saved to server');

					// Also store in sessionStorage for immediate navigation
					sessionStorage.setItem('uploadedEmployees', JSON.stringify(result.employees));
					sessionStorage.setItem('selectedDate', new Date(todayKey).toISOString());
					sessionStorage.setItem('replaceAllAssignments', 'true'); // Flag to indicate replace all assignments

					// Update the state to reflect the new schedule
					setExistingSchedule({
						employees: result.employees,
						uploadedAt: new Date().toISOString(),
						fileName: file.name,
						scheduleDate: todayKey
					});
					
					// Hide previous schedule options since we now have today's schedule
					setShowPreviousScheduleOption(false);
					setPreviousSchedule(null);

					console.log('Employees stored for date:', dateKey, result.employees.length);
					setUploadSuccess(`Successfully imported ${result.employees.length} employees for today!`);
					setUploadError(null);
				} catch (err) {
					console.error('❌ Failed to store schedule data:', err);
					console.error('❌ Error type:', typeof err);
					console.error('❌ Error stack:', err instanceof Error ? err.stack : 'No stack trace');
					setUploadError('Failed to store employee data. Please try again.');
					setUploadSuccess(null);
					return; // Don't redirect on error
				}

				// Always redirect to assignments after successful file parsing
				console.log('🚀 Redirecting to assignments page...');
				router.push('/assignments');
			} else {
				console.error('❌ File parsing failed:', result.error);
				setUploadError(result.error || 'Failed to parse file.');
				setUploadSuccess(null);
			}
		} catch (error) {
			console.error('💥 Unexpected error in processFileUpload:', error);
			setUploadError('Unexpected error occurred during file processing.');
			setUploadSuccess(null);
		}
	};

	const processFileUploadPoolOnly = async (file: File) => {
		const result = await parseEmployeeFile(file);
		if (result.success && result.employees) {
			// Use today's date key
			const dateKey = todayKey;

			// Store employees with server storage (pool update only)
			try {
				await storageService.saveSchedule(dateKey, result.employees, file.name, false);

				// Also store in sessionStorage for immediate navigation
				sessionStorage.setItem('uploadedEmployees', JSON.stringify(result.employees));
				sessionStorage.setItem('selectedDate', new Date(todayKey).toISOString());
				sessionStorage.setItem('poolUpdateOnly', 'true'); // Flag to indicate pool-only update

				console.log('Employee pool updated for date:', dateKey, result.employees.length);
				setUploadSuccess(`Successfully updated employee pool for today! Existing assignments preserved.`);
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

	const confirmReplaceAssignments = async () => {
		if (pendingFile) {
			await processFileUpload(pendingFile);
		}
		setShowReplaceConfirm(false);
		setPendingFile(null);
	};

	const confirmUpdatePoolOnly = async () => {
		if (pendingFile) {
			await processFileUploadPoolOnly(pendingFile);
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

	const handleUsePreviousSchedule = async () => {
		if (!previousSchedule) return;
		
		try {
			// Copy the previous schedule to today's date
			await storageService.saveSchedule(
				todayKey, 
				previousSchedule.employees, 
				`Copied from ${previousSchedule.scheduleDate} - ${previousSchedule.fileName}`,
				true
			);
			
			// Update the current schedule state
			setExistingSchedule({
				employees: previousSchedule.employees,
				uploadedAt: new Date().toISOString(),
				fileName: `Copied from ${previousSchedule.scheduleDate} - ${previousSchedule.fileName}`,
				scheduleDate: todayKey
			});
			
			// Hide the previous schedule option
			setShowPreviousScheduleOption(false);
			setPreviousSchedule(null);
			
			// Store in sessionStorage for scheduler navigation
			sessionStorage.setItem('uploadedEmployees', JSON.stringify(previousSchedule.employees));
			sessionStorage.setItem('selectedDate', new Date(todayKey).toISOString());
			sessionStorage.setItem('replaceAllAssignments', 'true');
			
			// Navigate to scheduler
			router.push('/assignments');
		} catch (error) {
			console.error('Failed to copy previous schedule:', error);
			setUploadError('Failed to copy previous schedule. Please try again.');
		}
	};

	const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		// This function is no longer needed in today-focused mode
		// but keeping for compatibility if referenced elsewhere
		console.log('Date change attempted but ignored in today-focused mode');
	};

	const triggerUpload = () => {
		console.log('🚀 triggerUpload called');
		setUploadError(null);
		setUploadSuccess(null);
		fileInputRef.current?.click();
		console.log('📂 File input click triggered');
	};

	const navigateToScheduler = () => {
		// Store today's date in sessionStorage
		sessionStorage.setItem('selectedDate', new Date(todayKey).toISOString());

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
			flexDirection: 'column',
			width: '100vw',
			maxWidth: '100vw',
			overflowX: 'hidden'
		}}>
			{/* Responsive Header */}
			<header style={{
				background: '#ffffff',
				borderBottom: '1px solid #e2e8f0',
				padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 4vw, 2rem)',
				boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
				position: 'sticky',
				top: 0,
				zIndex: 10,
				width: '100%'
			}}>
				<div style={{
					maxWidth: '1200px',
					margin: '0 auto',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					flexWrap: 'wrap',
					gap: '1rem'
				}}>
					<div style={{
						display: 'flex',
						alignItems: 'center',
						gap: 'clamp(0.75rem, 2vw, 1rem)',
						flex: '1',
						minWidth: '200px'
					}}>
						<div style={{
							width: 'clamp(32px, 8vw, 40px)',
							height: 'clamp(32px, 8vw, 40px)',
							background: 'linear-gradient(135deg, #dc2626 0%, #f59e0b 100%)',
							borderRadius: '8px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: 'clamp(1rem, 3vw, 1.25rem)',
							fontWeight: 'bold',
							color: 'white'
						}}>
							M
						</div>
						<div>
							<h1 style={{
								margin: 0,
								fontSize: 'clamp(1.1rem, 3vw, 1.25rem)',
								fontWeight: '600',
								color: '#1e293b'
							}}>
								McDonald&apos;s Scheduler
							</h1>
							<p style={{
								margin: 0,
								fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
								color: '#64748b'
							}}>
								Task Assignment System
							</p>
						</div>
					</div>

					<div style={{
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
						flexShrink: 0
					}}>
						<div style={{
							width: '8px',
							height: '8px',
							background: '#10b981',
							borderRadius: '50%'
						}}></div>
						<span style={{
							fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
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
				padding: 'clamp(1rem, 4vw, 2rem)',
				maxWidth: '1200px',
				margin: '0 auto',
				width: '100%',
				boxSizing: 'border-box'
			}}>
				{/* Welcome Card */}
				<div style={{
					background: '#ffffff',
					borderRadius: 'clamp(12px, 3vw, 16px)',
					padding: 'clamp(1.5rem, 5vw, 2.5rem)',
					marginBottom: 'clamp(1rem, 3vw, 2rem)',
					boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
					border: '1px solid #e2e8f0',
					width: '100%',
					boxSizing: 'border-box'
				}}>
					<div style={{
						textAlign: 'center',
						marginBottom: 'clamp(1rem, 3vw, 2rem)'
					}}>
						<h2 style={{
							fontSize: 'clamp(1.5rem, 5vw, 2rem)',
							fontWeight: '700',
							color: '#1e293b',
							marginBottom: '0.5rem'
						}}>
							Welcome to Task Scheduler
						</h2>
						<p style={{
							fontSize: 'clamp(0.9rem, 3vw, 1.125rem)',
							color: '#64748b',
							margin: 0
						}}>
							Professional station assignment for McDonald&apos;s restaurants
						</p>
					</div>

					{/* Today's Schedule Status */}
					<div style={{
						background: '#f8fafc',
						borderRadius: 'clamp(8px, 2vw, 12px)',
						padding: 'clamp(1rem, 3vw, 1.5rem)',
						marginBottom: 'clamp(1rem, 3vw, 2rem)',
						border: '1px solid #e2e8f0',
						width: '100%',
						boxSizing: 'border-box'
					}}>
						<div style={{
							textAlign: 'center',
							marginBottom: 'clamp(0.75rem, 2vw, 1rem)'
						}}>
							<h3 style={{
								fontSize: 'clamp(1.1rem, 3vw, 1.25rem)',
								fontWeight: '600',
								color: '#1e293b',
								marginBottom: '0.5rem'
							}}>
								📅 Today&apos;s Schedule
							</h3>
							<p style={{
								color: '#64748b',
								margin: 0,
								fontSize: 'clamp(0.8rem, 2vw, 0.9rem)'
							}}>
								{new Date(todayKey).toLocaleDateString('en-US', {
									weekday: 'long',
									year: 'numeric',
									month: 'long',
									day: 'numeric'
								})}
							</p>
						</div>
						
						{/* Current Schedule Status */}
						{existingSchedule ? (
							<div style={{
								background: '#f0fdf4',
								borderRadius: '8px',
								padding: '1rem',
								border: '1px solid #bbf7d0',
								textAlign: 'center'
							}}>
								<div style={{
									fontSize: '1rem',
									color: '#059669',
									fontWeight: '600',
									marginBottom: '0.5rem'
								}}>
									✅ Schedule Loaded
								</div>
								<div style={{
									fontSize: '0.875rem',
									color: '#047857',
									marginBottom: '0.25rem'
								}}>
									📋 {existingSchedule.employees.length} employees
								</div>
								<div style={{
									fontSize: '0.75rem',
									color: '#047857'
								}}>
									File: {existingSchedule.fileName}
								</div>
								{existingSchedule.scheduleDate !== todayKey && (
									<div style={{
										fontSize: '0.75rem',
										color: '#dc2626',
										marginTop: '0.25rem',
										fontStyle: 'italic'
									}}>
										From: {new Date(existingSchedule.scheduleDate).toLocaleDateString()}
									</div>
								)}
							</div>
						) : showPreviousScheduleOption && previousSchedule ? (
							<div style={{
								background: '#fef3c7',
								borderRadius: '8px',
								padding: '1rem',
								border: '1px solid #fbbf24',
								textAlign: 'center'
							}}>
								<div style={{
									fontSize: '1rem',
									color: '#d97706',
									fontWeight: '600',
									marginBottom: '0.5rem'
								}}>
									⚠️ No Schedule for Today
								</div>
								<div style={{
									fontSize: '0.875rem',
									color: '#92400e',
									marginBottom: '1rem'
								}}>
									Would you like to use the previous schedule as a starting point?
								</div>
								<div style={{
									background: '#ffffff',
									borderRadius: '6px',
									padding: '0.75rem',
									marginBottom: '1rem',
									border: '1px solid #d1d5db'
								}}>
									<div style={{
										fontSize: '0.875rem',
										color: '#374151',
										fontWeight: '600'
									}}>
										Previous Schedule ({new Date(previousSchedule.scheduleDate).toLocaleDateString()})
									</div>
									<div style={{
										fontSize: '0.75rem',
										color: '#6b7280',
										marginTop: '0.25rem'
									}}>
										📋 {previousSchedule.employees.length} employees • File: {previousSchedule.fileName}
									</div>
								</div>
								<div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
									<button
										onClick={handleUsePreviousSchedule}
										style={{
											background: '#10b981',
											color: '#ffffff',
											border: 'none',
											borderRadius: '6px',
											padding: '0.5rem 1rem',
											fontSize: '0.875rem',
											fontWeight: '500',
											cursor: 'pointer',
											transition: 'background-color 0.2s'
										}}
										onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
										onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
									>
										Use Previous Schedule
									</button>
									<button
										onClick={() => setShowPreviousScheduleOption(false)}
										style={{
											background: '#6b7280',
											color: '#ffffff',
											border: 'none',
											borderRadius: '6px',
											padding: '0.5rem 1rem',
											fontSize: '0.875rem',
											fontWeight: '500',
											cursor: 'pointer',
											transition: 'background-color 0.2s'
										}}
										onMouseEnter={(e) => e.currentTarget.style.background = '#4b5563'}
										onMouseLeave={(e) => e.currentTarget.style.background = '#6b7280'}
									>
										Start Fresh
									</button>
								</div>
							</div>
						) : (
							<div style={{
								background: '#fef2f2',
								borderRadius: '8px',
								padding: '1rem',
								border: '1px solid #fecaca',
								textAlign: 'center'
							}}>
								<div style={{
									fontSize: '1rem',
									color: '#dc2626',
									fontWeight: '600',
									marginBottom: '0.5rem'
								}}>
									📋 No Schedule Available
								</div>
								<div style={{
									fontSize: '0.875rem',
									color: '#991b1b'
								}}>
									Please upload a CSV file to get started
								</div>
							</div>
						)}
					</div>

					{/* Action Cards */}
					<div style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(250px, 40vw, 280px), 1fr))',
						gap: 'clamp(1rem, 3vw, 1.5rem)',
						marginBottom: 'clamp(1rem, 3vw, 2rem)',
						width: '100%'
					}}>
						{/* Import Card */}
						<div style={{
							background: '#f8fafc',
							borderRadius: 'clamp(8px, 2vw, 12px)',
							padding: 'clamp(1.5rem, 4vw, 2rem)',
							border: '2px dashed #cbd5e1',
							textAlign: 'center',
							cursor: 'pointer',
							transition: 'all 0.2s ease',
							position: 'relative',
							width: '100%',
							boxSizing: 'border-box'
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
								width: 'clamp(48px, 12vw, 64px)',
								height: 'clamp(48px, 12vw, 64px)',
								background: '#10b981',
								borderRadius: 'clamp(8px, 2vw, 12px)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								margin: '0 auto clamp(0.75rem, 2vw, 1rem)',
								fontSize: 'clamp(1.5rem, 5vw, 2rem)'
							}}>
								📁
							</div>
							<h3 style={{
								fontSize: 'clamp(1.1rem, 3vw, 1.25rem)',
								fontWeight: '600',
								color: '#1e293b',
								marginBottom: '0.5rem'
							}}>
								Import Schedule
							</h3>
							<p style={{
								color: '#64748b',
								margin: 0,
								fontSize: 'clamp(0.8rem, 2vw, 0.9rem)'
							}}>
								Upload CSV or Excel files to import employee schedules
							</p>
						</div>

						{/* Open Scheduler Card */}
						<div style={{ textDecoration: 'none' }}>
							<div style={{
								background: '#f8fafc',
								borderRadius: 'clamp(8px, 2vw, 12px)',
								padding: 'clamp(1.5rem, 4vw, 2rem)',
								border: '1px solid #e2e8f0',
								textAlign: 'center',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
								height: '100%',
								width: '100%',
								boxSizing: 'border-box'
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
									width: 'clamp(48px, 12vw, 64px)',
									height: 'clamp(48px, 12vw, 64px)',
									background: '#f59e0b',
									borderRadius: 'clamp(8px, 2vw, 12px)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									margin: '0 auto clamp(0.75rem, 2vw, 1rem)',
									fontSize: 'clamp(1.5rem, 5vw, 2rem)'
								}}>
									📋
								</div>
								<h3 style={{
									fontSize: 'clamp(1.1rem, 3vw, 1.25rem)',
									fontWeight: '600',
									color: '#1e293b',
									marginBottom: '0.5rem'
								}}>
									Open Scheduler
								</h3>
								<p style={{
									color: '#64748b',
									margin: 0,
									fontSize: 'clamp(0.8rem, 2vw, 0.9rem)'
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
									There are existing employee assignments for today.
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
