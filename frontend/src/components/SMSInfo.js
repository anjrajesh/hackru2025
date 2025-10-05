import React, { useState, useEffect } from 'react';

function SMSInfo() {
  const [twilioNumber] = useState('+1-567-667-6756');
  const [smsEnabled, setSmsEnabled] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then(res => res.json())
      .then(data => {
        setSmsEnabled(data.features?.sms || false);
      })
      .catch(err => console.error('Error checking SMS status:', err));
  }, []);

  return (
    <div className="sms-info">
      <h3>📱 SMS Reporting</h3>
      {!smsEnabled && (
        <div className="sms-warning" style={{
          backgroundColor: '#fff3cd',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '10px',
          border: '1px solid #ffc107'
        }}>
          ⚠️ SMS reporting is not configured.
        </div>
      )}
      
      <p className="sms-description">
        Can't access the website? Text your safety incident to our number and it will automatically appear on the map!
      </p>
      
      <div className="sms-number">
        <strong>📞 Text To:</strong>
        <div className="phone-number" style={{
          fontSize: '1.5em',
          color: '#007bff',
          fontWeight: 'bold',
          margin: '10px 0'
        }}>
          {twilioNumber}
        </div>
        <p style={{ fontSize: '0.9em', color: '#666' }}>
          Standard SMS rates may apply
        </p>
      </div>

      <div className="sms-format">
        <strong>How to Format Your Message:</strong>
        
        <div className="format-example" style={{
          backgroundColor: '#f8f9fa',
          padding: '10px',
          borderRadius: '5px',
          margin: '10px 0'
        }}>
          <strong>Simple Format:</strong>
          <code style={{ display: 'block', margin: '5px 0' }}>
            Someone is following me near the library
          </code>
          <small>Uses local spots in Rutgers University - New Brunswick campus</small>
        </div>
      </div>

      <div className="sms-examples">
        <strong>Example Messages:</strong>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ margin: '5px 0' }}>
            "Street lights not working nearby Alexander Library"
          </li>
          <li style={{ margin: '5px 0' }}>
            "Got harassed near the train station"
          </li>
          <li style={{ margin: '5px 0' }}>
            "Suspicious person following pedestrians at Livingston Campus"
          </li>
        </ul>
      </div>

      <div className="sms-benefits" style={{
        backgroundColor: '#d4edda',
        padding: '10px',
        borderRadius: '5px',
        marginTop: '15px',
        border: '1px solid #c3e6cb'
      }}>
        <strong>Benefits:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>Quick reporting in emergency situations</li>
          <li>AI automatically categorizes your report</li>
          <li>Appears on map immediately</li>
          <li>Works even with poor internet connection</li>
        </ul>
      </div>
    </div>
  );
}

export default SMSInfo;
