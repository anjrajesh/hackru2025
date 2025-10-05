import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import IncidentForm from './components/IncidentForm';
import Statistics from './components/Statistics';
import TimeFilter from './components/TimeFilter';
import VoiceReporter from './components/VoiceReporter';
import SMSInfo from './components/SMSInfo';
import './App.css';

function App() {
  const [incidents, setIncidents] = useState([]);
  const [allIncidents, setAllIncidents] = useState([]); // store all incidents for stats
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showVoiceReporter, setShowVoiceReporter] = useState(false);
  const [showSMSInfo, setShowSMSInfo] = useState(false);
  const [reportingMethod, setReportingMethod] = useState('manual'); 
  const [loading, setLoading] = useState(true);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('all');
  const [stats, setStats] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch incidents for a certain time period
  useEffect(() => {
    fetchIncidents();
    fetchStats();
  }, [selectedTimePeriod]);

  const fetchIncidents = async () => {
    try {
      const url = selectedTimePeriod === 'all' 
        ? `${API_URL}/incidents`
        : `${API_URL}/incidents?timePeriod=${selectedTimePeriod}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setIncidents(data);
      
      // Fetching all incidents 
      if (selectedTimePeriod !== 'all') {
        const allResponse = await fetch(`${API_URL}/incidents`);
        const allData = await allResponse.json();
        setAllIncidents(allData);
      } else {
        setAllIncidents(data);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleMapClick = (lat, lng) => {
    setSelectedLocation({ lat, lng });
    
    if (reportingMethod === 'voice') {
      setShowVoiceReporter(true);
    } else {
      setShowForm(true);
    }
  };

  const handleIncidentSubmit = async (incidentData) => {
    try {
      const response = await fetch(`${API_URL}/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incidentData),
      });

      if (response.ok) {
        const newIncident = await response.json();
        // Refresh incidents
        fetchIncidents();
        fetchStats();
        setShowForm(false);
        setSelectedLocation(null);
      } else {
        alert('Failed to submit incident');
      }
    } catch (error) {
      console.error('Error submitting incident:', error);
      alert('Error submitting incident');
    }
  };

  const handleVoiceSubmit = async (voiceData) => {
    try {
      const response = await fetch(`${API_URL}/voice-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voiceData),
      });

      if (response.ok) {
        const newIncident = await response.json();
        // Refresh incidents
        fetchIncidents();
        fetchStats();
        setShowVoiceReporter(false);
        setSelectedLocation(null);
        alert('Voice report submitted successfully! 🎤');
      } else {
        throw new Error('Failed to submit voice report');
      }
    } catch (error) {
      console.error('Error submitting voice report:', error);
      throw error;
    }
  };

  const handleTimePeriodChange = (period) => {
    setSelectedTimePeriod(period);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setShowVoiceReporter(false);
    setSelectedLocation(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>WDR</h1>
        <p>Walk, Detect, Report</p>
      </header>

      <div className="App-content">
        <div className="sidebar">
          <div className="reporting-method">
            <h3>Reporting Method</h3>
            <div className="method-buttons">
              <button
                className={`method-btn ${reportingMethod === 'manual' ? 'active' : ''}`}
                onClick={() => setReportingMethod('manual')}
              >
                ✍️ Manual
              </button>
              <button
                className={`method-btn ${reportingMethod === 'voice' ? 'active' : ''}`}
                onClick={() => setReportingMethod('voice')}
              >
                🎤 Voice
              </button>
              <button
                className="method-btn sms-btn"
                onClick={() => setShowSMSInfo(!showSMSInfo)}
              >
                📱 SMS Info
              </button>
            </div>
            {reportingMethod === 'voice' && (
              <p className="method-hint">
                Click on map, then speak to record
              </p>
            )}
            {reportingMethod === 'manual' && (
              <p className="method-hint">
                Click on map, then type description
              </p>
            )}
          </div>

          {showSMSInfo && <SMSInfo />}

          <TimeFilter 
            selectedPeriod={selectedTimePeriod}
            onPeriodChange={handleTimePeriodChange}
          />
          
          <Statistics incidents={allIncidents} stats={stats} />
          
          <div className="instructions">
            <h3>How to Use</h3>
            <ol>
              <li>Choose reporting method (Manual, Voice, or SMS)</li>
              <li>Filter by time to see when incidents occur</li>
              <li>Click on the map to select a location</li>
              <li>Describe the safety incident</li>
              <li>AI will automatically categorize it</li>
              <li>View reports and hotspots on the map</li>
            </ol>
          </div>

          <div className="legend">
            <h3>Incident Key</h3>
            <div className="legend-item">
              <span className="legend-color harassment"></span>
              <span>Harassment</span>
            </div>
            <div className="legend-item">
              <span className="legend-color assault"></span>
              <span>Assault</span>
            </div>
            <div className="legend-item">
              <span className="legend-color lighting"></span>
              <span>Lighting Issue</span>
            </div>
            <div className="legend-item">
              <span className="legend-color suspicious"></span>
              <span>Suspicious Behavior</span>
            </div>
            <div className="legend-item">
              <span className="legend-color other"></span>
              <span>Other</span>
            </div>
          </div>
        </div>

        <div className="map-container">
          {loading ? (
            <div className="loading">Loading incidents...</div>
          ) : (
            <Map
              incidents={incidents}
              onMapClick={handleMapClick}
              selectedLocation={selectedLocation}
            />
          )}
        </div>
      </div>

      {showForm && selectedLocation && (
        <IncidentForm
          location={selectedLocation}
          onSubmit={handleIncidentSubmit}
          onClose={handleCloseForm}
        />
      )}

      {showVoiceReporter && selectedLocation && (
        <VoiceReporter
          location={selectedLocation}
          onSubmit={handleVoiceSubmit}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}

export default App;
