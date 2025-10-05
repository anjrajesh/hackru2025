import React from 'react';

function TimeFilter({ selectedPeriod, onPeriodChange }) {
  const periods = [
    { value: 'all', label: '🌍 All Times', icon: '🌍' },
    { value: 'morning', label: '🌅 Morning (6AM-12PM)', icon: '🌅' },
    { value: 'afternoon', label: '☀️ Afternoon (12PM-5PM)', icon: '☀️' },
    { value: 'evening', label: '🌆 Evening (5PM-9PM)', icon: '🌆' },
    { value: 'night', label: '🌙 Night (9PM-6AM)', icon: '🌙' }
  ];

  return (
    <div className="time-filter">
      <h3>⏰ Filter by Time</h3>
      <p className="filter-description">
        View when incidents occur to plan safer routes
      </p>
      
      <div className="time-buttons">
        {periods.map(period => (
          <button
            key={period.value}
            className={`time-button ${selectedPeriod === period.value ? 'active' : ''}`}
            onClick={() => onPeriodChange(period.value)}
            title={period.label}
          >
            <span className="time-icon">{period.icon}</span>
            <span className="time-label">{period.label.split(' ')[1] || 'All Times'}</span>
          </button>
        ))}
      </div>

      {selectedPeriod !== 'all' && (
        <div className="filter-active-notice">
          <span>📍 Showing only {selectedPeriod} incidents</span>
        </div>
      )}
    </div>
  );
}

export default TimeFilter;
