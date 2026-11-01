
import { useState, useEffect, useRef } from 'react';
import { useAskAssistant } from '../hooks/useApiQueries';
import { useAuth } from '../contexts/AuthContext';
import { validators } from '../utils/validators';
import FormError from './FormError';

import aiIcon from '../assets/ai.svg';

export default function AssistantChat({ onViewDetails, _onAddCompare }) {
  const { user } = useAuth();

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hi! 👋 I'm PGMate AI. Tell me what kind of PG you're looking for!",
    },
  ]);

  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [failedRequest, setFailedRequest] = useState(null);

  const messagesEndRef = useRef(null);
  const previousMessageCountRef = useRef(messages.length);

  const askMutation = useAskAssistant();

  // Scroll only when a new message is added
  useEffect(() => {
    if (messages.length > previousMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }

    previousMessageCountRef.current = messages.length;
  }, [messages]);

  // User-friendly error message
  const getFriendlyError = (err) => {
    const message = err?.message?.toLowerCase() || '';

    if (
      message.includes('failed to fetch') ||
      message.includes('network') ||
      message.includes('fetch')
    ) {
      return 'Unable to connect to the server. Please check your connection and try again.';
    }

    return 'PGMate AI is temporarily unavailable. Please try again.';
  };

  // Send API request
  const sendRequest = async (request) => {
    setError('');
    setIsSending(true);

    try {
      const result = await askMutation.mutateAsync(request);

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text:
            result?.reply ||
            'Sorry, I could not generate a response.',
          matchedPGs: result?.matchedPGs || [],
        },
      ]);

      setFailedRequest(null);

    } catch (err) {
      console.error('AI ASSISTANT ERROR:', err);

      setError(getFriendlyError(err));
      setFailedRequest(request);

    } finally {
      setIsSending(false);
    }
  };

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (isSending) return;

    setError('');

    // Authentication check
    if (!user) {
      setError('Please log in to use the AI assistant.');
      return;
    }

    const messageToSend = input.trim();

    // Message validation
    const validationError = validators.message(messageToSend);

    if (validationError) {
      setError(validationError);
      return;
    }

    // Preserve previous conversation history
    const previousMessages = messages;

    // Prepare request for API
    const request = {
      message: messageToSend,
      history: previousMessages,
    };

    // Add user message
    setMessages(prev => [
      ...prev,
      {
        sender: 'user',
        text: messageToSend,
      },
    ]);

    setInput('');
    setFailedRequest(null);

    await sendRequest(request);
  };

  // Retry the previous failed request
  const handleRetry = async () => {
    if (!failedRequest || isSending) return;

    await sendRequest(failedRequest);
  };

  // Enter key support
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      if (!isSending && input.trim()) {
        handleSendMessage();
      }
    }
  };

  // Separate disabled states
  const isInputDisabled = !user || isSending;
  const isSendDisabled = !user || isSending || !input.trim();

  return (
    <section className="ai-section" id="assistant">

      <div className="ai-header">
        <p className="badge">
          ✨ Meet your AI assistant
        </p>

        <h2>Ask PGMate AI</h2>

        <p>
          Tell me your budget, location or required
          facilities. I'll help you choose a suitable PG.
        </p>
      </div>

      <div className="chat-box">

        {/* Error message */}
        {error && (
          <div style={{ marginBottom: '15px' }}>
            <FormError
              message={error}
              onRetry={failedRequest ? handleRetry : undefined}
            />
          </div>
        )}

        {/* Login warning */}
        {!user && (
          <div
            style={{
              padding: '15px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '4px',
              marginBottom: '15px',
              color: '#856404',
              fontSize: '14px',
            }}
          >
            ℹ️ Please log in to use the AI assistant.
          </div>
        )}

        {/* Chat messages */}
        <div
          className="chat-messages"
          role="log"
          aria-label="Chat messages"
        >
          {messages.map((msg, index) => (
            <div key={index}>

              <div
                className={`chat-message ${msg.sender}`}
                role={msg.sender === 'ai' ? 'status' : undefined}
                aria-live={msg.sender === 'ai' ? 'polite' : 'off'}
              >
                <span aria-hidden="true">
                  {msg.sender === 'ai' ? (
                    <img
                      src={aiIcon}
                      alt="PGMate AI"
                      style={{
                        width: '26px',
                        height: '26px',
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  ) : (
                    '👤'
                  )}
                </span>

                <p>{msg.text}</p>
              </div>

              {/* Matched PG cards */}
              {msg.matchedPGs?.length > 0 && (
                <div
                  style={{
                    marginTop: '15px',
                    marginLeft: '10px',
                  }}
                >
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#999',
                      textAlign: 'center',
                      marginBottom: '10px',
                    }}
                  >
                    📌 Matched PGs:
                  </p>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '10px',
                    }}
                  >
                    {msg.matchedPGs.slice(0, 3).map(pg => (
                      <div
                        key={pg.id}
                        style={{
                          padding: '10px',
                          backgroundColor: '#f5f5f5',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onClick={() =>
                          onViewDetails?.(pg, msg.matchedPGs)
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onViewDetails?.(pg, msg.matchedPGs);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`View details for ${pg.name}`}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = '#ececec';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }}
                      >
                        <p
                          style={{
                            margin: '0 0 5px 0',
                            fontWeight: '600',
                            fontSize: '14px',
                          }}
                        >
                          {pg.name}
                        </p>

                        <p
                          style={{
                            margin: '0 0 3px 0',
                            fontSize: '12px',
                            color: '#666',
                          }}
                        >
                          ₹{pg.rent}/month
                        </p>

                        <p
                          style={{
                            margin: 0,
                            fontSize: '12px',
                            color: '#999',
                          }}
                        >
                          📍 {pg.location}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat input */}
        <div className="chat-input-row">

          <input
            type="text"
            placeholder={
              user
                ? 'Ask something like: PG in Agarpara under ₹7000...'
                : 'Log in to use assistant'
            }
            value={input}
            onChange={(e) => {
              setInput(e.target.value);

              if (error) {
                setError('');
              }
            }}
            onKeyDown={handleKeyDown}
            disabled={isInputDisabled}
            aria-label="Message input"
            maxLength={2000}
          />

          <button
            type="button"
            onClick={handleSendMessage}
            disabled={isSendDisabled}
            style={{
              opacity: isSendDisabled ? 0.6 : 1,
              cursor: isSendDisabled ? 'not-allowed' : 'pointer',
            }}
            aria-label="Send message"
            aria-busy={isSending}
          >
            {isSending ? 'Sending...' : 'Send →'}
          </button>

        </div>
      </div>
    </section>
  );
}
