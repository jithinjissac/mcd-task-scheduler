'use client';

import React, { useState } from 'react';
import TinyRemoveButton from './TinyRemoveButton';
import MiniEmployeeCard from './MiniEmployeeCard';
import '../styles/showcase.css';

const RemoveButtonShowcase: React.FC = () => {
  const [removedItems, setRemovedItems] = useState<string[]>([]);

  const handleRemove = (item: string) => {
    setRemovedItems(prev => [...prev, item]);
    setTimeout(() => {
      setRemovedItems(prev => prev.filter(i => i !== item));
    }, 2000);
  };

  const isRemoved = (item: string) => removedItems.includes(item);

  return (
    <div className="showcase-container">
      <div className="showcase-content">
        {/* Header */}
        <header className="showcase-header">
          <h1 className="showcase-title">
            Remove Button Showcase
          </h1>
          <p className="showcase-subtitle">
            Ultra-compact button components for McDonald&apos;s Task Scheduler
          </p>
        </header>
        
        {/* Ultra-Compact Remove Buttons */}
        <section className="showcase-section">
          <h2 className="section-title">Ultra-Compact Button Variants</h2>
          <p className="section-description">
            Four specialized variants optimized for different use cases and visual contexts.
          </p>
          
          <div className="button-grid">
            
            {/* Micro Size Examples */}
            {['dot', 'line', 'ghost', 'minimal'].map((variant) => (
              <div key={`micro-${variant}`} className="button-demo-card">
                <div className="demo-label">Micro {variant}</div>
                <div className="demo-content">
                  <div className={`p-1 rounded border flex items-center justify-between text-xs ${isRemoved(`micro-${variant}`) ? 'opacity-50 bg-red-50' : 'bg-blue-50 border-blue-200'}`}>
                    <span className="text-blue-800 text-[8px]">User</span>
                    {!isRemoved(`micro-${variant}`) && (
                      <TinyRemoveButton
                        onClick={() => handleRemove(`micro-${variant}`)}
                        size="micro"
                        variant={variant as any}
                      />
                    )}
                  </div>
                </div>
                <div className="demo-description">12px ultra-compact design</div>
              </div>
            ))}
            
            {/* Tiny Size Examples */}
            {['dot', 'line', 'ghost', 'minimal'].map((variant) => (
              <div key={`tiny-${variant}`} className="button-demo-card">
                <div className="demo-label">Tiny {variant}</div>
                <div className="demo-content">
                  <div className={`p-1 rounded border flex items-center justify-between text-xs ${isRemoved(`tiny-${variant}`) ? 'opacity-50 bg-red-50' : 'bg-green-50 border-green-200'}`}>
                    <span className="text-green-800 text-[9px]">Staff</span>
                    {!isRemoved(`tiny-${variant}`) && (
                      <TinyRemoveButton
                        onClick={() => handleRemove(`tiny-${variant}`)}
                        size="tiny"
                        variant={variant as any}
                      />
                    )}
                  </div>
                </div>
                <div className="demo-description">16px optimized for dense layouts</div>
              </div>
            ))}
          </div>
        </section>

        {/* Dense Grid Layout */}
        <section className="showcase-section">
          <h2 className="section-title">Dense Grid Layout</h2>
          <p className="section-description">
            Demonstrating space efficiency with 24 items in a compact grid format.
          </p>
          <div className="example-content">
            <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-0.5">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={`grid-${i}`} className="relative group">
                  <div className={`p-0.5 rounded text-center text-[8px] border ${isRemoved(`grid-${i}`) ? 'opacity-50 bg-red-50' : 'bg-gray-50 border-gray-200 hover:bg-blue-50'}`}>
                    <div className="text-gray-700 font-medium text-[7px]">#{i + 1}</div>
                    {!isRemoved(`grid-${i}`) && (
                      <TinyRemoveButton
                        onClick={() => handleRemove(`grid-${i}`)}
                        size="micro"
                        variant="ghost"
                        className="absolute -top-0.5 -right-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mini Employee Cards with Micro Ghost Design */}
        <section className="showcase-section">
          <h2 className="section-title">Mini Employee Cards - Micro Ghost 12px</h2>
          <p className="section-description">
            Ultra-compact employee cards with micro ghost remove buttons (12px) for maximum space efficiency.
          </p>
          
          <div className="example-grid">
            {/* Ultra-Compact Employee List */}
            <div className="example-card">
              <div className="example-header">
                <h3 className="example-title">Ultra-Compact Staff List</h3>
              </div>
              <div className="example-content">
                <div className="space-y-0.5">
                  {[
                    { name: 'John Smith', position: 'Manager', shift: '7-3' },
                    { name: 'Sarah Johnson', position: 'Cashier', shift: '8-4' },
                    { name: 'Mike Davis', position: 'Cook', shift: '9-5' },
                    { name: 'Lisa Wong', position: 'Drive-Thru', shift: '6-2' },
                    { name: 'Tom Wilson', position: 'Grill', shift: '7-3' },
                    { name: 'Anna Lee', position: 'Fries', shift: '8-4' }
                  ].map((employee, i) => (
                    <MiniEmployeeCard
                      key={`employee-${i}`}
                      name={employee.name}
                      position={employee.position}
                      shift={employee.shift}
                      onRemove={() => handleRemove(`employee-${employee.name}`)}
                      compact={true}
                      className={isRemoved(`employee-${employee.name}`) ? 'opacity-50' : ''}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Name Only Cards */}
            <div className="example-card">
              <div className="example-header">
                <h3 className="example-title">Name Only (Minimal)</h3>
              </div>
              <div className="example-content">
                <div className="space-y-0.5">
                  {[
                    'Alex Rodriguez', 'Beth Chen', 'Carlos Martinez', 
                    'Diana Park', 'Erik Thompson', 'Fatima Al-Zahra'
                  ].map((name, i) => (
                    <MiniEmployeeCard
                      key={`minimal-${i}`}
                      name={name}
                      onRemove={() => handleRemove(`minimal-${name}`)}
                      compact={true}
                      className={isRemoved(`minimal-${name}`) ? 'opacity-50' : ''}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Position Only Cards */}
            <div className="example-card">
              <div className="example-header">
                <h3 className="example-title">Position Focus</h3>
              </div>
              <div className="example-content">
                <div className="space-y-0.5">
                  {[
                    { name: 'J. Smith', position: 'Kitchen Leader' },
                    { name: 'S. Davis', position: 'Front Counter' },
                    { name: 'M. Wilson', position: 'Drive Thru' },
                    { name: 'L. Chen', position: 'Shift Manager' },
                    { name: 'A. Brown', position: 'Maintenance' },
                    { name: 'K. Jones', position: 'Trainer' }
                  ].map((employee, i) => (
                    <MiniEmployeeCard
                      key={`position-${i}`}
                      name={employee.name}
                      position={employee.position}
                      onRemove={() => handleRemove(`position-${employee.name}`)}
                      compact={true}
                      className={isRemoved(`position-${employee.name}`) ? 'opacity-50' : ''}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Comparison: Compact vs Standard */}
            <div className="example-card">
              <div className="example-header">
                <h3 className="example-title">Size Comparison</h3>
              </div>
              <div className="example-content">
                <div className="space-y-2">
                  <div>
                    <div className="text-[10px] font-medium text-gray-600 mb-1">Ultra-Compact (12px ghost)</div>
                    <MiniEmployeeCard
                      name="Emma Thompson"
                      position="Cashier"
                      shift="Morning"
                      onRemove={() => handleRemove('comparison-compact')}
                      compact={true}
                      className={isRemoved('comparison-compact') ? 'opacity-50' : ''}
                    />
                  </div>
                  <div>
                    <div className="text-[10px] font-medium text-gray-600 mb-1">Standard Size</div>
                    <MiniEmployeeCard
                      name="Emma Thompson"
                      position="Cashier"
                      shift="Morning"
                      onRemove={() => handleRemove('comparison-standard')}
                      compact={false}
                      className={isRemoved('comparison-standard') ? 'opacity-50' : ''}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Micro Employee Cards */}
        <section className="showcase-section">
          <h2 className="section-title">Micro Employee Cards</h2>
          <p className="section-description">
            Ultra-compact employee card designs for space-constrained interfaces.
          </p>
          <div className="example-grid">
            
            {/* Tiny Cards */}
            <div className="example-card">
              <div className="example-header">
                <h3 className="example-title">Mini Employee Cards</h3>
              </div>
              <div className="example-content">
                <div className="space-y-0.5">
                  {['Alice', 'Bob', 'Charlie', 'Diana'].map((name, i) => (
                    <div key={`mini-${name}`} className={`example-employee-card ${isRemoved(`mini-${name}`) ? 'opacity-50' : ''}`}>
                      <div className="employee-info">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-blue-300 rounded-full flex items-center justify-center text-[6px] text-white font-bold">
                            {name[0]}
                          </div>
                          <span className="employee-name text-[8px]">{name}</span>
                        </div>
                      </div>
                      {!isRemoved(`mini-${name}`) && (
                        <TinyRemoveButton
                          onClick={() => handleRemove(`mini-${name}`)}
                          size="micro"
                          variant={i % 2 === 0 ? 'dot' : 'minimal'}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Badge Style */}
            <div className="example-card">
              <div className="example-header">
                <h3 className="example-title">Role Badges</h3>
              </div>
              <div className="example-content">
                <div className="flex flex-wrap gap-0.5">
                  {['MGR', 'COOK', 'CASH', 'DT'].map((role, i) => (
                    <div key={`badge-${role}`} className={`skill-tag ${isRemoved(`badge-${role}`) ? 'opacity-50' : ''}`}>
                      <span>{role}</span>
                      {!isRemoved(`badge-${role}`) && (
                        <TinyRemoveButton
                          onClick={() => handleRemove(`badge-${role}`)}
                          size="micro"
                          variant="line"
                          className="opacity-60 group-hover:opacity-100"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Minimal List */}
            <div className="example-card">
              <div className="example-header">
                <h3 className="example-title">Schedule List</h3>
              </div>
              <div className="example-content">
                <div className="space-y-0.5">
                  {['7AM-J', '8AM-S', '9AM-M', '10AM-L'].map((item, i) => (
                    <div key={`sched-${i}`} className={`flex items-center justify-between py-0.5 px-0.5 rounded text-[8px] ${isRemoved(`sched-${i}`) ? 'opacity-50 line-through' : 'hover:bg-gray-50'}`}>
                      <span className="text-gray-600">{item}</span>
                      {!isRemoved(`sched-${i}`) && (
                        <TinyRemoveButton
                          onClick={() => handleRemove(`sched-${i}`)}
                          size="micro"
                          variant="ghost"
                          className="opacity-30 hover:opacity-100"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Compact Assignment */}
            <div className="example-card">
              <div className="example-header">
                <h3 className="example-title">Station Assignments</h3>
              </div>
              <div className="example-content">
                <div className="space-y-0.5">
                  {[
                    { pos: 'KL', name: 'Alex' },
                    { pos: 'FC', name: 'Beth' },
                    { pos: 'DT', name: 'Carl' },
                    { pos: 'BR', name: 'Dana' }
                  ].map((assignment, i) => (
                    <div key={`assign-${i}`} className={`example-employee-card ${isRemoved(`assign-${i}`) ? 'opacity-50' : ''}`}>
                      <div className="employee-info">
                        <span className="font-bold text-yellow-700">{assignment.pos}</span>
                        <span className="text-yellow-600">{assignment.name}</span>
                      </div>
                      {!isRemoved(`assign-${i}`) && (
                        <TinyRemoveButton
                          onClick={() => handleRemove(`assign-${i}`)}
                          size="micro"
                          variant="minimal"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Size Comparison */}
        <section className="showcase-section">
          <h2 className="section-title">Size Comparison</h2>
          <p className="section-description">
            Visual comparison of all available button sizes and their optimal use cases.
          </p>
          <div className="size-comparison">
            {/* Micro */}
            <div className="size-item">
              <div className="size-label">Micro (12px)</div>
              <div className="flex items-center justify-center gap-1 p-3 bg-gray-50 rounded">
                <TinyRemoveButton size="micro" variant="dot" onClick={() => {}} />
                <TinyRemoveButton size="micro" variant="line" onClick={() => {}} />
                <TinyRemoveButton size="micro" variant="ghost" onClick={() => {}} />
                <TinyRemoveButton size="micro" variant="minimal" onClick={() => {}} />
              </div>
            </div>

            {/* Tiny */}
            <div className="size-item">
              <div className="size-label">Tiny (16px)</div>
              <div className="flex items-center justify-center gap-1 p-3 bg-gray-50 rounded">
                <TinyRemoveButton size="tiny" variant="dot" onClick={() => {}} />
                <TinyRemoveButton size="tiny" variant="line" onClick={() => {}} />
                <TinyRemoveButton size="tiny" variant="ghost" onClick={() => {}} />
                <TinyRemoveButton size="tiny" variant="minimal" onClick={() => {}} />
              </div>
            </div>

            {/* Small */}
            <div className="size-item">
              <div className="size-label">Small (20px)</div>
              <div className="flex items-center justify-center gap-1 p-3 bg-gray-50 rounded">
                <TinyRemoveButton size="small" variant="dot" onClick={() => {}} />
                <TinyRemoveButton size="small" variant="line" onClick={() => {}} />
                <TinyRemoveButton size="small" variant="ghost" onClick={() => {}} />
                <TinyRemoveButton size="small" variant="minimal" onClick={() => {}} />
              </div>
            </div>
          </div>
        </section>

        {/* Real-world Examples */}
        <section className="showcase-section">
          <h2 className="section-title">Real-world Usage Examples</h2>
          <p className="section-description">
            Practical implementations in McDonald&apos;s Task Scheduler interfaces.
          </p>
          <div className="example-grid">
            
            {/* McDonald's Schedule Grid */}
            <div className="example-card">
              <div className="example-header">
                <h3 className="example-title">McDonald&apos;s Schedule</h3>
              </div>
              <div className="example-content">
                <div className="space-y-1">
                  <div className="grid grid-cols-4 gap-1 text-[8px] font-medium text-gray-600">
                    <div>Position</div>
                    <div>Employee</div>
                    <div>Time</div>
                    <div></div>
                  </div>
                  {[
                    { pos: 'Kitchen Leader', emp: 'John D.', time: '7-3' },
                    { pos: 'Front Counter', emp: 'Sarah M.', time: '8-4' },
                    { pos: 'Drive Thru', emp: 'Mike R.', time: '9-5' },
                    { pos: 'Shift Manager', emp: 'Lisa K.', time: '6-2' },
                    { pos: 'Grill Cook', emp: 'Tom W.', time: '7-3' },
                    { pos: 'Fry Station', emp: 'Anna L.', time: '8-4' }
                  ].map((item, i) => (
                    <div key={`schedule-${i}`} className={`example-employee-card ${isRemoved(`schedule-${i}`) ? 'opacity-50' : ''}`}>
                      <div className="grid grid-cols-3 gap-1 flex-1 items-center text-[8px]">
                        <div className="employee-name truncate">{item.pos}</div>
                        <div className="text-blue-600 truncate">{item.emp}</div>
                        <div className="text-blue-500">{item.time}</div>
                      </div>
                      <div className="flex justify-end">
                        {!isRemoved(`schedule-${i}`) && (
                          <TinyRemoveButton
                            onClick={() => handleRemove(`schedule-${i}`)}
                            size="micro"
                            variant="dot"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skills & Certifications */}
            <div className="example-card">
              <div className="example-header">
                <h3 className="example-title">Skills & Certifications</h3>
              </div>
              <div className="example-content">
                <div className="skills-grid">
                  {[
                    'Grill', 'Fries', 'Drive-Thru', 'Cash', 'Cleaning', 'Manager', 
                    'Certified', 'Trainer', 'Minor', 'Full-Time', 'Part-Time', 'Backup'
                  ].map((skill, i) => (
                    <div key={`skill-${skill}`} className={`skill-tag ${isRemoved(`skill-${skill}`) ? 'opacity-50' : ''}`}>
                      <span>{skill}</span>
                      {!isRemoved(`skill-${skill}`) && (
                        <TinyRemoveButton
                          onClick={() => handleRemove(`skill-${skill}`)}
                          size="micro"
                          variant="line"
                          className="opacity-50 group-hover:opacity-100"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Status Messages */}
        {removedItems.length > 0 && (
          <div className="status-messages">
            {removedItems.slice(-5).map((item) => (
              <div key={item} className="status-message">
                ✓ {item}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RemoveButtonShowcase;
