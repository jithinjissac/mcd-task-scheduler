'use client';

import React, { useState } from 'react';
import MiniEmployeeCard from '../../components/MiniEmployeeCard';

const MiniCardDemo: React.FC = () => {
  const [removedEmployees, setRemovedEmployees] = useState<string[]>([]);

  const handleRemove = (employeeName: string) => {
    setRemovedEmployees(prev => [...prev, employeeName]);
    setTimeout(() => {
      setRemovedEmployees(prev => prev.filter(name => name !== employeeName));
    }, 3000);
  };

  const isRemoved = (employeeName: string) => removedEmployees.includes(employeeName);

  // Sample McDonald's employee data
  const employees = [
    { name: 'John Smith', position: 'Manager', shift: '7AM-3PM' },
    { name: 'Sarah Johnson', position: 'Cashier', shift: '8AM-4PM' },
    { name: 'Mike Davis', position: 'Cook', shift: '9AM-5PM' },
    { name: 'Lisa Wong', position: 'Drive-Thru', shift: '6AM-2PM' },
    { name: 'Tom Wilson', position: 'Grill', shift: '7AM-3PM' },
    { name: 'Anna Lee', position: 'Fries', shift: '8AM-4PM' },
    { name: 'Carlos Martinez', position: 'Cleaning', shift: '10AM-6PM' },
    { name: 'Diana Park', position: 'Trainer', shift: '9AM-5PM' },
    { name: 'Erik Thompson', position: 'Maintenance', shift: '6AM-2PM' },
    { name: 'Fatima Al-Zahra', position: 'Shift Lead', shift: '7AM-3PM' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 p-6 bg-gradient-to-r from-red-600 to-red-700 rounded-xl text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2">
            Mini Employee Cards
          </h1>
          <p className="text-lg opacity-90">
            Ultra-compact 12px micro ghost design for McDonald&apos;s Task Scheduler
          </p>
        </div>

        {/* Demo Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Ultra-Compact Staff Grid */}
          <div className="bg-white rounded-lg p-4 shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Ultra-Compact Staff Grid</h2>
            <p className="text-sm text-gray-600 mb-4">
              Maximum space efficiency with micro ghost remove buttons (12px)
            </p>
            <div className="grid grid-cols-1 gap-1">
              {employees.slice(0, 6).map((employee, i) => (
                <MiniEmployeeCard
                  key={`compact-${i}`}
                  name={employee.name}
                  position={employee.position}
                  shift={employee.shift}
                  onRemove={() => handleRemove(`compact-${employee.name}`)}
                  compact={true}
                  className={isRemoved(`compact-${employee.name}`) ? 'opacity-50' : ''}
                />
              ))}
            </div>
          </div>

          {/* Dense Assignment Board */}
          <div className="bg-white rounded-lg p-4 shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Dense Assignment Board</h2>
            <p className="text-sm text-gray-600 mb-4">
              Multiple columns with ultra-compact cards
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <h3 className="text-xs font-medium text-gray-700 mb-2">Morning Shift</h3>
                <div className="space-y-0.5">
                  {employees.slice(0, 3).map((employee, i) => (
                    <MiniEmployeeCard
                      key={`morning-${i}`}
                      name={employee.name.split(' ')[0]}
                      position={employee.position}
                      onRemove={() => handleRemove(`morning-${employee.name}`)}
                      compact={true}
                      className={isRemoved(`morning-${employee.name}`) ? 'opacity-50' : ''}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-700 mb-2">Evening Shift</h3>
                <div className="space-y-0.5">
                  {employees.slice(3, 6).map((employee, i) => (
                    <MiniEmployeeCard
                      key={`evening-${i}`}
                      name={employee.name.split(' ')[0]}
                      position={employee.position}
                      onRemove={() => handleRemove(`evening-${employee.name}`)}
                      compact={true}
                      className={isRemoved(`evening-${employee.name}`) ? 'opacity-50' : ''}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Size Comparison */}
          <div className="bg-white rounded-lg p-4 shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Size Comparison</h2>
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Ultra-Compact (Height: ~20px)</h3>
                <MiniEmployeeCard
                  name="Emma Thompson"
                  position="Cashier"
                  shift="Morning"
                  onRemove={() => handleRemove('size-compact')}
                  compact={true}
                  className={isRemoved('size-compact') ? 'opacity-50' : ''}
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Standard Size (Height: ~40px)</h3>
                <MiniEmployeeCard
                  name="Emma Thompson"
                  position="Cashier"
                  shift="Morning"
                  onRemove={() => handleRemove('size-standard')}
                  compact={false}
                  className={isRemoved('size-standard') ? 'opacity-50' : ''}
                />
              </div>
            </div>
          </div>

          {/* Feature Demonstration */}
          <div className="bg-white rounded-lg p-4 shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Feature Demonstration</h2>
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Name Only</h3>
                <MiniEmployeeCard
                  name="Alex Rodriguez"
                  onRemove={() => handleRemove('feature-name')}
                  compact={true}
                  className={isRemoved('feature-name') ? 'opacity-50' : ''}
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Name + Position</h3>
                <MiniEmployeeCard
                  name="Beth Chen"
                  position="Kitchen Leader"
                  onRemove={() => handleRemove('feature-position')}
                  compact={true}
                  className={isRemoved('feature-position') ? 'opacity-50' : ''}
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Name + Shift</h3>
                <MiniEmployeeCard
                  name="Carlos Martinez"
                  shift="7AM-3PM"
                  onRemove={() => handleRemove('feature-shift')}
                  compact={true}
                  className={isRemoved('feature-shift') ? 'opacity-50' : ''}
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Full Info</h3>
                <MiniEmployeeCard
                  name="Diana Park"
                  position="Trainer"
                  shift="9AM-5PM"
                  onRemove={() => handleRemove('feature-full')}
                  compact={true}
                  className={isRemoved('feature-full') ? 'opacity-50' : ''}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Technical Specs */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Technical Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <h3 className="font-medium text-gray-700 mb-1">Compact Mode</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• Height: ~20px</li>
                <li>• Remove button: 12px</li>
                <li>• Avatar: 12px</li>
                <li>• Text: 8-9px</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <h3 className="font-medium text-gray-700 mb-1">Button Type</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• Variant: Ghost</li>
                <li>• Size: Micro (12px)</li>
                <li>• Hover: Fade in</li>
                <li>• Icon: × symbol</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <h3 className="font-medium text-gray-700 mb-1">Responsive</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• Touch friendly</li>
                <li>• Hover states</li>
                <li>• Accessibility</li>
                <li>• Smooth animations</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <h3 className="font-medium text-gray-700 mb-1">Use Cases</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• Dense grids</li>
                <li>• Mobile interfaces</li>
                <li>• Sidebar lists</li>
                <li>• Quick assignments</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {removedEmployees.length > 0 && (
          <div className="fixed bottom-4 right-4 space-y-2 max-w-xs">
            {removedEmployees.slice(-3).map((employee) => (
              <div key={employee} className="bg-green-500 text-white px-3 py-2 rounded-md text-sm shadow-lg transform transition-all duration-300">
                ✓ Removed: {employee}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MiniCardDemo;
