export interface ExerciseResults {
  exercise_type?: string;
  exerciseType?: string;
  count: number;
  goal: number;
  duration: number;
  completed: boolean;
}

export interface SessionStatus {
  mode: string;
  remaining_seconds: number;
  reps: number;
  posture_score: number;
  running: boolean;
}

export interface SessionConfig {
  focus_seconds: number;
  break_seconds: number;
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  `${window.location.protocol}//${window.location.hostname}:8000`;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Request failed (${response.status}): ${body}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const fetchExerciseResults = (signal?: AbortSignal) => {
  return request<ExerciseResults>("/exercise/results", { signal });
};

export const fetchSessionStatus = (signal?: AbortSignal) => {
  return request<SessionStatus>("/session/status", { signal });
};

export const startSession = (config: SessionConfig) => {
  return request<{ status: string }>("/session/start", {
    method: "POST",
    body: JSON.stringify(config),
  });
};

export const stopSession = () => {
  return request<{ status: string }>("/session/stop", { method: "POST" });
};

