# 🔒 SafeRoute: AI-Powered Urban Safety Map

A full-stack web application that allows users to report safety-related incidents and visualizes them on an interactive map. The app uses Hugging Face's AI models to automatically categorize incidents and displays danger zones through clustering and heatmaps.

> ✨ **NEW FEATURES**: 
> - 📱 **SMS & Voice Reporting** - Report incidents via text message or voice recording for accessibility! [Learn more →](./SMS_VOICE_FEATURE_DOCS.md)
> - ⏰ **Time-Based Analysis** - Filter incidents by time of day to plan safer routes. [Learn more →](./TIME_FEATURE_DOCS.md)

## ✨ Features

- 📍 **Interactive Incident Reporting**: Click on the map to report safety incidents
- 🤖 **AI-Powered Categorization**: Automatic incident classification using Hugging Face NLP models
- 🗺️ **Smart Visualization**: Color-coded markers, clustering, and heatmap overlay
- ⏰ **Time-Based Analysis**: Filter incidents by time of day (morning, afternoon, evening, night)
- 📊 **Real-time Statistics**: Track incidents by category and time period
- 🎯 **Hotspot Detection**: Visual identification of unsafe zones
- 🌙 **Safety Planning**: See when incidents occur to plan safer routes
- 💾 **JSON Storage**: Simple file-based data persistence

## 🎨 Incident Categories

- 🚨 **Harassment**: Intimidation or threatening behavior
- ⚠️ **Assault**: Physical violence or attacks
- 💡 **Lighting Issue**: Poor visibility or lighting problems
- 👁️ **Suspicious Behavior**: Concerning activities
- ❓ **Other**: General safety concerns

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Leaflet.js** - Interactive maps
- **React-Leaflet** - React bindings for Leaflet
- **Leaflet.markercluster** - Marker clustering
- **Leaflet.heat** - Heatmap visualization
- **OpenStreetMap** - Free map tiles

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Hugging Face Inference API** - AI text classification
- **JSON file storage** - Simple data persistence

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Hugging Face API key (free)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
cd c:\Projects\hackru2025
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
copy .env.example .env

# Edit .env and add your Hugging Face API key
# Get a free API key from: https://huggingface.co/settings/tokens
```

**backend/.env**:
```
HUGGINGFACE_API_KEY=your_actual_api_key_here
PORT=5000
```

### 3. Frontend Setup

```bash
cd ..\frontend

# Install dependencies
npm install

# Create .env file
copy .env.example .env
```

**frontend/.env**:
```
REACT_APP_API_URL=http://localhost:5000/api
```

## ▶️ Running the Application

### Start Backend (in backend folder)

```bash
cd backend
npm start
```

Backend will run on `http://localhost:5000`

### Start Frontend (in frontend folder, new terminal)

```bash
cd frontend
npm start
```

Frontend will run on `http://localhost:3000`

## 📖 Usage Guide

1. **Open the app** at `http://localhost:3000`
2. **Filter by time** - Click time period buttons to see when incidents occur:
   - 🌅 Morning (6AM-12PM)
   - ☀️ Afternoon (12PM-5PM)
   - 🌆 Evening (5PM-9PM)
   - 🌙 Night (9PM-6AM)
3. **Click anywhere on the map** to select a location
4. **Describe the incident** in the form that appears
5. **Submit the report** - AI will automatically categorize it
6. **View the map** to see:
   - Color-coded incident markers
   - Clustered hotspots
   - Heatmap overlay showing danger zones
7. **Check statistics** to see:
   - Total incidents by category
   - Incidents by time of day
   - Most dangerous time periods

## 🔌 API Endpoints

### GET `/api/incidents?timePeriod={period}`
Retrieve all reported incidents, optionally filtered by time period

**Query Parameters:**
- `timePeriod` (optional): Filter by `morning`, `afternoon`, `evening`, `night`, or `all`

**Examples:**
- `/api/incidents` - Get all incidents
- `/api/incidents?timePeriod=night` - Get only night incidents

