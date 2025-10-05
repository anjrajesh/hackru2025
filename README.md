# WDR: Walk, Detect, Report

A tool to help people Walk safely, Detect danger zones, and Report incidents. We built a full-stack web application that allows users to report safety-related incidents and visualizes them on an interactive map. 

## Features

- **Interactive Incident Reporting**: Click on the map to report safety incidents
- **SMS Reporting**: Text incidents directly to a Twilio phone number
- **Voice Reporting**: Use speech-to-text for hands-free incident reporting
- **AI-Powered Categorization**: Automatic incident classification using Hugging Face NLP models
- **Time-Based Analysis**: Filter incidents by time of day (morning, afternoon, evening, night)
- **Real-Time Visualization**: See all incidents on an interactive map
- **Safety Statistics**: View incident trends and patterns
- **JSON Storage**: Simple file-based data persistence

## Incident Categories

- **Harassment**: Intimidation or threatening behavior
- **Assault**: Physical violence or attacks
- **Lighting Issue**: Poor visibility or lighting problems
- **Suspicious Behavior**: Concerning activities
- **Other**: General safety concerns

## Tech Stack

### Frontend
React, Leaflet.js, OpenStreetMap

### Backend
Node.js, Express, Hugging Face Inference API

## Installation & Setup

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

# Edit .env and add your Hugging Face API key (https://huggingface.co/settings/tokens)
```

**backend/.env**:
```
HUGGINGFACE_API_KEY=your_api_key_here
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

## Running the Application

### Start Backend

```bash
cd backend
npm start
```

The backend will run on http://localhost:5000

### Start Frontend 

```bash
cd frontend
npm start
```