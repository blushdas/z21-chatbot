import React from 'react';
import { format } from 'date-fns';
import { MessageType } from '@/components/ChatInterface';

interface ChatPDFLayoutProps {
  messages: MessageType[];
  chatTitle: string;
  mode: string;
  createdAt: string;
  chatId: string;
}

export const ChatPDFLayout: React.FC<ChatPDFLayoutProps> = ({
  messages,
  chatTitle,
  mode,
  createdAt,
  chatId
}) => {
  const formatMode = (mode: string) => {
    const modeMap: Record<string, string> = {
      coach: 'Coach Mode',
      coachAlpha: 'Coach Alpha Mode',
      family: 'Family Mode',
      ambassador: 'Ambassador Mode',
      faith: 'Faith Mode'
    };
    return modeMap[mode] || mode;
  };

  const formatMessageContent = (content: string) => {
    // Clean up markdown and preserve line breaks
    return content
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/`(.*?)`/g, '$1') // Remove code markdown
      .split('\n').map((line, index) => (
        <div key={index} className="mb-1">
          {line || <br />}
        </div>
      ));
  };

  // Debug logging
  console.log('🎨 ChatPDFLayout rendering:', { 
    messagesCount: messages.length, 
    chatTitle, 
    mode 
  });

  return (
    <div 
      className="bg-white text-black font-sans leading-relaxed" 
      style={{ 
        fontSize: '14px', 
        lineHeight: '1.6', 
        minHeight: '100vh',
        width: '100%',
        display: 'block',
        position: 'relative'
      }}
    >
      {/* Professional Header */}
      <div style={{
        background: 'linear-gradient(to right, #2563eb, #1e40af)',
        color: 'white',
        padding: '32px',
        marginBottom: '32px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '16px' }}>
            <h1 style={{ 
              fontSize: '36px', 
              fontWeight: 'bold', 
              marginBottom: '8px',
              margin: '0 0 8px 0' 
            }}>DARYLE AI</h1>
            <div style={{
              width: '96px',
              height: '4px',
              backgroundColor: 'white',
              margin: '0 auto',
              borderRadius: '2px'
            }}></div>
          </div>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '300', 
            marginBottom: '8px',
            margin: '0 0 8px 0'
          }}>Executive Coaching Session Report</h2>
          <div style={{ color: '#bfdbfe', fontSize: '14px' }}>
            <p style={{ margin: '0' }}>Confidential and Proprietary</p>
          </div>
        </div>
      </div>

      {/* Session Details Card */}
      <div style={{ 
        maxWidth: '896px', 
        margin: '0 auto', 
        paddingLeft: '32px', 
        paddingRight: '32px', 
        marginBottom: '32px' 
      }}>
        <div style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '24px' 
          }}>
            <div>
              <h3 style={{ 
                fontWeight: '600', 
                color: '#1f2937', 
                marginBottom: '12px',
                margin: '0 0 12px 0'
              }}>Session Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#4b5563' }}>Session Title:</span>
                  <span style={{ fontWeight: '500', color: '#111827' }}>{chatTitle}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#4b5563' }}>Coaching Mode:</span>
                  <span style={{ fontWeight: '500', color: '#2563eb' }}>{formatMode(mode)}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 style={{ 
                fontWeight: '600', 
                color: '#1f2937', 
                marginBottom: '12px',
                margin: '0 0 12px 0'
              }}>Session Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#4b5563' }}>Date & Time:</span>
                  <span style={{ fontWeight: '500', color: '#111827' }}>{format(new Date(createdAt), 'MMMM dd, yyyy at h:mm a')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#4b5563' }}>Session ID:</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6b7280' }}>{chatId.substring(0, 8)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Session Transcript */}
      <div style={{ 
        maxWidth: '896px', 
        margin: '0 auto', 
        paddingLeft: '32px', 
        paddingRight: '32px' 
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '8px',
            borderBottom: '1px solid #d1d5db',
            paddingBottom: '8px',
            margin: '0 0 8px 0'
          }}>
            Session Transcript
          </h3>
          <p style={{ 
            fontSize: '14px', 
            color: '#4b5563',
            margin: '0'
          }}>
            Complete conversation record between client and Daryle AI coaching system
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {messages.map((message, index) => (
            <div key={index} style={{ pageBreakInside: 'avoid' }}>
              {message.sender === 'user' ? (
                // User message - Professional client format
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '12px' 
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#dbeafe',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px'
                    }}>
                      <span style={{ 
                        color: '#2563eb', 
                        fontWeight: '600', 
                        fontSize: '14px' 
                      }}>C</span>
                    </div>
                    <div>
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#1f2937' 
                      }}>Client</div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280' 
                      }}>Question/Input</div>
                    </div>
                  </div>
                  <div style={{
                    marginLeft: '44px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    padding: '16px',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}>
                    <div style={{ 
                      color: '#1f2937', 
                      lineHeight: '1.6' 
                    }}>
                      {formatMessageContent(message.content)}
                    </div>
                  </div>
                </div>
              ) : (
                // AI message - Professional coach format
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '12px' 
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: 'linear-gradient(to bottom right, #2563eb, #1d4ed8)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px'
                    }}>
                      <span style={{ 
                        color: 'white', 
                        fontWeight: 'bold', 
                        fontSize: '14px' 
                      }}>D</span>
                    </div>
                    <div style={{ flex: '1' }}>
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#1f2937' 
                      }}>Daryle AI Coach</div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280' 
                      }}>Response/Guidance</div>
                    </div>
                    {message.timestamp && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#9ca3af' 
                      }}>
                        {format(new Date(message.timestamp), 'h:mm a')}
                      </div>
                    )}
                  </div>
                  <div style={{
                    marginLeft: '44px',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}>
                    <div style={{ 
                      color: '#1f2937', 
                      lineHeight: '1.6' 
                    }}>
                      {formatMessageContent(message.content)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Professional Footer */}
      <div style={{ 
        maxWidth: '896px', 
        margin: '0 auto', 
        paddingLeft: '32px', 
        paddingRight: '32px', 
        marginTop: '48px' 
      }}>
        <div style={{ 
          borderTop: '1px solid #d1d5db', 
          paddingTop: '24px' 
        }}>
          <div style={{
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ 
                fontWeight: '600', 
                color: '#1f2937', 
                marginBottom: '8px',
                margin: '0 0 8px 0'
              }}>About Daryle AI</h4>
              <p style={{ 
                fontSize: '14px', 
                color: '#4b5563', 
                lineHeight: '1.6',
                margin: '0'
              }}>
                Daryle AI is an advanced executive coaching platform that provides personalized guidance, 
                strategic insights, and professional development support through artificial intelligence.
              </p>
            </div>
            <div style={{ 
              borderTop: '1px solid #e5e7eb', 
              paddingTop: '16px', 
              marginTop: '16px' 
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                fontSize: '12px', 
                color: '#6b7280' 
              }}>
                <span>Document generated: {format(new Date(), 'MMMM dd, yyyy at h:mm a')}</span>
                <span>© Daryle AI Coaching Platform</span>
              </div>
              <p style={{ 
                marginTop: '8px', 
                fontSize: '12px', 
                color: '#9ca3af',
                margin: '8px 0 0 0'
              }}>
                This document contains confidential coaching session information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};