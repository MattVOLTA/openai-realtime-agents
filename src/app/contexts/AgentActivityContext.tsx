"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

// 1. Define an interface for the context state
export interface AgentActivityState {
  isMicrophoneActive: boolean;
  isHearingUser: boolean;
  isThinking: boolean;
  isSpeakingAudio: boolean;
  isSpeakingText: boolean;
  // Potentially, a more general isSpeaking if needed
  // isSpeaking: boolean; 
}

// 2. Define an interface for the context value (state + setters)
export interface AgentActivityContextValue {
  activityState: AgentActivityState;
  setActivityState: React.Dispatch<React.SetStateAction<AgentActivityState>>;
  // Individual setters can be added for convenience if preferred
  setIsMicrophoneActive: (isActive: boolean) => void;
  setIsHearingUser: (isHearing: boolean) => void;
  setIsThinking: (isThinking: boolean) => void;
  setIsSpeakingAudio: (isSpeaking: boolean) => void;
  setIsSpeakingText: (isSpeaking: boolean) => void;
}

// Initial state
const initialState: AgentActivityState = {
  isMicrophoneActive: false,
  isHearingUser: false,
  isThinking: false,
  isSpeakingAudio: false,
  isSpeakingText: false,
  // isSpeaking: false,
};

// 3. Create the context
const AgentActivityContext = createContext<AgentActivityContextValue | undefined>(undefined);

// 4. Create a provider component
interface AgentActivityProviderProps {
  children: ReactNode;
}

export const AgentActivityProvider: React.FC<AgentActivityProviderProps> = ({ children }) => {
  const [activityState, setActivityState] = useState<AgentActivityState>(initialState);

  // Individual setters for convenience
  const setIsMicrophoneActive = (isActive: boolean) => {
    setActivityState(prevState => ({ ...prevState, isMicrophoneActive: isActive }));
  };
  const setIsHearingUser = (isHearing: boolean) => {
    setActivityState(prevState => ({ ...prevState, isHearingUser: isHearing }));
  };
  const setIsThinking = (isThinking: boolean) => {
    setActivityState(prevState => ({ ...prevState, isThinking: isThinking }));
  };
  const setIsSpeakingAudio = (isSpeaking: boolean) => {
    setActivityState(prevState => ({ ...prevState, isSpeakingAudio: isSpeaking }));
  };
  const setIsSpeakingText = (isSpeaking: boolean) => {
    setActivityState(prevState => ({ ...prevState, isSpeakingText: isSpeaking }));
  };

  const value = {
    activityState,
    setActivityState, // Expose the general setter if needed
    setIsMicrophoneActive,
    setIsHearingUser,
    setIsThinking,
    setIsSpeakingAudio,
    setIsSpeakingText,
  };

  return (
    <AgentActivityContext.Provider value={value}>
      {children}
    </AgentActivityContext.Provider>
  );
};

// 5. Create a custom hook for easy consumption
export const useAgentActivity = (): AgentActivityContextValue => {
  const context = useContext(AgentActivityContext);
  if (context === undefined) {
    throw new Error('useAgentActivity must be used within an AgentActivityProvider');
  }
  return context;
}; 