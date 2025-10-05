import React from 'react';

function SMSInfo() {
  return (
    <div className="sms-info">
      <h3>📱 Report via SMS</h3>
      <p className="sms-description">
        Can't use the app? Send a text message to report incidents.
      </p>
      
      <div className="sms-number">
        <strong>Text to:</strong>
        <div className="phone-number">[Your Twilio Number]</div>
      </div>

      <div className="sms-format">
        <strong>Message Format:</strong>
        <div className="format-example">
          <code>Someone is following me near 5th Ave</code>
        </div>
        <p className="format-note">
          Optional: Include coordinates like "40.7128, -74.0060"
        </p>
      </div>

      <div className="sms-examples">
        <strong>Examples:</strong>
        <ul>
          <li>💡 "Street lights broken on Main St"</li>
          <li>🚨 "Got harassed at bus stop, 40.7128, -74.0060"</li>
          <li>⚠️ "Suspicious person near Central Park"</li>
        </ul>
      </div>

      <div className="sms-benefits">
        <strong>Why SMS?</strong>
        <ul>
          <li>✅ Works without internet</li>
          <li>✅ Quick and easy in emergencies</li>
          <li>✅ Accessible to everyone</li>
          <li>✅ AI categorizes automatically</li>
        </ul>
      </div>
    </div>
  );
}

export default SMSInfo;
