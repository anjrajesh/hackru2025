import React from 'react';

function Statistics({ incidents, stats }) {
  const categoryCounts = incidents.reduce((acc, incident) => {
    acc[incident.category] = (acc[incident.category] || 0) + 1;
    return acc;
  }, {});

  const total = incidents.length;

  const timePeriodCounts = incidents.reduce((acc, incident) => {
    const date = new Date(incident.timestamp);
    const hour = date.getHours();
    
    let period;
    if (hour >= 6 && hour < 12) period = 'morning';
    else if (hour >= 12 && hour < 17) period = 'afternoon';
    else if (hour >= 17 && hour < 21) period = 'evening';
    else period = 'night';
    
    acc[period] = (acc[period] || 0) + 1;
    return acc;
  }, {});

  const timeLabels = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    night: 'Night'
  };

  return (
    <div className="statistics">
      <h3>Statistics</h3>
      
      <div className="stat-section">
        <h4>Total Reports</h4>
        <div className="stat-item">
          <span className="stat-label">All Incidents</span>
          <span className="stat-value">{total}</span>
        </div>
      </div>

      {Object.keys(categoryCounts).length > 0 && (
        <div className="stat-section">
          <h4>By Category</h4>
          {Object.entries(categoryCounts).map(([category, count]) => (
            <div className="stat-item" key={category}>
              <span className="stat-label">{category}</span>
              <span className="stat-value">{count}</span>
            </div>
          ))}
        </div>
      )}

      {Object.keys(timePeriodCounts).length > 0 && (
        <div className="stat-section">
          <h4>By Time Period</h4>
          {Object.entries(timePeriodCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([period, count]) => (
              <div className="stat-item" key={period}>
                <span className="stat-label">
                  {timeLabels[period]}
                </span>
                <span className="stat-value">{count}</span>
              </div>
            ))}
        </div>
      )}

      {total === 0 && (
        <p style={{ color: '#999', fontSize: '0.813rem', marginTop: '1rem', lineHeight: '1.5' }}>
          No incidents reported yet. Click on the map to add one.
        </p>
      )}
    </div>
  );
}

export default Statistics;
