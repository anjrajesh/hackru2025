import React from 'react';

function TimeFilter({ selectedPeriod, onPeriodChange }) {
  const periods = [
    { value: 'all', label: 'All Times' },
    { value: 'morning', label: 'Morning', time: '6AM-12PM' },
    { value: 'afternoon', label: 'Afternoon', time: '12PM-5PM' },
    { value: 'evening', label: 'Evening', time: '5PM-9PM' },
    { value: 'night', label: 'Night', time: '9PM-6AM' }
  ];

  return (
    <div className="time-filter">
      <h3>Time Filter</h3>
      <p className="filter-description">
        View incidents by time of day
      </p>
      
      <div className="time-buttons">
        {periods.map(period => (
          <button
            key={period.value}
            className={`time-button ${selectedPeriod === period.value ? 'active' : ''}`}
            onClick={() => onPeriodChange(period.value)}
            title={period.time ? `${period.label} (${period.time})` : period.label}
          >
            <span className="time-label">{period.label}</span>
            {period.time && <span style={{ fontSize: '0.75rem', color: 'inherit', opacity: 0.7 }}>{period.time}</span>}
          </button>
        ))}
      </div>

      {selectedPeriod !== 'all' && (
        <div className="filter-active-notice">
          <span>Showing {selectedPeriod} incidents only</span>
        </div>
      )}
    </div>
  );
}

export default TimeFilter;
