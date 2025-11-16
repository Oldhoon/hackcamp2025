import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "./ui/card";

interface CameraPreviewProps {
  active: boolean;
  title?: string;
  streamUrl?: string;
}

export const CameraPreview = ({ active, title = "Live Preview", streamUrl }: CameraPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [imgError, setImgError] = useState<string | null>(null);
  const [useLocal, setUseLocal] = useState(false);

  const resolvedStreamUrl = useMemo(() => {
    if (streamUrl) return streamUrl;
    const envUrl = import.meta.env.VITE_LANDMARK_STREAM_URL as string | undefined;
    if (envUrl) return envUrl;
    return `${window.location.protocol}//${window.location.hostname}:8000/session/preview`;
  }, [streamUrl]);

  useEffect(() => {
    // If a backend stream URL is provided, don't open the local camera.
    if (resolvedStreamUrl && !useLocal) return;

    const startStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Unable to access camera:", err);
      }
    };

    if (active) {
      startStream();
    } else if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [active, resolvedStreamUrl, useLocal]);

  return (
    <Card
      className="column"
      style={{
        gap: "0.5rem",
        padding: "1rem",
        background: "#fff",
      }}
    >
      <p className="emphasis" style={{ margin: 0 }}>
        {title}
      </p>
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingBottom: "56.25%",
          borderRadius: "12px",
          overflow: "hidden",
          background: "#11181c",
        }}
      >
        {resolvedStreamUrl && !useLocal ? (
          <img
            src={resolvedStreamUrl}
            alt="Landmarks stream"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            onError={() => {
              setImgError("Unable to load stream from backend, switching to local camera");
              setUseLocal(true);
            }}
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
      </div>
      <p className="muted small" style={{ margin: 0 }}>
        {imgError
          ? imgError
          : resolvedStreamUrl
          ? "Preview from backend (with landmarks)"
          : "Local camera preview"}
      </p>
    </Card>
  );
};
