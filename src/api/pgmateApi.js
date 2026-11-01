/**
 * PGMate API Client
 * REST client for local development backend (Express + JSON).
 * Routes requests to http://localhost:5000 (configurable via VITE_API_URL env var).
 * 
 * This is a local-only development server with ₹0 budget constraint.
 * In production, this connects to AWS API Gateway + Lambda + DynamoDB.
 */

// API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper function to get JWT token from auth context (if available)
function getAuthToken() {
  // Try to get user from localStorage (set by AuthContext)
  const storedUser = localStorage.getItem('pgmate_user');
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      if (userData.userId) {
        return userData.userId; // Return format: user_<timestamp>
      }
    } catch {
      // Invalid stored data
    }
  }
  return null;
}

// Mock PG data (fallback for offline mode, not used when server is running)
const mockPGs = [
  {
    id: 'agarpara001',
    PK: 'PG#agarpara001',
    name: 'Green Nest PG',
    location: 'Agarpara',
    locationKey: 'agarpara',
    rent: 6500,
    distanceKm: 0.8,
    rating: 4.6,
    description: 'A cozy PG near JIS University with excellent facilities.',
    facilities: { wifi: true, food: true, ac: false, laundry: true },
    facilityKeys: new Set(['wifi', 'food', 'laundry']),
    contact: { phone: '9876543210', email: 'contact@greenest.com' },
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'agarpara002',
    PK: 'PG#agarpara002',
    name: 'Student Stay',
    location: 'Agarpara',
    locationKey: 'agarpara',
    rent: 5500,
    distanceKm: 1.2,
    rating: 4.4,
    description: 'Budget-friendly hostel with basic amenities.',
    facilities: { wifi: true, food: true, ac: false, laundry: false },
    facilityKeys: new Set(['wifi', 'food']),
    contact: { phone: '9876543211', email: 'contact@studentstay.com' },
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'agarpara003',
    PK: 'PG#agarpara003',
    name: 'Campus Residency',
    location: 'Agarpara',
    locationKey: 'agarpara',
    rent: 7500,
    distanceKm: 0.5,
    rating: 4.8,
    description: 'Premium PG with all modern amenities.',
    facilities: { wifi: true, food: true, ac: true, laundry: true },
    facilityKeys: new Set(['wifi', 'food', 'ac', 'laundry']),
    contact: { phone: '9876543212', email: 'contact@campusres.com' },
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sodepur001',
    PK: 'PG#sodepur001',
    name: 'Comfort Homes',
    location: 'Sodepur',
    locationKey: 'sodepur',
    rent: 9000,
    distanceKm: 2.4,
    rating: 4.7,
    description: 'Spacious rooms with excellent facilities.',
    facilities: { wifi: true, food: true, ac: true, laundry: true },
    facilityKeys: new Set(['wifi', 'food', 'ac', 'laundry']),
    contact: { phone: '9876543213', email: 'contact@comforthomes.com' },
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sodepur002',
    PK: 'PG#sodepur002',
    name: 'Metro View PG',
    location: 'Sodepur',
    locationKey: 'sodepur',
    rent: 8000,
    distanceKm: 1.8,
    rating: 4.5,
    description: 'Modern PG with city views.',
    facilities: { wifi: true, food: true, ac: true, laundry: false },
    facilityKeys: new Set(['wifi', 'food', 'ac']),
    contact: { phone: '9876543214', email: 'contact@metroview.com' },
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sodepur003',
    PK: 'PG#sodepur003',
    name: 'Budget Lodge',
    location: 'Sodepur',
    locationKey: 'sodepur',
    rent: 6000,
    distanceKm: 2.0,
    rating: 4.2,
    description: 'Affordable accommodation with basic services.',
    facilities: { wifi: true, food: false, ac: false, laundry: true },
    facilityKeys: new Set(['wifi', 'laundry']),
    contact: { phone: '9876543215', email: 'contact@budgetlodge.com' },
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'belgharia001',
    PK: 'PG#belgharia001',
    name: 'Green Haven',
    location: 'Belgharia',
    locationKey: 'belgharia',
    rent: 7000,
    distanceKm: 1.5,
    rating: 4.6,
    description: 'Peaceful PG in a quiet neighborhood.',
    facilities: { wifi: true, food: true, ac: false, laundry: true },
    facilityKeys: new Set(['wifi', 'food', 'laundry']),
    contact: { phone: '9876543216', email: 'contact@greenhaven.com' },
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'belgharia002',
    PK: 'PG#belgharia002',
    name: 'Urban Nest',
    location: 'Belgharia',
    locationKey: 'belgharia',
    rent: 8500,
    distanceKm: 0.9,
    rating: 4.7,
    description: 'Contemporary hostel in urban setting.',
    facilities: { wifi: true, food: true, ac: true, laundry: true },
    facilityKeys: new Set(['wifi', 'food', 'ac', 'laundry']),
    contact: { phone: '9876543217', email: 'contact@urbannest.com' },
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'belgharia003',
    PK: 'PG#belgharia003',
    name: 'Economy Stays',
    location: 'Belgharia',
    locationKey: 'belgharia',
    rent: 5200,
    distanceKm: 2.2,
    rating: 4.3,
    description: 'Economy option with decent facilities.',
    facilities: { wifi: true, food: false, ac: false, laundry: true },
    facilityKeys: new Set(['wifi', 'laundry']),
    contact: { phone: '9876543218', email: 'contact@economystays.com' },
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

/**
 * Search PGs by location and budget
 * @param {Object} params - { location?: string, budget?: number }
 * @returns {Promise<Object>} - { data: PG[], nextCursor?: string, requestId: string }
 */
/**
 * Search PGs by location and budget
 */
export const searchPG = async (params = {}) => {
  const {
    location = '',
    maxBudget,
    budget: legacyBudget
  } = params;

  // Support both maxBudget and budget
  const budgetLimit = Number(maxBudget ?? legacyBudget ?? 15000);

  try {
    const queryParams = new URLSearchParams();

    if (location) {
      queryParams.append('location', location);
    }

    queryParams.append('maxBudget', String(budgetLimit));

    const response = await fetch(
      `${API_URL}/api/pgs/search?${queryParams}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Search failed');
    }

    const data = result.data.map(pg => ({
      id: pg.id,
      PK: `PG#${pg.id}`,
      name: pg.name,
      location: pg.location,
      locationKey: pg.location.toLowerCase(),
      rent: pg.rent,
      distanceKm: pg.distance,
      rating: pg.rating,
      description: pg.description,

      facilities: {
        wifi: pg.facilities?.some(
          f => f.toLowerCase() === 'wifi'
        ) || false,

        food: pg.facilities?.some(
          f => f.toLowerCase() === 'food'
        ) || false,

        ac: pg.facilities?.some(
          f => f.toLowerCase() === 'ac'
        ) || false,

        laundry: pg.facilities?.some(
          f => f.toLowerCase() === 'laundry'
        ) || false
      },

      facilityKeys: new Set(
        (pg.facilities || []).map(f => f.toLowerCase())
      ),

      status: 'ACTIVE'
    }));

    return {
      data,
      nextCursor: undefined,
      requestId: `req_${Date.now()}`
    };

  } catch (error) {
    console.error('searchPG error:', error);

    return fallbackSearchPG({
      location,
      maxBudget: budgetLimit
    });
  }
};


