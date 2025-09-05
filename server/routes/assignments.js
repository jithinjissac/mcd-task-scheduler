const express = require('express');
const router = express.Router();

// GET /api/assignments/:date - Get assignments for a specific date
router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { fileManager } = req.app.locals;
    
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const assignmentData = await fileManager.readJSON('assignments', date);
    
    res.json({
      assignments: assignmentData?.assignments || {},
      savedAt: assignmentData?.savedAt,
      dayPart: assignmentData?.dayPart,
      lastUpdated: assignmentData?.lastUpdated
    });
  } catch (error) {
    console.error('Error getting assignments:', error);
    res.status(500).json({ error: 'Failed to get assignments' });
  }
});

// POST /api/assignments/:date - Save assignments for a specific date
router.post('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { assignments, dayPart } = req.body;
    const { fileManager, io } = req.app.locals;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Validate assignments structure
    if (typeof assignments !== 'object') {
      return res.status(400).json({ error: 'Assignments must be an object' });
    }

    const assignmentData = {
      assignments,
      savedAt: new Date().toISOString(),
      dayPart: dayPart || 'Breakfast'
    };

    // Save assignments
    const savedAssignments = await fileManager.writeJSON('assignments', date, assignmentData);

    // Emit assignment update to all clients
    io.emit('assignments-updated', {
      date,
      assignments: savedAssignments.assignments,
      dayPart: savedAssignments.dayPart,
      savedAt: savedAssignments.savedAt
    });

    res.json({
      success: true,
      assignments: savedAssignments.assignments,
      dayPart: savedAssignments.dayPart,
      savedAt: savedAssignments.savedAt
    });
  } catch (error) {
    console.error('Error saving assignments:', error);
    res.status(500).json({ error: 'Failed to save assignments' });
  }
});

// POST /api/assignments/:date/assign - Assign employee to station
router.post('/:date/assign', async (req, res) => {
  try {
    const { date } = req.params;
    const { employeeName, tableId, columnName, dayPart } = req.body;
    const { fileManager, io } = req.app.locals;
    
    // Validate required fields
    if (!employeeName || !tableId || !columnName || !dayPart) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get current assignments
    const assignmentData = await fileManager.readJSON('assignments', date) || { assignments: {} };
    const assignments = assignmentData.assignments || {};

    // Initialize structure if needed
    if (!assignments[dayPart]) assignments[dayPart] = {};
    if (!assignments[dayPart][tableId]) assignments[dayPart][tableId] = {};
    if (!assignments[dayPart][tableId][columnName]) assignments[dayPart][tableId][columnName] = [];

    // Add employee if not already assigned to this position
    const currentAssignments = assignments[dayPart][tableId][columnName];
    if (!currentAssignments.includes(employeeName)) {
      assignments[dayPart][tableId][columnName] = [...currentAssignments, employeeName];
    }

    // Save updated assignments
    const updatedData = {
      assignments,
      savedAt: new Date().toISOString(),
      dayPart
    };

    const savedAssignments = await fileManager.writeJSON('assignments', date, updatedData);

    // Emit real-time update
    io.emit('employee-assigned', {
      date,
      employeeName,
      tableId,
      columnName,
      dayPart,
      assignments: savedAssignments.assignments
    });

    res.json({
      success: true,
      assignments: savedAssignments.assignments,
      message: `${employeeName} assigned to ${tableId} - ${columnName}`
    });
  } catch (error) {
    console.error('Error assigning employee:', error);
    res.status(500).json({ error: 'Failed to assign employee' });
  }
});

// POST /api/assignments/:date/remove - Remove employee from station
router.post('/:date/remove', async (req, res) => {
  try {
    const { date } = req.params;
    const { employeeName, tableId, columnName, dayPart } = req.body;
    const { fileManager, io } = req.app.locals;
    
    // Validate required fields
    if (!employeeName || !tableId || !columnName || !dayPart) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get current assignments
    const assignmentData = await fileManager.readJSON('assignments', date);
    if (!assignmentData || !assignmentData.assignments) {
      return res.status(404).json({ error: 'No assignments found' });
    }

    const assignments = assignmentData.assignments;

    // Remove employee from assignment
    if (assignments[dayPart]?.[tableId]?.[columnName]) {
      assignments[dayPart][tableId][columnName] = 
        assignments[dayPart][tableId][columnName].filter(name => name !== employeeName);
    }

    // Save updated assignments
    const updatedData = {
      assignments,
      savedAt: new Date().toISOString(),
      dayPart
    };

    const savedAssignments = await fileManager.writeJSON('assignments', date, updatedData);

    // Emit real-time update
    io.emit('employee-removed', {
      date,
      employeeName,
      tableId,
      columnName,
      dayPart,
      assignments: savedAssignments.assignments
    });

    res.json({
      success: true,
      assignments: savedAssignments.assignments,
      message: `${employeeName} removed from ${tableId} - ${columnName}`
    });
  } catch (error) {
    console.error('Error removing employee:', error);
    res.status(500).json({ error: 'Failed to remove employee' });
  }
});

// GET /api/assignments - Get all assignment dates
router.get('/', async (req, res) => {
  try {
    const { fileManager } = req.app.locals;
    const dates = await fileManager.listFiles('assignments');
    
    // Get metadata for each date
    const assignmentDates = await Promise.all(
      dates.map(async (date) => {
        const assignmentData = await fileManager.readJSON('assignments', date);
        const assignments = assignmentData?.assignments || {};
        
        // Count total assignments
        let totalAssignments = 0;
        Object.values(assignments).forEach(dayPartAssignments => {
          Object.values(dayPartAssignments).forEach(tableAssignments => {
            Object.values(tableAssignments).forEach(columnAssignments => {
              if (Array.isArray(columnAssignments)) {
                totalAssignments += columnAssignments.length;
              }
            });
          });
        });

        return {
          date,
          totalAssignments,
          dayPart: assignmentData?.dayPart,
          savedAt: assignmentData?.savedAt,
          lastUpdated: assignmentData?.lastUpdated
        };
      })
    );

    // Sort by date descending
    assignmentDates.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(assignmentDates);
  } catch (error) {
    console.error('Error getting assignment dates:', error);
    res.status(500).json({ error: 'Failed to get assignment dates' });
  }
});

module.exports = router;
