import express from 'express';
import dotenv from 'dotenv';
import { initializeDatabase, searchPGs, getPGById, getPGsByIds, getPreferences, setPreferences } from './db.js';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware for local development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// PUBLIC API ENDPOINTS
// ============================================================================

/**
 * GET /api/pgs/search
 * Search PGs by location and optional budget
 * Query params: location (required), maxBudget (optional)
 */
app.get('/api/pgs/search', (req, res) => {
  try {
    const { location, maxBudget } = req.query;

    if (!location || typeof location !== 'string' || location.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'location query parameter is required'
      });
    }

    const budget = maxBudget ? parseInt(maxBudget, 10) : null;
    console.log("SEARCH DEBUG:", { location, maxBudget, budget });
    if (maxBudget && (isNaN(budget) || budget <= 0)) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'maxBudget must be a positive number'
      });
    }

    const results = searchPGs(location, budget);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to search PGs'
    });
  }
});

/**
 * GET /api/pgs/:id
 * Get details of a single PG by ID
 */
app.get('/api/pgs/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'PG ID is required'
      });
    }

    const pg = getPGById(id);

    if (!pg) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'PG not found'
      });
    }

    res.json({
      success: true,
      data: pg
    });
  } catch (error) {
    console.error('Get PG error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch PG details'
    });
  }
});

/**
 * POST /api/pgs/batch
 * Get details for multiple PGs
 * Body: { ids: [pgId1, pgId2, ...] }
 */
app.post('/api/pgs/batch', (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'ids must be a non-empty array'
      });
    }

    if (ids.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Maximum 100 PGs can be requested at once'
      });
    }

    // Validate all IDs are strings
    if (!ids.every((id) => typeof id === 'string')) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'All IDs must be strings'
      });
    }

    const results = getPGsByIds(ids);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Batch error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch PG details'
    });
  }
});

// ============================================================================
// PROTECTED API ENDPOINTS (require JWT token)
// ============================================================================

// Simple JWT verification middleware (local mock - no actual signature validation)
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Missing or invalid Authorization header'
    });
  }

  // Extract user ID from mock JWT format: "Bearer user_{sub}"
  const token = authHeader.substring(7);
  if (!token.startsWith('user_')) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Invalid token format'
    });
  }

  req.userId = token; // Store user ID in request
  next();
}

/**
 * GET /api/preferences
 * Get user preferences
 * Requires: Authorization header with Bearer token
 */
app.get('/api/preferences', authenticateJWT, (req, res) => {
  try {
    const prefs = getPreferences(req.userId);

    if (!prefs) {
      // Return default empty preferences
      return res.json({
        success: true,
        data: {
          user_id: req.userId,
          preferred_location: null,
          max_budget: null,
          required_facilities: []
        }
      });
    }

    res.json({
      success: true,
      data: prefs
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch preferences'
    });
  }
});

/**
 * PUT /api/preferences
 * Update user preferences
 * Requires: Authorization header with Bearer token
 * Body: { preferred_location, max_budget, required_facilities }
 */
app.put('/api/preferences', authenticateJWT, (req, res) => {
  try {
    const { preferred_location, max_budget, required_facilities } = req.body;

    // Validate input
    if (preferred_location !== undefined && typeof preferred_location !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'preferred_location must be a string'
      });
    }

    if (max_budget !== undefined && (typeof max_budget !== 'number' || max_budget <= 0)) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'max_budget must be a positive number'
      });
    }

    if (required_facilities !== undefined && !Array.isArray(required_facilities)) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'required_facilities must be an array'
      });
    }

    // Build preferences object
    const prefs = {
      user_id: req.userId,
      preferred_location,
      max_budget,
      required_facilities: required_facilities || []
    };

    setPreferences(req.userId, prefs);

    res.json({
      success: true,
      data: prefs
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to update preferences'
    });
  }
});

/**
 * POST /api/assistant
 * Send message to AI assistant for PG recommendations
 * Requires: Authorization header with Bearer token
 * Body: { message, pgIds (optional) }
 */
app.post('/api/assistant', authenticateJWT, (req, res) => {
  try {
    const { message } = req.body;

    // Validate message
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'message is required'
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'message must be under 2000 characters'
      });
    }

    const recommendation = generateRecommendation(message);

    res.json({
      success: true,
      data: {
        user_message: message,
        assistant_response: recommendation.reply,
        matchedPGs: recommendation.matchedPGs,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Assistant error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to process assistant request'
    });
  }
});

