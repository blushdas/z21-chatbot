
import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { Send, ArrowUp, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMode } from './ChatInterface';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

export interface SmartPromptInputProps {
  onSend: (input: string) => void;
  currentMode: ChatMode;
  placeholder?: string;
}

const SmartPromptInput = forwardRef<HTMLTextAreaElement, SmartPromptInputProps>(
  ({ onSend, currentMode, placeholder = "Type a message..." }, ref) => {
    const [input, setInput] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeSuggestion, setActiveSuggestion] = useState(-1);
    const [isRecording, setIsRecording] = useState(false);
    
    const localInputRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<any>(null);
    const actualRef = ref || localInputRef;
    const { toast } = useToast();
    
    // Initialize Web Speech API
    useEffect(() => {
      if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          // Update input with transcription
          if (finalTranscript || interimTranscript) {
            setInput(prev => prev + (finalTranscript || interimTranscript));
          }
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsRecording(false);
          toast({
            title: "Voice recording error",
            description: `Error: ${event.error}`,
            variant: "destructive",
          });
        };
        
        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
      
      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          stopRecording();
        }
      };
    }, []);
    
    // Auto-stop recording after 60 seconds
    useEffect(() => {
      let recordingTimeout: NodeJS.Timeout;
      
      if (isRecording) {
        recordingTimeout = setTimeout(() => {
          stopRecording();
          toast({
            title: "Recording stopped",
            description: "Maximum recording time reached (60 seconds)",
          });
        }, 60000);
      }
      
      return () => {
        if (recordingTimeout) {
          clearTimeout(recordingTimeout);
        }
      };
    }, [isRecording]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setInput(value);
      
      // Generate suggestions based on input
      if (value.trim().length > 2) {
        const modeBasedSuggestions = getModeBasedSuggestions(value, currentMode);
        setSuggestions(modeBasedSuggestions.slice(0, 5));
      } else {
        setSuggestions([]);
      }
      
      setActiveSuggestion(-1);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      } else if (e.key === 'Tab' && suggestions.length > 0) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[activeSuggestion >= 0 ? activeSuggestion : 0]);
      } else if (e.key === 'ArrowDown' && suggestions.length > 0) {
        e.preventDefault();
        setActiveSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp' && suggestions.length > 0) {
        e.preventDefault();
        setActiveSuggestion(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Escape') {
        setSuggestions([]);
      }
    };
    
    const handleSend = () => {
      if (input.trim()) {
        onSend(input.trim());
        setInput("");
        setSuggestions([]);
      }
    };
    
    const handleSelectSuggestion = (suggestion: string) => {
      setInput(suggestion);
      setSuggestions([]);
      if (actualRef && 'current' in actualRef && actualRef.current) {
        actualRef.current.focus();
      }
    };
    
    // Voice recording functions
    const toggleRecording = () => {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    };
    
    const startRecording = () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecording(true);
          toast({
            title: "Recording started",
            description: "Speak now... (max 60 seconds)",
          });
        } catch (error) {
          console.error('Failed to start recording', error);
          toast({
            title: "Error",
            description: "Could not start voice recording",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Not supported",
          description: "Voice recording is not supported in your browser",
          variant: "destructive",
        });
      }
    };
    
    const stopRecording = () => {
      if (recognitionRef.current && isRecording) {
        recognitionRef.current.stop();
        setIsRecording(false);
        toast({
          title: "Recording stopped",
          description: "Voice captured",
        });
      }
    };
    
    // Adjust textarea height based on content
    useEffect(() => {
      const textarea = actualRef && 'current' in actualRef ? actualRef.current : null;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [input, actualRef]);
    
    // Simple suggestion generator
    const getModeBasedSuggestions = (inputText: string, mode: ChatMode): string[] => {
      const lowerInput = inputText.toLowerCase();
      
      const allSuggestions = {
        Coaching: [
          "How do I develop emerging leaders?",
          "What's your approach to giving constructive feedback?",
          "How can I build a stronger team culture?",
          "What principles guide effective mentorship?",
          "How do you recommend handling conflict between team members?",
        ],
        Family: [
          "How can I better balance work and family life?",
          "What values are most important to pass on to children?",
          "How did you approach financial education with your family?",
          "What strategies help strengthen family relationships?",
          "How do you recommend handling generational differences?",
        ],
        Investor: [
          "What criteria do you use to evaluate investment opportunities?",
          "How do you balance profit with purpose?",
          "What are the hallmarks of a sustainable business model?",
          "How should mission align with capital deployment?",
          "What principles guide your approach to risk management?",
        ],
        Ambassador: [
          "How do you represent organizational values externally?",
          "What's the best way to communicate our mission to others?",
          "How do you maintain integrity when facing competing priorities?",
          "What principles guide your approach to partnerships?",
          "How do you recommend handling public relations challenges?",
        ],
      };
      
      return allSuggestions[mode].filter(
        suggestion => suggestion.toLowerCase().includes(lowerInput)
      );
    };
    
    return (
      <div className="relative">
        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-1 bg-[var(--chat-card)] rounded-md shadow-elevated border border-[var(--chat-border)] z-10 overflow-hidden">
            {suggestions.map((suggestion, index) => (
              <div 
                key={index}
                className={cn(
                  "px-3 py-2 cursor-pointer text-sm text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)]",
                  index === activeSuggestion && "bg-[var(--ui-bg-hover)]"
                )}
                onClick={() => handleSelectSuggestion(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
        
        {/* Input area with voice button */}
        <div className="flex items-end border border-[var(--chat-border)] rounded-lg overflow-hidden bg-[var(--chat-input-bg)]">
          {/* Text input area */}
          <textarea
            ref={actualRef as React.RefObject<HTMLTextAreaElement>}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Listening..." : placeholder}
            rows={1}
            className="flex-1 p-3 resize-none max-h-32 focus:outline-none focus:ring-0 bg-transparent text-[var(--chat-text)] placeholder:text-[var(--chat-muted)]"
          />
          
          {/* Control buttons group */}
          <div className="flex items-center">
            {/* Voice button */}
            <button
              onClick={toggleRecording}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-full transition-colors",
                isRecording 
                  ? "text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 animate-pulse" 
                  : "text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)]"
              )}
              title={isRecording ? "Stop recording" : "Record voice"}
            >
              <Mic size={20} />
            </button>
            
            {/* Send button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim()}
              aria-label="Send message"
              className={cn(
                "my-1 mr-1 h-9 w-9 rounded-full flex items-center justify-center transition-colors",
                "bg-brand-yellow text-brand-blue hover:bg-brand-yellow/90",
                "disabled:bg-[var(--ui-bg-hover)] disabled:text-[var(--chat-muted)] disabled:cursor-not-allowed focus-ring",
              )}
            >
              <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    );
  }
);

SmartPromptInput.displayName = "SmartPromptInput";

export default SmartPromptInput;