**Response:**
```json
[
  {
    "id": "1234567890",
    "description": "Poor street lighting",
    "category": "Lighting Issue",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "timestamp": "2025-10-04T12:00:00.000Z",
    "createdAt": "2025-10-04T12:00:00.000Z"
  }
]
```

### POST `/api/incidents`
Create a new incident report

**Request Body:**
```json
{
  "description": "Suspicious person following pedestrians",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "timestamp": "2025-10-04T12:00:00.000Z"
}
```

**Response:**
```json
{
  "id": "1234567890",
  "description": "Suspicious person following pedestrians",
  "category": "Suspicious Behavior",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "timestamp": "2025-10-04T12:00:00.000Z",
  "createdAt": "2025-10-04T12:00:00.000Z"
}
```

### GET `/api/stats`
Get incident statistics

**Response:**
```json
{
  "total": 10,
  "byCategory": {
    "Harassment": 3,
    "Assault": 2,
    "Lighting Issue": 2,
    "Suspicious Behavior": 2,
    "Other": 1
  },
  "byTimePeriod": {
    "morning": 1,
    "afternoon": 2,
    "evening": 2,
    "night": 5
  },
  "byCategoryAndTime": {
    "Harassment_night": 2,
    "Assault_afternoon": 1,
    ...
  },
  "recent": [...]
}
```

### DELETE `/api/incidents/:id`
Delete an incident by ID

### GET `/api/health`
Health check endpoint

## 🤖 AI Model Information

The app uses **facebook/bart-large-mnli** from Hugging Face for zero-shot text classification. This model:
- Analyzes incident descriptions
- Categorizes them into predefined safety categories
- Runs entirely on Hugging Face's free inference API
- No local model installation required

## 📁 Project Structure

```
hackru2025/
├── backend/
│   ├── server.js              # Express server & API routes
│   ├── package.json           # Backend dependencies
│   ├── .env.example           # Environment template
│   ├── .gitignore
│   └── data/
│       └── incidents.json     # Stored incidents (auto-created)
├── frontend/
│   ├── public/
│   │   └── index.html         # HTML template
│   ├── src/
│   │   ├── App.js             # Main app component
│   │   ├── App.css            # Global styles
│   │   ├── index.js           # React entry point
│   │   ├── index.css
│   │   └── components/
│   │       ├── Map.js         # Leaflet map with clustering & heatmap
│   │       ├── IncidentForm.js # Incident submission form
│   │       ├── Statistics.js   # Stats display with time breakdown
│   │       └── TimeFilter.js   # Time period filter buttons
│   ├── package.json           # Frontend dependencies
│   ├── .env.example
│   └── .gitignore
└── README.md                  # This file
```

## 🎨 Color Coding

- 🔴 **Red**: Harassment & Assault
- 🟠 **Orange**: Suspicious Behavior
- 🟡 **Yellow**: Lighting Issues
- ⚪ **Gray**: Other incidents

## 🔒 Privacy & Security Notes

- No user authentication required (anonymous reporting)
- Incident data stored locally in JSON file
- No personal information collected
- Coordinates are approximate location markers

## 🚀 Future Enhancements

- [ ] User authentication
- [ ] Route planning that avoids danger zones
- [x] **Time-based filtering** (✅ IMPLEMENTED - filter by time of day)
- [ ] Hour-by-hour breakdown and heatmap animation
- [ ] Day of week analysis (weekday vs weekend)
- [ ] Mobile app version
- [ ] Real-time notifications
- [ ] Photo upload capability
- [ ] Admin dashboard for incident management
- [ ] Export reports for city planners

## 🐛 Troubleshooting

### Map not loading
- Check console for errors
- Ensure Leaflet CSS is loaded
- Verify internet connection for map tiles

### AI categorization not working
- Verify Hugging Face API key is correct
- Check API quota (free tier has limits)
- Review backend console logs

### CORS errors
- Ensure backend is running on port 5000
- Check frontend .env has correct API_URL
- Verify CORS is enabled in backend

## 📄 License

MIT License - Feel free to use for your projects!

## 🤝 Contributing

Contributions welcome! This was built for HackRU 2025.

## 📧 Support

For issues or questions, please open an issue on the repository.

---

Built with ❤️ for HackRU 2025
