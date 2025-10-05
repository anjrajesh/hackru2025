import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { HfInference } from '@huggingface/inference';
import twilio from 'twilio';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false })); 

// Initialize Twilio client
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Data file path
const dataFilePath = path.join(__dirname, 'data', 'incidents.json');

// Ensure data directory and file exist
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(dataFilePath)) {
  fs.writeFileSync(dataFilePath, JSON.stringify([], null, 2));
}

// Helper function to read incidents
const readIncidents = () => {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading incidents:', error);
    return [];
  }
};

// Helper function to write incidents
const writeIncidents = (incidents) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(incidents, null, 2));
  } catch (error) {
    console.error('Error writing incidents:', error);
  }
};

const getTimePeriod = (timestamp) => {
  const date = new Date(timestamp);
  const hour = date.getHours();
  
  if (hour >= 6 && hour < 12) return 'morning';  
  if (hour >= 12 && hour < 17) return 'afternoon';   
  if (hour >= 17 && hour < 21) return 'evening';     
  return 'night';                                    
};

// Helper function to filter incidents by time period
const filterByTimePeriod = (incidents, period) => {
  if (!period || period === 'all') return incidents;
  
  return incidents.filter(incident => {
    const incidentPeriod = getTimePeriod(incident.timestamp);
    return incidentPeriod === period;
  });
};

// Category mapping for AI classification
const categoryMapping = {
  'harassment': 'Harassment',
  'assault': 'Assault',
  'lighting': 'Lighting Issue',
  'suspicious': 'Suspicious Behavior',
  'other': 'Other'
};

// Incident categorization
const categorizeIncident = async (description) => {
  try {
    console.log('Categorizing description:', description);
    
    // Using zero-shot classification model
    const result = await hf.zeroShotClassification({
      model: 'facebook/bart-large-mnli',
      inputs: description,
      parameters: {
        candidate_labels: [
          'harassment or intimidation',
          'assault or violence',
          'poor lighting or visibility issue',
          'suspicious behavior or activity',
          'other safety concern'
        ]
      }
    });

    console.log('AI Classification result:', result);

    // Handle both response formats (array or object)
    const classification = Array.isArray(result) ? result[0] : result;
    
    // Map the top label to our category
    const topLabel = classification.labels[0].toLowerCase();
    console.log('Top label:', topLabel);
    
    if (topLabel.includes('harassment') || topLabel.includes('intimidation')) {
      return 'Harassment';
    }
    if (topLabel.includes('assault') || topLabel.includes('violence')) {
      return 'Assault';
    }
    if (topLabel.includes('lighting') || topLabel.includes('visibility')) {
      return 'Lighting Issue';
    }
    if (topLabel.includes('suspicious') || topLabel.includes('behavior')) {
      return 'Suspicious Behavior';
    }
    return 'Other';
  } catch (error) {
    console.error('Error categorizing incident:', error.message);
    console.error('Full error:', error);
    
    // Fallback: simple keyword matching
    const desc = description.toLowerCase();
    if (desc.includes('harass') || desc.includes('intimidat') || desc.includes('threaten')) {
      return 'Harassment';
    }
    if (desc.includes('assault') || desc.includes('attack') || desc.includes('hit') || desc.includes('fight')) {
      return 'Assault';
    }
    if (desc.includes('light') || desc.includes('dark') || desc.includes('visibility')) {
      return 'Lighting Issue';
    }
    if (desc.includes('suspicious') || desc.includes('strange') || desc.includes('weird')) {
      return 'Suspicious Behavior';
    }
    return 'Other';
  }
};

// Routes