// Fallback mock search (when server is unavailable)
async function fallbackSearchPG(params = {}) {
  const {
    location = '',
    maxBudget,
    budget: legacyBudget
  } = params;

  const budgetLimit = Number(maxBudget ?? legacyBudget ?? 15000);

  await new Promise(resolve => setTimeout(resolve, 300));

  const locationKey = location.toLowerCase();

  let filtered = mockPGs.filter(pg => {
    const locMatch =
      !location || pg.locationKey.includes(locationKey);

    const budgetMatch = pg.rent <= budgetLimit;

    return locMatch && budgetMatch && pg.status === 'ACTIVE';
  });

  filtered.sort((a, b) => a.rent - b.rent);

  const data = filtered.map(pg => {
    const { contact: _contact, ...rest } = pg;
    return rest;
  });

  return {
    data,
    nextCursor: undefined,
    requestId: `req_${Date.now()}`
  };
}

/**
 * Get a single PG by ID
 * @param {string} id - PG ID
 * @param {boolean} isAuthenticated - Whether user is authenticated (determines contact visibility)
 * @returns {Promise<Object>} - PG object or null
 */
export const getPG = async (id, isAuthenticated = false) => {
  try {
    const response = await fetch(`${API_URL}/api/pgs/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      return null;
    }

    const pg = result.data;

    // Map server response format
    return {
      id: pg.id,
      PK: `PG#${pg.id}`,
      name: pg.name,
      location: pg.location,
      locationKey: pg.location.toLowerCase(),
      rent: pg.rent,
      distanceKm: pg.distance,
      rating: pg.rating,
      description: pg.description,
      facilities: Array.isArray(pg.facilities)
        ? {
            wifi: pg.facilities.includes('WiFi'),
            food: pg.facilities.includes('Food'),
            ac: pg.facilities.includes('AC'),
            laundry: pg.facilities.includes('Laundry'),
          }
        : {},
      facilityKeys: new Set(
        Array.isArray(pg.facilities)
          ? pg.facilities.map(f => f.toLowerCase())
          : []
      ),
      status: 'ACTIVE',
    };
  } catch (error) {
    console.error('getPG error:', error);
    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 200));
    const pg = mockPGs.find(p => p.id === id);
    if (!pg || pg.status !== 'ACTIVE') {
      return null;
    }
    if (!isAuthenticated) {
      const { contact: _contact, ...rest } = pg;
      return rest;
    }
    return pg;
  }
};

