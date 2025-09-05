# McDonald's Task Scheduler - Landing Page & Navigation

## New Landing Page Features

### 🏠 Professional Landing Page
- **McDonald's Branding**: Red and yellow color scheme with official branding
- **Live Clock**: Real-time clock display for restaurant operations
- **Feature Showcase**: Highlights key functionality with visual cards
- **Day Part Information**: Explains Breakfast vs Lunch/Dinner operations

### 🚀 Navigation Structure
```
/ (Root) - Landing Page
├── Features overview
├── Day part explanations  
├── Launch button → /scheduler
└── Footer with tech info

/scheduler - Task Scheduler Application
├── Full scheduling interface
├── Drag & drop functionality
├── Home button → / (back to landing)
└── All existing features
```

### 🎨 Landing Page Components

#### Hero Section
- "Burgernomics" branding
- Task Scheduler subtitle
- Descriptive tagline about operations

#### Feature Cards
1. **👥 Employee Management** - Crew organization and availability
2. **📋 Drag & Drop Scheduling** - Intuitive task assignments  
3. **🔄 Real-time Sync** - Multi-device synchronization

#### Day Parts Section
- **🌅 Breakfast Shift** - Morning operations (hash browns, breakfast assembly)
- **🍔 Lunch/Dinner Shift** - Full service (grill, fries, delivery)

#### Call-to-Action
- **🚀 Launch Task Scheduler** button
- Feature badges (Multi-Device, Real-time, CSV Support)

### 📱 Responsive Design
- Mobile-friendly layout
- Tablet optimization for restaurant use
- Desktop compatibility
- Touch-friendly buttons and navigation

### 🌐 Network Access
Both landing page and scheduler work seamlessly across network:
- **Local**: http://localhost:3003
- **Network**: http://192.168.0.222:3003
- **Scheduler Direct**: http://192.168.0.222:3003/scheduler

### ✨ User Experience Flow
1. **Welcome** - Users land on professional McDonald's branded page
2. **Learn** - Review features and understand day part operations
3. **Launch** - Click to enter the full task scheduler
4. **Work** - Use full drag-and-drop scheduling interface
5. **Return** - Home button to go back to landing page

The landing page provides a professional entry point that explains the system before users dive into the full scheduling interface, making it perfect for training new managers and showcasing the application's capabilities.
