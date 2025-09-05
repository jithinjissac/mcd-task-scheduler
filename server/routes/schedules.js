const express = require('express');
const router = express.Router();

// GET /api/schedules/:date - Get employee schedule for a specific date
router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { fileManager, io } = req.app.locals;
    
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const schedule = await fileManager.readJSON('schedules', date);
    
    if (!schedule) {
      // Try to get the latest schedule as fallback
      const latestSchedule = await fileManager.getLatestSchedule();
      if (latestSchedule) {
        return res.json({
          employees: latestSchedule.employees || [],
          isLatest: true,
          originalDate: latestSchedule.date,
          uploadedAt: latestSchedule.uploadedAt || latestSchedule.lastUpdated,
          fileName: latestSchedule.fileName
        });
      }
      
      return res.json({ employees: [] });
    }

    res.json({
      employees: schedule.employees || [],
      uploadedAt: schedule.uploadedAt,
      fileName: schedule.fileName,
      lastUpdated: schedule.lastUpdated
    });
  } catch (error) {
    console.error('Error getting schedule:', error);
    res.status(500).json({ error: 'Failed to get schedule' });
  }
});

// POST /api/schedules/:date - Save employee schedule for a specific date
router.post('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { employees, fileName, replaceAll } = req.body;
    const { fileManager, io } = req.app.locals;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Validate employees array
    if (!Array.isArray(employees)) {
      return res.status(400).json({ error: 'Employees must be an array' });
    }

    const scheduleData = {
      employees,
      uploadedAt: new Date().toISOString(),
      fileName: fileName || 'manual-entry'
    };

    // Save schedule
    const savedSchedule = await fileManager.writeJSON('schedules', date, scheduleData);

    // If replaceAll is true, clear assignments for this date
    if (replaceAll) {
      try {
        await fileManager.writeJSON('assignments', date, { assignments: {} });
        
        // Emit assignment update to all clients
        io.emit('assignments-updated', {
          date,
          assignments: {},
          cleared: true
        });
      } catch (error) {
        console.warn('Failed to clear assignments:', error);
      }
    }

    // Emit schedule update to all clients
    io.emit('schedule-updated', {
      date,
      employees: savedSchedule.employees,
      uploadedAt: savedSchedule.uploadedAt,
      fileName: savedSchedule.fileName,
      replaceAll: !!replaceAll
    });

    res.json({
      success: true,
      employees: savedSchedule.employees,
      uploadedAt: savedSchedule.uploadedAt,
      fileName: savedSchedule.fileName
    });
  } catch (error) {
    console.error('Error saving schedule:', error);
    res.status(500).json({ error: 'Failed to save schedule' });
  }
});

// GET /api/schedules - Get all available schedule dates
router.get('/', async (req, res) => {
  try {
    const { fileManager } = req.app.locals;
    const dates = await fileManager.listFiles('schedules');
    
    // Get metadata for each date
    const schedules = await Promise.all(
      dates.map(async (date) => {
        const schedule = await fileManager.readJSON('schedules', date);
        return {
          date,
          employeeCount: schedule?.employees?.length || 0,
          uploadedAt: schedule?.uploadedAt,
          fileName: schedule?.fileName,
          lastUpdated: schedule?.lastUpdated
        };
      })
    );

    // Sort by date descending
    schedules.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(schedules);
  } catch (error) {
    console.error('Error getting schedules list:', error);
    res.status(500).json({ error: 'Failed to get schedules list' });
  }
});

// DELETE /api/schedules/:date - Delete schedule for a specific date
router.delete('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { fileManager, io } = req.app.locals;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Note: In a file-based system, we'd need to delete the file
    // For now, we'll just clear the employees array but keep the file structure
    await fileManager.writeJSON('schedules', date, { employees: [], deletedAt: new Date().toISOString() });

    // Emit schedule deletion to all clients
    io.emit('schedule-deleted', { date });

    res.json({ success: true, message: `Schedule for ${date} deleted` });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

module.exports = router;
