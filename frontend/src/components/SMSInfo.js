import React from 'react';

function SMSInfo() {
  return (
    <div className="sms-info">
      <h3>SMS Reporting</h3>
      <p className="sms-description">
        Send a text message to report incidents when unable to access the website.
      </p>
      
      <div className="sms-number">
        <strong>Send to</strong>
        <div className="phone-number">[Your Twilio Number]</div>
      </div>

      <div className="sms-format">
        <strong>Format</strong>
        <div className="format-example">
          <code>Someone is following me near College Avenue Student Center.</code>
        </div>
        <p className="format-note">
          Include landmarks or specific addresses for accurate location mapping.
        </p>
      </div>

      <div className="sms-examples">
        <strong>Examples</strong>
        <ul>
          <li>"Street lights broken on George Street"</li>
          <li>"Suspicious person near New Brunswick train station"</li>
        </ul>
      </div>
    </div>
  );
}

export default SMSInfo;
