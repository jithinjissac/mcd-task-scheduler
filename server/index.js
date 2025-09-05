const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const os = require('os');

const FileManager = require('./utils/fileManager');
const schedulesRouter = require('./routes/schedules');
const assignmentsRouter = require('./routes/assignments');
const dayPartsRouter = require('./routes/dayparts');

const PORT = process.env.PORT || 3002;
const fileManager = new FileManager('./data');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins for universal access
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow socket.io connections
}));

// CORS middleware - Allow all origins for universal device access
app.use(cors({
  origin: "*", // Allow access from any device/IP
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Make fileManager and io available to routes
app.locals.fileManager = fileManager;
app.locals.io = io;

// API Routes
app.use('/api/schedules', schedulesRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/dayparts', dayPartsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Network info endpoint for device access
app.get('/api/network-info', (req, res) => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const interfaceName in networkInterfaces) {
    for (const networkInterface of networkInterfaces[interfaceName]) {
      if (networkInterface.family === 'IPv4' && !networkInterface.internal) {
        addresses.push({
          interface: interfaceName,
          address: networkInterface.address,
          url: `http://${networkInterface.address}:${PORT}`
        });
      }
    }
  }
  
  res.json({
    port: PORT,
    networkAddresses: addresses,
    localUrl: `http://localhost:${PORT}`,
    timestamp: new Date().toISOString()
  });
});

// Data backup endpoint
app.post('/api/backup', async (req, res) => {
  try {
    const backupPath = await fileManager.backup();
    res.json({
      success: true,
      message: 'Backup created successfully',
      backupPath
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Import localStorage data endpoint
app.post('/api/import-local-data', async (req, res) => {
  try {
    const { localStorageData } = req.body;
    
    if (!localStorageData || typeof localStorageData !== 'object') {
      return res.status(400).json({ error: 'Invalid localStorage data' });
    }

    let importedCount = 0;
    const results = {
      schedules: 0,
      assignments: 0,
      dayparts: 0
    };

    // Process each localStorage key
    for (const [key, value] of Object.entries(localStorageData)) {
      try {
        if (key.startsWith('schedule_')) {
          const date = key.replace('schedule_', '');
          const data = typeof value === 'string' ? JSON.parse(value) : value;
          await fileManager.writeJSON('schedules', date, data);
          results.schedules++;
        } else if (key.startsWith('assignments_')) {
          const date = key.replace('assignments_', '');
          const data = typeof value === 'string' ? JSON.parse(value) : value;
          await fileManager.writeJSON('assignments', date, data);
          results.assignments++;
        } else if (key.startsWith('lastDayPart_')) {
          const date = key.replace('lastDayPart_', '');
          const dayPart = typeof value === 'string' ? value : value.toString();
          await fileManager.writeJSON('dayparts', date, { 
            dayPart, 
            savedAt: new Date().toISOString(),
            importedFromLocal: true 
          });
          results.dayparts++;
        }
        importedCount++;
      } catch (error) {
        console.warn(`Failed to import ${key}:`, error);
      }
    }

    // Emit update to all clients
    io.emit('data-imported', {
      timestamp: new Date().toISOString(),
      results
    });

    res.json({
      success: true,
      message: `Successfully imported ${importedCount} items`,
      results
    });
  } catch (error) {
    console.error('Error importing localStorage data:', error);
    res.status(500).json({ error: 'Failed to import localStorage data' });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send current connection count to all clients
  io.emit('connection-count', io.sockets.sockets.size);

  // Handle client disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    io.emit('connection-count', io.sockets.sockets.size);
  });

  // Handle client ping for connection health
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  });

  // Join date-specific room for targeted updates
  socket.on('join-date', (date) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      socket.join(`date-${date}`);
      console.log(`Client ${socket.id} joined room for date ${date}`);
    }
  });

  // Leave date-specific room
  socket.on('leave-date', (date) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      socket.leave(`date-${date}`);
      console.log(`Client ${socket.id} left room for date ${date}`);
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`\n🍟 McDonald's Task Scheduler Server`);
  console.log(`📍 Running on http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
  console.log(`🔄 Real-time: WebSocket connections enabled\n`);
});

module.exports = { app, server, io };