/**
 * Batch get PGs by IDs
 * @param {string[]} ids - Array of PG IDs
 * @param {boolean} isAuthenticated - Whether user is authenticated (determines contact visibility)
 * @returns {Promise<Object>} - { data: PG[], missing: string[], requestId: string }
 */
export const batchPG = async (ids, isAuthenticated = false) => {
  if (!Array.isArray(ids) || ids.length < 1) {
    throw new Error('Invalid ids: must be a non-empty array');
  }

  try {
    const response = await fetch(`${API_URL}/api/pgs/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Batch request failed');
    }

    const data = result.data.map(pg => ({
      id: pg.id,
      PK: `PG#${pg.id}`,
      name: pg.name,
      location: pg.location,
      locationKey: pg.location.toLowerCase(),
      rent: pg.rent,
      distanceKm: pg.distance,
      rating: pg.rating,
      description: pg.description,
      facilities: Array.isArray(pg.facilities)
        ? {
            wifi: pg.facilities.includes('WiFi'),
            food: pg.facilities.includes('Food'),
            ac: pg.facilities.includes('AC'),
            laundry: pg.facilities.includes('Laundry'),
          }
        : {},
      facilityKeys: new Set(
        Array.isArray(pg.facilities)
          ? pg.facilities.map(f => f.toLowerCase())
          : []
      ),
      status: 'ACTIVE',
    }));

    // Determine missing IDs
    const returnedIds = new Set(data.map(pg => pg.id));
    const missing = ids.filter(id => !returnedIds.has(id));

    return {
      data,
      missing,
      requestId: `req_${Date.now()}`,
    };
  } catch (error) {
    console.error('batchPG error:', error);
    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 250));

    const data = [];
    const missing = [];

    ids.forEach(id => {
      const pg = mockPGs.find(p => p.id === id && p.status === 'ACTIVE');
      if (pg) {
        if (!isAuthenticated) {
          const { contact: _contact, ...rest } = pg;
          data.push(rest);
        } else {
          data.push(pg);
        }
      } else {
        missing.push(id);
      }
    });

    return {
      data,
      missing,
      requestId: `req_${Date.now()}`,
    };
  }
};