// ============================================================================
// LOCAL PG RECOMMENDATIONS (the deployed Amplify assistant uses Bedrock)
// ============================================================================

function generateRecommendation(userMessage) {
  const message = userMessage.toLowerCase();
  const allPGs = searchPGs('', null);
  const locations = [...new Set(allPGs.map((pg) => pg.location))];
  const location = locations.find((name) =>
    message.includes(name.toLowerCase())
  ) || (/\bjis(?:\s+university)?\b/i.test(message) ? 'Agarpara' : null);
  const budgetMatch = message.match(
    /(?:under|below|less than|up to|upto|max(?:imum)?|budget(?:\s+(?:of|is))?)\s*(?:₹|rs\.?\s*)?([\d,]+)/i
  ) || message.match(/₹\s*([\d,]+)/i);
  const maxBudget = budgetMatch
    ? Number(budgetMatch[1].replace(/,/g, ''))
    : null;
  const requestedFacilities = [
    { key: 'wifi', pattern: /\bwi[\s-]?fi\b/i },
    { key: 'food', pattern: /\bfood\b/i },
    { key: 'ac', pattern: /\bac\b/i },
    { key: 'laundry', pattern: /\blaundry\b/i },
    { key: 'gym', pattern: /\bgym\b/i },
  ]
    .filter(({ pattern }) => pattern.test(userMessage))
    .map(({ key }) => key);
  const unknownLocation = !location && /\b(?:near|around|in)\s+[a-z]/i.test(userMessage);

  let matches = allPGs.filter((pg) => {
    const hasFacilities = requestedFacilities.every((facility) =>
      pg.facilities.some((item) => item.toLowerCase() === facility)
    );
    return (
      (!location || pg.location.toLowerCase() === location.toLowerCase()) &&
      (maxBudget === null || pg.rent <= maxBudget) &&
      hasFacilities &&
      !unknownLocation
    );
  });

  if (/\b(cheapest|lowest rent|most affordable)\b/i.test(userMessage) || maxBudget !== null) {
    matches.sort((a, b) => a.rent - b.rent || b.rating - a.rating);
  } else if (/\b(closest|nearest)\b/i.test(userMessage)) {
    matches.sort((a, b) => a.distance - b.distance || b.rating - a.rating);
  } else {
    matches.sort((a, b) => b.rating - a.rating || a.rent - b.rent);
  }

  const matchedPGs = matches.slice(0, 3);
  if (matchedPGs.length === 0) {
    return {
      reply: 'I couldn’t find any PGs matching those requirements in the current listings. Try a different location, a higher budget, or fewer facility requirements.',
      matchedPGs,
    };
  }

  const criteria = [];
  if (location) criteria.push(`in ${location}`);
  if (maxBudget !== null) criteria.push(`under ₹${maxBudget.toLocaleString('en-IN')}/month`);
  if (requestedFacilities.length) criteria.push(`with ${requestedFacilities.join(', ')}`);
  const intro = criteria.length
    ? `I found these PGs ${criteria.join(' ')}:`
    : 'Here are some highly rated PGs from the available listings:';
  const details = matchedPGs.map(
    (pg) => `${pg.name} (${pg.location}) — ₹${pg.rent}/month, ${pg.rating}★, ${pg.distance} km away.`
  );

  return {
    reply: `${intro}\n${details.join('\n')}`,
    matchedPGs,
  };
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred'
  });
});

// ============================================================================
// SERVER START
// ============================================================================

async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`\n✅ PGMate local backend server running on http://localhost:${PORT}`);
      console.log(`📡 API endpoints:`);
      console.log(`   GET  /api/pgs/search?location=...&maxBudget=...`);
      console.log(`   GET  /api/pgs/:id`);
      console.log(`   POST /api/pgs/batch`);
      console.log(`   GET  /api/preferences (auth)`);
      console.log(`   PUT  /api/preferences (auth)`);
      console.log(`   POST /api/assistant (auth)`);
      console.log(`📁 Database: ${process.cwd()}/server/pgmate.db (SQLite via sql.js)\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
