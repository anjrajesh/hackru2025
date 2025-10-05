import React, { useState, useEffect } from 'react';

function VoiceReporter({ location, onSubmit, onClose }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [error, setError] = useState('');
  const [browserSupported, setBrowserSupported] = useState(true);

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setBrowserSupported(false);
      setError('Voice recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscription(prev => prev + finalTranscript || interimTranscript);
    };

    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(`Error: ${event.error}. Please try again.`);
      setIsRecording(false);
    };

    recognitionInstance.onend = () => {
      setIsRecording(false);
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, []);

  const startRecording = () => {
    if (!recognition) return;
    
    setError('');
    setTranscription('');
    setIsRecording(true);
    
    try {
      recognition.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      setError('Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsRecording(false);
  };

  const handleSubmit = async () => {
    if (!transcription.trim()) {
      setError('Please record a description first');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      await onSubmit({
        transcription: transcription.trim(),
        latitude: location.lat,
        longitude: location.lng
      });
      
      setTranscription('');
    } catch (error) {
      console.error('Error submitting voice report:', error);
      setError('Failed to submit report. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualEdit = (e) => {
    setTranscription(e.target.value);
  };

  if (!browserSupported) {
    return (
      <div className="form-modal" onClick={onClose}>
        <div className="form-content voice-reporter" onClick={(e) => e.stopPropagation()}>
          <h2>🎤 Voice Report Not Supported</h2>
          <div className="error-message">
            <p>{error}</p>
            <p>Please use the manual reporting feature or try a different browser.</p>
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-modal" onClick={onClose}>
      <div className="form-content voice-reporter" onClick={(e) => e.stopPropagation()}>
        <h2>Voice Report</h2>
        
        <div className="location-info">
          📍 Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </div>

        <div className="voice-controls">
          <div className="recording-status">
            {isRecording ? (
              <>
                <div className="recording-indicator pulse"></div>
                <span>Recording... Speak now</span>
              </>
            ) : (
              <span>Press the microphone to start recording</span>
            )}
          </div>

          <button
            className={`mic-button ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
          >
            <span className="mic-icon">🎤</span>
          </button>

          <p className="voice-hint">
            Describe the safety incident in detail
          </p>
        </div>

        {transcription && (
          <div className="transcription-box">
            <label>Transcription (you can edit this):</label>
            <textarea
              value={transcription}
              onChange={handleManualEdit}
              placeholder="Your voice recording will appear here..."
              rows="6"
            />
          </div>
        )}

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <div className="voice-tips">
          <strong>Tips:</strong>
          <ul>
            <li>Speak clearly</li>
            <li>You can edit the transcription before submitting</li>
            <li>AI will automatically categorize your report</li>
          </ul>
        </div>

        <div className="form-actions">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isProcessing || !transcription.trim()}
          >
            {isProcessing ? 'Submitting...' : 'Submit Voice Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VoiceReporter;
