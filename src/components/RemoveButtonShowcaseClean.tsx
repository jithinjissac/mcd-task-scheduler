'use client';

import React, { useState } from 'react';
import TinyRemoveButton from './TinyRemoveButton';

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
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Ultra-Compact Remove Buttons</h1>
        
        {/* Ultra-Compact Remove Buttons */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Micro & Tiny Buttons</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            
            {/* Micro Size Examples */}
            {['dot', 'line', 'ghost', 'minimal'].map((variant) => (
              <div key={`micro-${variant}`} className="bg-white rounded p-2 shadow-sm border">
                <h4 className="text-[10px] font-medium mb-1 capitalize">{variant}</h4>
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
            ))}
            
            {/* Tiny Size Examples */}
            {['dot', 'line', 'ghost', 'minimal'].map((variant) => (
              <div key={`tiny-${variant}`} className="bg-white rounded p-2 shadow-sm border">
                <h4 className="text-[10px] font-medium mb-1 capitalize">{variant}</h4>
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
            ))}
          </div>
        </section>

        {/* Dense Grid Layout */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Dense Grid (24 Items)</h2>
          <div className="bg-white rounded-lg p-3 shadow-md">
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

        {/* Micro Employee Cards */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Micro Employee Cards</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            
            {/* Tiny Cards */}
            <div className="bg-white rounded p-2 shadow-sm">
              <h3 className="text-xs font-medium mb-2">Mini Cards</h3>
              <div className="space-y-0.5">
                {['Alice', 'Bob', 'Charlie', 'Diana'].map((name, i) => (
                  <div key={`mini-${name}`} className={`flex items-center justify-between p-1 rounded text-xs border ${isRemoved(`mini-${name}`) ? 'opacity-50 bg-red-50' : 'bg-gray-50 hover:bg-blue-50'}`}>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-300 rounded-full flex items-center justify-center text-[6px] text-white font-bold">
                        {name[0]}
                      </div>
                      <span className="text-gray-700 text-[8px]">{name}</span>
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

            {/* Badge Style */}
            <div className="bg-white rounded p-2 shadow-sm">
              <h3 className="text-xs font-medium mb-2">Badges</h3>
              <div className="flex flex-wrap gap-0.5">
                {['MGR', 'COOK', 'CASH', 'DT'].map((role, i) => (
                  <div key={`badge-${role}`} className={`relative group inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[8px] border ${isRemoved(`badge-${role}`) ? 'opacity-50 bg-red-100' : 'bg-blue-100 border-blue-200 text-blue-700'}`}>
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

            {/* Minimal List */}
            <div className="bg-white rounded p-2 shadow-sm">
              <h3 className="text-xs font-medium mb-2">Schedule</h3>
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

            {/* Compact Assignment */}
            <div className="bg-white rounded p-2 shadow-sm">
              <h3 className="text-xs font-medium mb-2">Assignments</h3>
              <div className="space-y-0.5">
                {[
                  { pos: 'KL', name: 'Alex' },
                  { pos: 'FC', name: 'Beth' },
                  { pos: 'DT', name: 'Carl' },
                  { pos: 'BR', name: 'Dana' }
                ].map((assignment, i) => (
                  <div key={`assign-${i}`} className={`flex items-center justify-between py-0.5 px-1 rounded text-[8px] border ${isRemoved(`assign-${i}`) ? 'opacity-50 bg-red-50' : 'bg-yellow-50 border-yellow-200'}`}>
                    <div className="flex items-center gap-1">
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
        </section>

        {/* Size Comparison */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Size Comparison</h2>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Micro */}
              <div className="text-center">
                <h3 className="text-sm font-medium mb-2">Micro (12px)</h3>
                <div className="flex items-center justify-center gap-1 p-3 bg-gray-50 rounded">
                  <TinyRemoveButton size="micro" variant="dot" onClick={() => {}} />
                  <TinyRemoveButton size="micro" variant="line" onClick={() => {}} />
                  <TinyRemoveButton size="micro" variant="ghost" onClick={() => {}} />
                  <TinyRemoveButton size="micro" variant="minimal" onClick={() => {}} />
                </div>
              </div>

              {/* Tiny */}
              <div className="text-center">
                <h3 className="text-sm font-medium mb-2">Tiny (16px)</h3>
                <div className="flex items-center justify-center gap-1 p-3 bg-gray-50 rounded">
                  <TinyRemoveButton size="tiny" variant="dot" onClick={() => {}} />
                  <TinyRemoveButton size="tiny" variant="line" onClick={() => {}} />
                  <TinyRemoveButton size="tiny" variant="ghost" onClick={() => {}} />
                  <TinyRemoveButton size="tiny" variant="minimal" onClick={() => {}} />
                </div>
              </div>

              {/* Small */}
              <div className="text-center">
                <h3 className="text-sm font-medium mb-2">Small (20px)</h3>
                <div className="flex items-center justify-center gap-1 p-3 bg-gray-50 rounded">
                  <TinyRemoveButton size="small" variant="dot" onClick={() => {}} />
                  <TinyRemoveButton size="small" variant="line" onClick={() => {}} />
                  <TinyRemoveButton size="small" variant="ghost" onClick={() => {}} />
                  <TinyRemoveButton size="small" variant="minimal" onClick={() => {}} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Real-world Examples */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Real-world Usage</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* McDonald's Schedule Grid */}
            <div className="bg-white rounded-lg p-3 shadow-md">
              <h3 className="text-sm font-medium mb-3">McDonald&apos;s Schedule</h3>
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
                  <div key={`schedule-${i}`} className={`grid grid-cols-4 gap-1 items-center py-0.5 px-1 rounded text-[8px] border ${isRemoved(`schedule-${i}`) ? 'opacity-50 bg-red-50' : 'bg-blue-50 border-blue-100'}`}>
                    <div className="text-blue-700 font-medium truncate">{item.pos}</div>
                    <div className="text-blue-600 truncate">{item.emp}</div>
                    <div className="text-blue-500">{item.time}</div>
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

            {/* Tag Cloud */}
            <div className="bg-white rounded-lg p-3 shadow-md">
              <h3 className="text-sm font-medium mb-3">Skills & Certifications</h3>
              <div className="flex flex-wrap gap-1">
                {[
                  'Grill', 'Fries', 'Drive-Thru', 'Cash', 'Cleaning', 'Manager', 
                  'Certified', 'Trainer', 'Minor', 'Full-Time', 'Part-Time', 'Backup'
                ].map((skill, i) => (
                  <div key={`skill-${skill}`} className={`relative group inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] border ${isRemoved(`skill-${skill}`) ? 'opacity-50 bg-red-100' : 'bg-purple-100 border-purple-200 text-purple-700'}`}>
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
        </section>

        {/* Status Messages */}
        {removedItems.length > 0 && (
          <div className="fixed bottom-4 right-4 space-y-1 max-w-xs">
            {removedItems.slice(-5).map((item) => (
              <div key={item} className="bg-green-500 text-white px-2 py-1 rounded text-[10px] shadow-lg transform transition-all duration-300 translate-x-0 truncate">
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
