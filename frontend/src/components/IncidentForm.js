import React, { useState } from 'react';

function IncidentForm({ location, onSubmit, onClose }) {
  const [description, setDescription] = useState('');
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }

    setSubmitting(true);

    const incidentData = {
      description: description.trim(),
      latitude: location.lat,
      longitude: location.lng,
      timestamp: new Date(timestamp).toISOString()
    };

    try {
      await onSubmit(incidentData);
      setDescription('');
      setTimestamp(new Date().toISOString().slice(0, 16));
    } catch (error) {
      console.error('Error submitting:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-modal" onClick={onClose}>
      <div className="form-content" onClick={(e) => e.stopPropagation()}>
        <h2>Report Safety Incident</h2>
        
        <div className="location-info">
          📍 Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="description">
              Incident Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened... (AI will automatically categorize this)"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="timestamp">
              Date & Time
            </label>
            <input
              type="datetime-local"
              id="timestamp"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default IncidentForm;