/**
 * Get user preferences
 * @returns {Promise<Object|null>} - User preferences or null if not set
 */
export const getPreferences = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      return null;
    }

    const response = await fetch(`${API_URL}/api/preferences`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      return null;
    }

    return {
      preferredLocation: result.data.preferred_location,
      maxBudget: result.data.max_budget,
      requiredFacilities: result.data.required_facilities || [],
    };
  } catch (error) {
    console.error('getPreferences error:', error);
    return null;
  }
};

/**
 * Save user preferences
 * @param {Object} prefs - { preferredLocation?: string, maxBudget?: number, requiredFacilities?: string[] }
 * @returns {Promise<Object>} - Saved preferences
 */
export const savePreferences = async (prefs) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const { preferredLocation = '', maxBudget = 15000, requiredFacilities = [] } = prefs;
    
    if (maxBudget < 1000 || maxBudget > 100000) {
      throw new Error('Budget must be between ₹1000 and ₹100000');
    }

    const response = await fetch(`${API_URL}/api/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        preferred_location: preferredLocation,
        max_budget: maxBudget,
        required_facilities: requiredFacilities,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to save preferences');
    }

    return {
      preferredLocation: result.data.preferred_location,
      maxBudget: result.data.max_budget,
      requiredFacilities: result.data.required_facilities || [],
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('savePreferences error:', error);
    // Fallback: at least validate and return
    await new Promise(resolve => setTimeout(resolve, 200));
    const { preferredLocation = '', maxBudget = 15000, requiredFacilities = [] } = prefs;
    if (maxBudget < 1000 || maxBudget > 100000) {
      throw new Error('Budget must be between ₹1000 and ₹100000');
    }
    return {
      preferredLocation,
      maxBudget,
      requiredFacilities,
      updatedAt: new Date().toISOString(),
    };
  }
};

/**
 * Ask the AI assistant
 * @param {string} message - User message
 * @param {Array} _history - Previous messages (optional, for future use)
 * @returns {Promise<Object>} - { reply: string, matchedPGs: PG[], requestId: string }
 */
export const askAssistant = async (message, history = []) => {
  if (!message || message.trim().length === 0) {
    throw new Error('Message cannot be empty');
  }

  if (message.length > 2000) {
    throw new Error('Message too long (max 2000 chars)');
  }

  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/api/assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        history: history.map(({ sender, role, text }) => ({
          role: role || (sender === 'ai' ? 'assistant' : 'user'),
          text,
        })),
      }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(
        result?.message ||
        result?.error?.message ||
        `Assistant request failed (HTTP ${response.status})`
      );
    }

    if (!result || result.success === false) {
      throw new Error(
        result?.message ||
        result?.error?.message ||
        'Assistant returned an invalid response'
      );
    }

    const reply = result.data?.reply || result.data?.assistant_response;
    if (typeof reply !== 'string' || !reply.trim()) {
      throw new Error('Assistant response did not include a reply');
    }

    const matchedPGs = (result.data.matchedPGs || []).map(pg => ({
  id: pg.id,
  PK: `PG#${pg.id}`,
  name: pg.name,
  location: pg.location,
  locationKey: pg.location.toLowerCase(),
  rent: pg.rent,
  distanceKm: pg.distance,
  rating: pg.rating,
  description: pg.description,
  facilities: {
    wifi: pg.facilities?.some(f => f.toLowerCase() === 'wifi') || false,
    food: pg.facilities?.some(f => f.toLowerCase() === 'food') || false,
    ac: pg.facilities?.some(f => f.toLowerCase() === 'ac') || false,
    laundry: pg.facilities?.some(f => f.toLowerCase() === 'laundry') || false,
  },
  facilityKeys: new Set(
    (pg.facilities || []).map(f => f.toLowerCase())
  ),
  status: 'ACTIVE',
}));

return {
  reply: result.data.assistant_response,
  matchedPGs,
  requestId: `req_${Date.now()}`,
};
  } catch (error) {
    console.error('askAssistant error:', error);
    throw error;
  }
};
