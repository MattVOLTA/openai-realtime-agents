import React from "react";
import { SessionStatus, AgentConfig } from "@/app/types";
import { useAgentActivity } from "@/app/contexts/AgentActivityContext";

interface BottomToolbarProps {
  sessionStatus: SessionStatus;
  onToggleConnection: () => void;
  isPTTActive: boolean;
  setIsPTTActive: (val: boolean) => void;
  isPTTUserSpeaking: boolean;
  handleTalkButtonDown: () => void;
  handleTalkButtonUp: () => void;
  isEventsPaneExpanded: boolean;
  setIsEventsPaneExpanded: (val: boolean) => void;
  isAudioPlaybackEnabled: boolean;
  setIsAudioPlaybackEnabled: (val: boolean) => void;

  userText: string;
  setUserText: (text: string) => void;
  onSendTextMessage: () => void;
  isAgentSpeaking: boolean;
  onCancelAssistantSpeech: () => void;
  isInterviewMode: boolean;
  currentAgentName: string;
  currentAgentConfig?: AgentConfig;
}

function BottomToolbar({
  sessionStatus,
  onToggleConnection,
  isPTTActive,
  setIsPTTActive,
  isPTTUserSpeaking,
  handleTalkButtonDown,
  handleTalkButtonUp,
  isEventsPaneExpanded,
  setIsEventsPaneExpanded,
  isAudioPlaybackEnabled,
  setIsAudioPlaybackEnabled,

  userText,
  setUserText,
  onSendTextMessage,
  isAgentSpeaking,
  onCancelAssistantSpeech,
  isInterviewMode,
  currentAgentName,
  currentAgentConfig,
}: BottomToolbarProps) {
  const { activityState } = useAgentActivity();
  const isConnected = sessionStatus === "CONNECTED";
  const isConnecting = sessionStatus === "CONNECTING";

  function getConnectionButtonLabel() {
    if (isConnected) return "Disconnect";
    if (isConnecting) return "Connecting...";
    return "Connect";
  }

  function getConnectionButtonClasses() {
    const baseClasses = "text-white text-base p-2 w-36 rounded-full h-full";
    const cursorClass = isConnecting ? "cursor-not-allowed" : "cursor-pointer";

    if (isConnected) {
      return `bg-red-600 hover:bg-red-700 ${cursorClass} ${baseClasses}`;
    }
    return `bg-black hover:bg-gray-900 ${cursorClass} ${baseClasses}`;
  }

  return (
    <div className="p-4 flex flex-row items-center justify-center gap-x-8 bg-gray-100 border-t border-gray-300">
      <button
        onClick={onToggleConnection}
        className={getConnectionButtonClasses()}
        disabled={isConnecting}
      >
        {getConnectionButtonLabel()}
      </button>

      {!isInterviewMode && (
        <div className="flex flex-row items-center gap-2">
          <input
            id="push-to-talk"
            type="checkbox"
            checked={isPTTActive}
            onChange={e => setIsPTTActive(e.target.checked)}
            disabled={!isConnected}
            className="w-4 h-4"
          />
          <label htmlFor="push-to-talk" className="flex items-center cursor-pointer">
            Push to talk
          </label>
          <button
            onMouseDown={handleTalkButtonDown}
            onMouseUp={handleTalkButtonUp}
            onTouchStart={handleTalkButtonDown}
            onTouchEnd={handleTalkButtonUp}
            disabled={!isPTTActive}
            className={`py-1 px-4 cursor-pointer rounded-full ${
              !isConnected || !isPTTActive
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : activityState.isHearingUser
                ? "bg-green-300 hover:bg-green-400"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Talk
          </button>
        </div>
      )}
      
      {!isInterviewMode && (
          <div className="flex items-center space-x-2">
            <input 
              type="text"
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              placeholder="Type message..."
              className="border p-2 rounded-md flex-grow max-w-xs"
              disabled={!isConnected || activityState.isHearingUser || isAgentSpeaking}
            />
            <button 
              onClick={onSendTextMessage}
              disabled={!isConnected || !userText.trim() || activityState.isHearingUser || isAgentSpeaking}
              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md disabled:opacity-50"
            >
              Send
            </button>
            {isAgentSpeaking && (
              <button 
                onClick={onCancelAssistantSpeech}
                className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-md"
              >
                Interrupt
              </button>
            )}
          </div>
        )}

      <div className="flex flex-row items-center gap-2">
        <input
          id="audio-playback"
          type="checkbox"
          checked={isAudioPlaybackEnabled}
          onChange={e => setIsAudioPlaybackEnabled(e.target.checked)}
          disabled={!isConnected}
          className="w-4 h-4"
        />
        <label htmlFor="audio-playback" className="flex items-center cursor-pointer">
          Audio playback
        </label>
      </div>

      <div className="flex flex-row items-center gap-2">
        <input
          id="logs"
          type="checkbox"
          checked={isEventsPaneExpanded}
          onChange={e => setIsEventsPaneExpanded(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="logs" className="flex items-center cursor-pointer">
          Logs
        </label>
      </div>
    </div>
  );
}

export default BottomToolbar;
