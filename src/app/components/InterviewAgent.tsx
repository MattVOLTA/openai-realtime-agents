"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AgentConfig } from "@/app/types";
import { createInterviewAgentConfig } from "@/app/lib/createInterviewConfig";
import { getInterviewWithRelationsClient as getInterviewWithRelations } from "@/app/lib/interviewClientHelper";
import { useTranscript } from "@/app/contexts/TranscriptContext";
import Link from "next/link";
import type { InterviewWithRelations as InterviewData } from "@/app/lib/interviewClientHelper";

interface InterviewAgentProps {
  onAgentConfigLoaded: (config: AgentConfig) => void;
  interviewId?: string;
  interviewData?: InterviewData;
}

const InterviewAgent: React.FC<InterviewAgentProps> = ({ 
  onAgentConfigLoaded,
  interviewId: propInterviewId,
  interviewData: initialInterviewData
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setActiveInterviewId, saveTranscriptData } = useTranscript();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentInterviewId, setCurrentInterviewId] = useState<string | null>(propInterviewId || null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeSuccess, setCompleteSuccess] = useState(false);

  useEffect(() => {
    const idFromParams = searchParams.get("interviewId");
    let effectiveId = propInterviewId || idFromParams;

    if (!effectiveId) {
      if (!initialInterviewData) { 
        setError("No interview ID provided and no preloaded data.");
        setLoading(false);
        return;
      }
      if (initialInterviewData) {
        effectiveId = initialInterviewData.id; 
      }
    }
    
    if (!effectiveId && !initialInterviewData) { 
      setError("Critical: Interview ID could not be determined.");
      setLoading(false);
      return;
    }
    
    setCurrentInterviewId(effectiveId);
    if (effectiveId) {
        setActiveInterviewId(effectiveId); 
    }

    if (initialInterviewData) {
      console.log("InterviewAgent: Using pre-loaded interview data:", initialInterviewData);
      validateAndConfigureAgent(initialInterviewData);
    } else if (effectiveId) {
      loadInterviewData(effectiveId);
    }
    
    return () => {
      if(effectiveId) setActiveInterviewId(null);
    };
  }, [propInterviewId, searchParams, setActiveInterviewId, initialInterviewData]);

  const validateAndConfigureAgent = (dataToValidate: InterviewData) => {
    if (!dataToValidate.questions || dataToValidate.questions.length === 0) {
      console.error("InterviewAgent: Preloaded data has no questions");
      setError("This interview (from preloaded data) has no questions");
      setLoading(false);
      return;
    }

    console.log("InterviewAgent: Preloaded data validated successfully:", dataToValidate);
    const agentConfig = createInterviewAgentConfig(dataToValidate);
    console.log("InterviewAgent: Agent config created from preloaded data:", agentConfig.name);
    onAgentConfigLoaded(agentConfig);
    setLoading(false);
  };

  const loadInterviewData = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log("Loading interview data for ID:", id);

      const interviewData = await getInterviewWithRelations(id);
      
      if (!interviewData) {
        console.error("Failed to load interview data, result was null");
        setError("Failed to load interview data");
        setLoading(false);
        return;
      }

      console.log("Interview data loaded successfully:", interviewData);

      if (!interviewData.questions || interviewData.questions.length === 0) {
        console.error("Interview has no questions");
        setError("This interview has no questions");
        setLoading(false);
        return;
      }

      // Create agent config based on interview data
      const agentConfig = createInterviewAgentConfig(interviewData);
      console.log("Agent config created:", agentConfig.name);
      
      // Pass the config to parent component
      onAgentConfigLoaded(agentConfig);
      
      setLoading(false);
    } catch (err: any) {
      console.error("Error loading interview data:", err);
      setError(err.message || "Failed to load interview data");
      setLoading(false);
    }
  };

  const completeInterview = async () => {
    if (!currentInterviewId) return;
    
    try {
      setIsCompleting(true);
      
      // First, save the latest transcript data
      await saveTranscriptData(currentInterviewId);
      
      // Then mark the interview as completed
      const response = await fetch('/api/interviews/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ interviewId: currentInterviewId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark interview as completed');
      }
      
      setCompleteSuccess(true);
      
      // Redirect to interview details page after short delay
      setTimeout(() => {
        router.push(`/interviews/${currentInterviewId}`);
      }, 2000);
      
    } catch (err: any) {
      console.error("Error completing interview:", err);
      setError(err.message || "Failed to complete interview");
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="animate-pulse text-center py-4">
          <p>Loading interview data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-700 font-medium mb-2">Error</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Link 
          href="/interviews"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Go Back to Interviews
        </Link>
      </div>
    );
  }

  return (
    <Suspense fallback={null}>
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Active Interview Session</h3>
          <div className="flex gap-2">
            <button
              onClick={completeInterview}
              disabled={isCompleting || completeSuccess}
              className={`text-sm px-3 py-1.5 rounded-md ${
                completeSuccess 
                  ? 'bg-green-600 text-white cursor-default' 
                  : isCompleting 
                  ? 'bg-gray-300 text-gray-600 cursor-wait' 
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {completeSuccess 
                ? '✓ Interview Completed' 
                : isCompleting 
                ? 'Completing...' 
                : 'Complete Interview'}
            </button>
            <Link 
              href={`/interviews`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Back to Interviews
            </Link>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Interview ID: <span className="font-mono text-xs">{currentInterviewId}</span>
        </p>
        <p className="text-green-600 text-sm">
          ✓ Interview data loaded successfully
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Transcript will be saved automatically as the interview progresses
        </p>
        {completeSuccess && (
          <div className="mt-4 bg-green-50 border border-green-200 p-3 rounded-md">
            <p className="text-green-700 text-sm">
              Interview successfully marked as completed. Redirecting to interview details...
            </p>
          </div>
        )}
      </div>
    </Suspense>
  );
};

export default InterviewAgent; 