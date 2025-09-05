const express = require('express');
const router = express.Router();

// GET /api/dayparts/:date - Get day part preference for a specific date
router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { fileManager } = req.app.locals;
    
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const dayPartData = await fileManager.readJSON('dayparts', date);
    
    res.json({
      dayPart: dayPartData?.dayPart || 'Breakfast',
      savedAt: dayPartData?.savedAt,
      lastUpdated: dayPartData?.lastUpdated
    });
  } catch (error) {
    console.error('Error getting day part:', error);
    res.status(500).json({ error: 'Failed to get day part' });
  }
});

// POST /api/dayparts/:date - Save day part preference for a specific date
router.post('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { dayPart } = req.body;
    const { fileManager, io } = req.app.locals;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Validate day part
    if (!['Breakfast', 'Lunch'].includes(dayPart)) {
      return res.status(400).json({ error: 'Day part must be either "Breakfast" or "Lunch"' });
    }

    const dayPartData = {
      dayPart,
      savedAt: new Date().toISOString()
    };

    // Save day part preference
    const savedDayPart = await fileManager.writeJSON('dayparts', date, dayPartData);

    // Emit day part change to all clients
    io.emit('daypart-changed', {
      date,
      dayPart: savedDayPart.dayPart,
      savedAt: savedDayPart.savedAt
    });

    res.json({
      success: true,
      dayPart: savedDayPart.dayPart,
      savedAt: savedDayPart.savedAt
    });
  } catch (error) {
    console.error('Error saving day part:', error);
    res.status(500).json({ error: 'Failed to save day part' });
  }
});

// GET /api/dayparts - Get all day part preferences
router.get('/', async (req, res) => {
  try {
    const { fileManager } = req.app.locals;
    const dates = await fileManager.listFiles('dayparts');
    
    // Get day part data for each date
    const dayParts = await Promise.all(
      dates.map(async (date) => {
        const dayPartData = await fileManager.readJSON('dayparts', date);
        return {
          date,
          dayPart: dayPartData?.dayPart || 'Breakfast',
          savedAt: dayPartData?.savedAt,
          lastUpdated: dayPartData?.lastUpdated
        };
      })
    );

    // Sort by date descending
    dayParts.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(dayParts);
  } catch (error) {
    console.error('Error getting day parts:', error);
    res.status(500).json({ error: 'Failed to get day parts' });
  }
});

module.exports = router;
