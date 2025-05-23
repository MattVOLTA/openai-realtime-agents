import { RefObject } from "react";

// Define an interface for the callbacks
interface RealtimeConnectionCallbacks {
  onMicrophoneActive?: () => void;
  onAgentAudioStart?: () => void;
  onError?: (error: Error) => void;
}

export async function createRealtimeConnection(
  EPHEMERAL_KEY: string,
  audioElement: RefObject<HTMLAudioElement | null>,
  callbacks?: RealtimeConnectionCallbacks // Add optional callbacks parameter
): Promise<{ pc: RTCPeerConnection; dc: RTCDataChannel }> {
  const pc = new RTCPeerConnection();
  
  try {
    // Call onAgentAudioStart when an audio track is received
    pc.ontrack = (e) => {
      if (e.track.kind === 'audio' && audioElement.current) {
        audioElement.current.srcObject = e.streams[0];
        callbacks?.onAgentAudioStart?.(); // Call if provided
      }
    };

    // Request microphone access with error handling
    let ms: MediaStream;
    try {
      ms = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      const permissionError = new Error(
        error instanceof Error && error.name === 'NotAllowedError'
          ? "Microphone permission denied. Please allow microphone access to start the interview."
          : "Failed to access microphone. Please check your device settings."
      );
      callbacks?.onError?.(permissionError);
      throw permissionError;
    }
    
    pc.addTrack(ms.getTracks()[0]);
    callbacks?.onMicrophoneActive?.(); // Call if provided, after mic access is confirmed

    const dc = pc.createDataChannel("oai-events");

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const baseUrl = "https://api.openai.com/v1/realtime";
    // Use a more generic model placeholder if the exact one isn't critical for the function's structure
    // Or ensure the model name is up-to-date if it's specific to a version of this function.
    const model = "gpt-4o-realtime-preview"; // Placeholder, adjust if a specific dated version is needed by API endpoint

    // Add timeout for OpenAI API connection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!sdpResponse.ok) {
        throw new Error(`OpenAI API error: ${sdpResponse.status} ${sdpResponse.statusText}`);
      }

      const answerSdp = await sdpResponse.text();
      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: answerSdp,
      };

      await pc.setRemoteDescription(answer);

      return { pc, dc };
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error("Connection timeout. Please check your internet connection and try again.");
      }
      throw fetchError;
    }
  } catch (error) {
    // Clean up on error
    pc.close();
    throw error;
  }
} 