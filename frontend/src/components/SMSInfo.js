import React from 'react';

function SMSInfo() {
  return (
    <div className="sms-info">
      <h3>Report via SMS</h3>
      <p className="sms-description">
        Unable to use the website? Send a text message to report incidents.
      </p>
      
      <div className="sms-number">
        <strong>Text to:</strong>
        <div className="phone-number">[Your Twilio Number]</div>
      </div>

      <div className="sms-format">
        <strong>Message Format:</strong>
        <div className="format-example">
          <code>Someone is following me near College Avenue Student Center.</code>
        </div>
        <p className="format-note">
          Tip: For accurate location representation, try to describe landmarks or specific addresses.
        </p>
      </div>

      <div className="sms-examples">
        <strong>Examples:</strong>
        <ul>
          <li>"Street lights broken on George Street"</li>
          <li>"Suspicious person near New Brunswick train station"</li>
        </ul>
      </div>
    </div>
  );
}

export default SMSInfo;