// GET all incidents with optional time filtering
app.get('/api/incidents', (req, res) => {
  try {
    const { timePeriod } = req.query;
    let incidents = readIncidents();
    
    // Filter by time period if specified
    if (timePeriod) {
      incidents = filterByTimePeriod(incidents, timePeriod);
    }
    
    res.json(incidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// POST new incident
app.post('/api/incidents', async (req, res) => {
  try {
    const { description, latitude, longitude, timestamp } = req.body;

    // Validate input
    if (!description || !latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Missing required fields: description, latitude, longitude' 
      });
    }

    // Categorize incident
    const category = await categorizeIncident(description);

    // Create new incident
    const newIncident = {
      id: Date.now().toString(),
      description,
      category,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // Save to file
    const incidents = readIncidents();
    incidents.push(newIncident);
    writeIncidents(incidents);

    res.status(201).json(newIncident);
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

// DELETE incident by ID
app.delete('/api/incidents/:id', (req, res) => {
  try {
    const { id } = req.params;
    let incidents = readIncidents();
    
    const initialLength = incidents.length;
    incidents = incidents.filter(incident => incident.id !== id);
    
    if (incidents.length === initialLength) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    writeIncidents(incidents);
    res.json({ message: 'Incident deleted successfully' });
  } catch (error) {
    console.error('Error deleting incident:', error);
    res.status(500).json({ error: 'Failed to delete incident' });
  }
});

// GET incident statistics
app.get('/api/stats', (req, res) => {
  try {
    const incidents = readIncidents();
    
    const stats = {
      total: incidents.length,
      byCategory: {},
      byTimePeriod: {
        morning: 0,
        afternoon: 0,
        evening: 0,
        night: 0
      },
      byCategoryAndTime: {},
      recent: incidents.slice(-10).reverse()
    };

    incidents.forEach(incident => {
      // Count by category
      stats.byCategory[incident.category] = (stats.byCategory[incident.category] || 0) + 1;
      
      // Count by time period
      const timePeriod = getTimePeriod(incident.timestamp);
      stats.byTimePeriod[timePeriod]++;
      
      // Count by category and time period
      const key = `${incident.category}_${timePeriod}`;
      stats.byCategoryAndTime[key] = (stats.byCategoryAndTime[key] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Rutgers locations with coordinates
const knownLocations = {
  // Student Centers / common hubs
  'college avenue student center': { lat: 40.503000, lon: -74.451900 }, 
  'student center': { lat: 40.503000, lon: -74.451900 }, 
  'brower commons': { lat: 40.503360, lon: -74.451920 }, 
  'busch student center': { lat: 40.521900, lon: -74.459100 }, 
  'rutgers student center': { lat: 40.503000, lon: -74.451900 }, 
  'red oak lane': { lat: 40.522800, lon: -74.438800 }, 
  'livingston student center': { lat: 40.523700, lon: -74.436200 }, 
  'livi': { lat: 40.523700, lon: -74.436200 }, 

  // Libraries
  'alexander library': { lat: 40.504649, lon: -74.452597 },
  'library': { lat: 40.504649, lon: -74.452597 },
  'carr library': { lat: 40.523670, lon: -74.436190 },
  'kilmer library': { lat: 40.523670, lon: -74.436190 },

  // Academic buildings
  'scott hall': { lat: 40.502950, lon: -74.451000 },
  'college hall': { lat: 40.499200, lon: -74.446000 },
  'murray hall': { lat: 40.500100, lon: -74.447800 },
  'van nest hall': { lat: 40.500300, lon: -74.449300 },
  'bishop house': { lat: 40.499700, lon: -74.448200 },
  'hill center': { lat: 40.520800, lon: -74.459100 },
  'arc': { lat: 40.523700, lon: -74.436200 },
  'allison road classroom': { lat: 40.523700, lon: -74.436200 },
  'bsa building': { lat: 40.523700, lon: -74.436200 },

  // Campuses
  'livingston campus': { lat: 40.523700, lon: -74.436200 },
  'busch campus': { lat: 40.521900, lon: -74.459100 },
  'college avenue': { lat: 40.500700, lon: -74.447400 },
  'college ave': { lat: 40.500700, lon: -74.447400 },
  'cook campus': { lat: 40.480400, lon: -74.436400 },
  'douglass campus': { lat: 40.486100, lon: -74.436400 },
  'cook/douglass': { lat: 40.483300, lon: -74.436400 },

  // Streets - New Brunswick
  'george street': { lat: 40.498700, lon: -74.447600 },
  'easton avenue': { lat: 40.496000, lon: -74.444500 },
  'somerset street': { lat: 40.496800, lon: -74.445300 },
  'hamilton street': { lat: 40.489000, lon: -74.443700 },
  'commercial avenue': { lat: 40.493200, lon: -74.451400 },
  'bartlett street': { lat: 40.498100, lon: -74.450100 },
  'mine street': { lat: 40.501600, lon: -74.445300 },
  'senior street': { lat: 40.501900, lon: -74.447500 },

  // Streets - Piscataway / Busch area
  'river road': { lat: 40.521900, lon: -74.459100 },
  'frelinghuysen road': { lat: 40.524700, lon: -74.438500 },
  'hoes lane': { lat: 40.515800, lon: -74.463900 },
  'bartholomew road': { lat: 40.519900, lon: -74.428900 },
  
  // Transit
  'train station': { lat: 40.496840, lon: -74.446190 },
  'new brunswick train station': { lat: 40.496840, lon: -74.446190 },
  'nb train station': { lat: 40.496840, lon: -74.446190 },
  'bus stop': { lat: 40.501900, lon: -74.450500 },

  // Housing / residence areas
  'yard': { lat: 40.524200, lon: -74.437400 },
  'livi apartments': { lat: 40.524200, lon: -74.437400 },
  'buell apartments': { lat: 40.522500, lon: -74.463100 },
  'silvers apartments': { lat: 40.522500, lon: -74.463100 },
  'easton avenue apartments': { lat: 40.496000, lon: -74.444500 },

  // Recreation
  'werblin': { lat: 40.522800, lon: -74.439100 },
  'werblin rec center': { lat: 40.522800, lon: -74.439100 },
  'sonny werblin': { lat: 40.522800, lon: -74.439100 },
  'college avenue gym': { lat: 40.503089, lon: -74.452094 },
  'wellness center': { lat: 40.522800, lon: -74.439100 },

  // Dining
  'brower': { lat: 40.503360, lon: -74.451920 },
  'busch dining hall': { lat: 40.523700, lon: -74.436200 },
  'neilson': { lat: 40.523700, lon: -74.436200 },
  'sbarro': { lat: 40.502500, lon: -74.451700 },

  // Parking Lots
  'yellow lot': { lat: 40.523700, lon: -74.436200 },
  'red lot': { lat: 40.523700, lon: -74.436200 },
  'green lot': { lat: 40.523700, lon: -74.436200 },
  'blue lot': { lat: 40.523700, lon: -74.436200 },
  'lot 8': { lat: 40.501900, lon: -74.450500 },
  'parking lot': { lat: 40.501900, lon: -74.450500 },
  'parking deck': { lat: 40.500700, lon: -74.447400 },
  'college ave parking deck': { lat: 40.500700, lon: -74.447400 }
};

// Helper function to check known locations first
const checkKnownLocation = (text) => {
  const normalizedText = text.toLowerCase().trim();
  
  for (const [locationName, coords] of Object.entries(knownLocations)) {
    if (normalizedText.includes(locationName)) {
      console.log(`Found known location: ${locationName}`);
      return {
        latitude: coords.lat,
        longitude: coords.lon,
        locationName: locationName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      };
    }
  }
  
  return null;
};

// Check if coordinates are within Rutgers/New Brunswick/Piscataway area
const isWithinLocalArea = (lat, lon) => {
  // Bounding box for Rutgers/New Brunswick/Piscataway area
  const bounds = {
    minLat: 40.47,  
    maxLat: 40.53,  
    minLon: -74.48, 
    maxLon: -74.42  
  };
  
  return lat >= bounds.minLat && lat <= bounds.maxLat && 
         lon >= bounds.minLon && lon <= bounds.maxLon;
};

const geocodeLocation = async (locationText) => {
  try {
    const knownLocation = checkKnownLocation(locationText);
    if (knownLocation) {
      return knownLocation;
    }
    
  
    const viewbox = '-74.48,40.47,-74.42,40.53'; 
    
    const searchQueries = [
      `${locationText}, New Brunswick, NJ`,
      `${locationText}, Piscataway, NJ`, 
      `${locationText}, Rutgers University, New Brunswick, NJ`, 
      locationText, 
    ];
    
    // Remove duplicates
    const uniqueQueries = [...new Set(searchQueries)];
    
    for (const searchQuery of uniqueQueries) {
      console.log('Geocoding location:', searchQuery);
      
      // Add bounded and viewbox parameters to restrict search area
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&bounded=1&viewbox=${viewbox}`,
        {
          headers: {
            'User-Agent': 'WDR-Safety-App/1.0'
          }
        }
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        // Check if any result is within our local area
        for (const result of data) {
          const lat = parseFloat(result.lat);
          const lon = parseFloat(result.lon);
          
          if (isWithinLocalArea(lat, lon)) {
            console.log('Geocoding successful (within local area):', result.display_name);
            return {
              latitude: lat,
              longitude: lon,
              locationName: result.display_name
            };
          }
        }
        console.log('Geocoding results found but outside local area');
      }
      
      // Small delay between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('Geocoding failed - no results found in New Brunswick/Piscataway area');
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// Helper function to extract location from SMS text
const extractLocationFromText = (text) => {
  // Common location indicators
  const patterns = [
    /(?:at|near|on|in|by)\s+([^,.!?]+?)(?:\s+in\s+new\s+brunswick)?(?:[,.!?]|$)/gi,
    /location:?\s*([^,.!?]+)/gi,
  ];
  
  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      // Return the last match (usually most specific)
      return matches[matches.length - 1][1].trim();
    }
  }
  
  return null;
};

// Helper function to parse location from SMS text
const parseLocation = async (text) => {
  // First check for explicit coordinates
  const coordPattern = /(?:lat:?\s*)?(-?\d+\.?\d*)[,\s]+(?:lng:?\s*)?(-?\d+\.?\d*)/i;
  const match = text.match(coordPattern);
  
  if (match) {
    return {
      latitude: parseFloat(match[1]),
      longitude: parseFloat(match[2]),
      source: 'coordinates'
    };
  }
  
  // Try to extract location from text
  const locationText = extractLocationFromText(text);
  
  if (locationText) {
    console.log('Extracted location text:', locationText);
    const geocoded = await geocodeLocation(locationText);
    
    if (geocoded) {
      return {
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        locationName: geocoded.locationName,
        source: 'geocoded'
      };
    }
  }
  
  // Default to New Brunswick coordinates if no location provided
  console.log('Using default New Brunswick coordinates');
  return {
    latitude: 40.5019,
    longitude: -74.4505,
    source: 'default'
  };
};

// SMS webhook endpoint
app.post('/api/sms-report', async (req, res) => {
  try {
    const { Body, From } = req.body;
    
    console.log('SMS received from:', From);
    console.log('Message:', Body);
    
    if (!Body) {
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message('Please send a description of the safety incident.');
      res.type('text/xml').send(twiml.toString());
      return;
    }
    
    // Parse location from SMS (now async with geocoding)
    const location = await parseLocation(Body);
    
    // Remove location coordinates from description if present
    const description = Body.replace(/(?:lat:?\s*)?-?\d+\.?\d*[,\s]+(?:lng:?\s*)?-?\d+\.?\d*/i, '').trim();
    
    // Categorize incident
    const category = await categorizeIncident(description);
    
    // Create incident
    const newIncident = {
      id: Date.now().toString(),
      description: description || Body,
      category,
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      source: 'SMS',
      reporterPhone: From,
      locationSource: location.source,
      locationName: location.locationName || undefined
    };
    
    // Save incident
    const incidents = readIncidents();
    incidents.push(newIncident);
    writeIncidents(incidents);
    
    console.log('SMS incident created:', newIncident.id);
    
    // Send confirmation SMS
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(`Thank you! Your ${category} report has been recorded. Stay safe!`);
    res.type('text/xml').send(twiml.toString());
    
  } catch (error) {
    console.error('Error processing SMS:', error);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('Sorry, there was an error processing your report. Please try again.');
    res.type('text/xml').send(twiml.toString());
  }
});

// Voice transcription endpoint
app.post('/api/voice-report', async (req, res) => {
  try {
    const { transcription, latitude, longitude } = req.body;
    
    console.log('Voice report received');
    console.log('Transcription:', transcription);
    
    if (!transcription || !latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Missing required fields: transcription, latitude, longitude' 
      });
    }
    
    // Categorize incident
    const category = await categorizeIncident(transcription);
    
    // Create incident
    const newIncident = {
      id: Date.now().toString(),
      description: transcription,
      category,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      source: 'Voice'
    };
    
    // Save incident
    const incidents = readIncidents();
    incidents.push(newIncident);
    writeIncidents(incidents);
    
    console.log('Voice incident created:', newIncident.id);
    
    res.status(201).json(newIncident);
    
  } catch (error) {
    console.error('Error processing voice report:', error);
    res.status(500).json({ error: 'Failed to process voice report' });
  }
});

app.get('/api/health', (req, res) => {
  const twilioConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    features: {
      ai: !!process.env.HUGGINGFACE_API_KEY,
      sms: twilioConfigured,
      voice: true
    }
  });
});

// Initialize known locations and start server
app.listen(PORT, () => {
  console.log(`WDR backend running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
  console.log(`SMS webhook: POST ${PORT}/api/sms-report`);
  console.log(`Voice endpoint: POST ${PORT}/api/voice-report`);
  console.log(`\n✅ ${Object.keys(knownLocations).length} known locations loaded`);
  console.log('Server ready!');
});
