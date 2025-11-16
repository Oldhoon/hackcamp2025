const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ExerciseResultsResponse {
  exerciseType: 'squats' | 'pushups' | 'situps';
  count: number;
  goal: number;
  duration: number; // in seconds
  completed: boolean;
}

export interface SessionStatus {
  mode: string;
  remaining_seconds: number;
  reps: number;
  posture_score: number;
  running: boolean;
}

export const fetchExerciseResults = async (): Promise<ExerciseResultsResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/exercise/results`);
  if (!response.ok) {
    throw new Error('Failed to fetch exercise results');
  }
  return response.json();
};

export const fetchSessionStatus = async (): Promise<SessionStatus> => {
  const response = await fetch(`${API_BASE_URL}/session/status`);
  if (!response.ok) {
    throw new Error('Failed to fetch session status');
  }
  return response.json();
};
