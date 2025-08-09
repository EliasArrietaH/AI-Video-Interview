"use client";

import { useEffect, useRef, useState } from "react";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";

let globalCallInstance: DailyCall | null = null;

type Props = {
  roomUrl: string;
  onStream?: (stream: MediaStream) => void;
};

const VideoCall = ({ roomUrl, onStream }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (message: string) => {
    console.log(`[DEBUG] ${message}`);
    setDebugInfo((prev) => [
      ...prev.slice(-10),
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  useEffect(() => {
    if (!roomUrl || !containerRef.current) return;

    const initializeCall = async () => {
      try {
        setIsLoading(true);
        addDebugInfo("Inicializando Daily.co...");

        // Usar instancia global para evitar duplicados
        if (!globalCallInstance) {
          addDebugInfo("Creando nueva instancia Daily");
          globalCallInstance = DailyIframe.createFrame(containerRef.current!, {
            iframeStyle: {
              width: "100%",
              height: "600px",
              border: "0px",
            },
            showLeaveButton: true,
            showFullscreenButton: true,
          });
        } else {
          addDebugInfo("Reutilizando instancia Daily existente");
        }

        const callInstance = globalCallInstance;

        // Event listeners
        callInstance
          .on("joined-meeting", async () => {
            addDebugInfo("✅ Unido a la reunión");
            setIsJoined(true);
            setIsLoading(false);

            // Esperar un poco antes de capturar stream
            setTimeout(() => captureAudioStream(callInstance), 3000);
          })
          .on("track-started", (event) => {
            addDebugInfo(
              `Track iniciado: ${event.track?.kind} - Local: ${event.participant?.local}`
            );

            if (event?.track?.kind === "audio" && event?.participant?.local) {
              addDebugInfo("🎤 Audio track capturado desde evento");
              const stream = new MediaStream([event.track]);
              onStream?.(stream);
            }
          })
          .on("left-meeting", () => {
            addDebugInfo("👋 Salió de la reunión");
            setIsJoined(false);
          })
          .on("error", (error) => {
            addDebugInfo(`❌ Error: ${error.errorMsg || error.message}`);
            setIsLoading(false);
          });

        // Solo unirse si no está conectado
        const currentState = callInstance.meetingState();
        if (currentState === "new" || currentState === "left-meeting") {
          addDebugInfo("Uniéndose a la sala...");
          await callInstance.join({ url: roomUrl });
        } else {
          addDebugInfo(`Ya conectado - Estado: ${currentState}`);
          setIsJoined(true);
          setIsLoading(false);
        }
      } catch (error) {
        addDebugInfo(`❌ Error: ${error.message}`);
        setIsLoading(false);
      }
    };

    const captureAudioStream = async (callInstance: DailyCall) => {
      try {
        addDebugInfo("Capturando stream de audio...");

        // Obtener stream directamente desde getUserMedia
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000,
            channelCount: 1,
          },
        });

        addDebugInfo(
          `🎤 Stream capturado: ${stream.getAudioTracks().length} tracks`
        );
        onStream?.(stream);
      } catch (error) {
        addDebugInfo(`❌ Error capturando: ${error.message}`);
      }
    };

    initializeCall();

    // No hacer cleanup aquí para evitar duplicados
    return () => {
      // Cleanup solo en desmontaje final
    };
  }, [roomUrl]);

  // Cleanup global solo al cerrar aplicación
  useEffect(() => {
    return () => {
      if (globalCallInstance) {
        globalCallInstance.destroy().catch(console.error);
        globalCallInstance = null;
      }
    };
  }, []);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm ${
            isJoined
              ? "bg-green-100 text-green-800"
              : isLoading
              ? "bg-yellow-100 text-yellow-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {isJoined
            ? "🟢 Conectado"
            : isLoading
            ? "🟡 Conectando..."
            : "⚪ Desconectado"}
        </span>
      </div>

      <div
        ref={containerRef}
        className="w-full h-[600px] border rounded-lg bg-gray-100"
      >
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-600">Iniciando videollamada...</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-3 rounded border">
        <h3 className="font-semibold text-sm mb-2">Debug Info:</h3>
        <div className="text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto">
          {debugInfo.map((info, i) => (
            <div key={i} className="font-mono">
              {info}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
