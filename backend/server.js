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

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false })); // For Twilio webhook

// Initialize Twilio client (optional, only if credentials exist)
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

// Helper function to get time period from timestamp
const getTimePeriod = (timestamp) => {
  const date = new Date(timestamp);
  const hour = date.getHours();
  
  if (hour >= 6 && hour < 12) return 'morning';      // 6 AM - 12 PM
  if (hour >= 12 && hour < 17) return 'afternoon';   // 12 PM - 5 PM
  if (hour >= 17 && hour < 21) return 'evening';     // 5 PM - 9 PM
  return 'night';                                     // 9 PM - 6 AM
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

// AI-powered incident categorization
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

    // Categorize incident using AI
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

// Helper function to parse location from SMS text
const parseLocation = (text) => {
  // Look for coordinates in format: "lat: XX.XX, lng: YY.YY" or "40.7128, -74.0060"
  const coordPattern = /(?:lat:?\s*)?(-?\d+\.?\d*)[,\s]+(?:lng:?\s*)?(-?\d+\.?\d*)/i;
  const match = text.match(coordPattern);
  
  if (match) {
    return {
      latitude: parseFloat(match[1]),
      longitude: parseFloat(match[2])
    };
  }
  
  // Default to NYC coordinates if no location provided
  return {
    latitude: 40.7128,
    longitude: -74.0060
  };
};

// SMS Webhook endpoint - receives SMS from Twilio
app.post('/api/sms-report', async (req, res) => {
  try {
    const { Body, From } = req.body;
    
    console.log('📱 SMS received from:', From);
    console.log('📝 Message:', Body);
    
    if (!Body) {
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message('Please send a description of the safety incident.');
      res.type('text/xml').send(twiml.toString());
      return;
    }
    
    // Parse location from SMS (if provided)
    const location = parseLocation(Body);
    
    // Remove location coordinates from description if present
    const description = Body.replace(/(?:lat:?\s*)?-?\d+\.?\d*[,\s]+(?:lng:?\s*)?-?\d+\.?\d*/i, '').trim();
    
    // Categorize incident using AI
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
      reporterPhone: From
    };
    
    // Save incident
    const incidents = readIncidents();
    incidents.push(newIncident);
    writeIncidents(incidents);
    
    console.log('✅ SMS incident created:', newIncident.id);
    
    // Send confirmation SMS
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(`Thank you! Your ${category} report has been recorded. Stay safe! 🔒`);
    res.type('text/xml').send(twiml.toString());
    
  } catch (error) {
    console.error('Error processing SMS:', error);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('Sorry, there was an error processing your report. Please try again.');
    res.type('text/xml').send(twiml.toString());
  }
});

// Voice transcription endpoint - receives transcribed text from frontend
app.post('/api/voice-report', async (req, res) => {
  try {
    const { transcription, latitude, longitude } = req.body;
    
    console.log('🎤 Voice report received');
    console.log('📝 Transcription:', transcription);
    
    if (!transcription || !latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Missing required fields: transcription, latitude, longitude' 
      });
    }
    
    // Categorize incident using AI
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
    
    console.log('✅ Voice incident created:', newIncident.id);
    
    res.status(201).json(newIncident);
    
  } catch (error) {
    console.error('Error processing voice report:', error);
    res.status(500).json({ error: 'Failed to process voice report' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  const twilioConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    features: {
      ai: !!process.env.HUGGINGFACE_API_KEY,
      sms: twilioConfigured,
      voice: true // Browser-based, always available
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SafeRoute backend running on port ${PORT}`);
  console.log(`📍 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`📱 SMS webhook: POST ${PORT}/api/sms-report`);
  console.log(`🎤 Voice endpoint: POST ${PORT}/api/voice-report`);
});
