"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";

import VideoCall from "@/components/VideoCall";
import AudioStreamer from "@/components/AudioStreamer";

export default function InterviewPage() {
  const { token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  // Estados de la UI
  const [status, setStatus] = useState("Iniciando...");
  const [roomUrl, setRoomUrl] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");

  // Estado y Refs para la lógica
  const [stream, setStream] = useState<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fullAnswerRef = useRef("");
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Se usa un Ref para el stream, para poder acceder a él en la limpieza
  // sin crear un ciclo de dependencias en useEffect.
  const streamRef = useRef<MediaStream | null>(null);
  const handleStream = (s: MediaStream) => {
    setStream(s);
    streamRef.current = s;
  };

  // La lógica del Socket se envuelve en useCallback para estabilizarla
  // y evitar que se re-cree en cada render, lo que ayuda a la limpieza.
  const connectToSocket = useCallback(
    (startData: {
      interviewId: string;
      firstQuestion: string;
      jobSkills: string[];
    }) => {
      const socket = io("http://localhost:3001");
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("Socket conectado:", socket.id);
        socket.emit("start_interview_session", startData);
      });

      socket.on("transcript", (text: string) => {
        setLiveTranscript(text);
        // Se asegura de que todos los fragmentos se capturen
        fullAnswerRef.current += text + " ";

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (fullAnswerRef.current.trim()) {
            setStatus("Procesando tu respuesta...");
            socket.emit("user_finished_speaking", {
              fullAnswer: fullAnswerRef.current,
            });
            fullAnswerRef.current = "";
          }
        }, 2500);
      });

      socket.on("new_question", (data: { question: string }) => {
        setCurrentQuestion(data.question);
        setStatus(`Siguiente pregunta: ${data.question}`);
        setLiveTranscript("");
      });

      socket.on(
        "interview_finished",
        (data: { message: string; result: { id: string } }) => {
          setStatus(data.message);
          router.push(`/interview/results/${data.result.id}`);
        }
      );
    },
    [router]
  );

  // Efecto principal que solo se ejecuta una vez al montar (y al cambiar jobId/token)
  useEffect(() => {
    if (!jobId || !token) return;

    const startInterview = async () => {
      try {
        setStatus("Creando sala de entrevista...");
        const startRes = await fetch("http://localhost:3001/interviews/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ jobId }),
        });
        const startData = await startRes.json();
        if (!startRes.ok) throw new Error(startData.message);

        const roomRes = await fetch(
          "http://localhost:3001/interviews/create-room",
          { method: "POST" }
        );
        const roomData = await roomRes.json();

        setRoomUrl(roomData.url);
        setCurrentQuestion(startData.firstQuestion);
        setStatus(`Pregunta 1: ${startData.firstQuestion}`);

        connectToSocket(startData);
      } catch (error: any) {
        setStatus(`Error: ${error.message}`);
        console.error("Error al iniciar entrevista:", error);
      }
    };
    startInterview();

    // La función de limpieza se define aquí. Solo se llamará cuando el componente
    // se desmonte (es decir, cuando la entrevista realmente termine y naveguemos a otra página).
    return () => {
      console.log(
        "🧹 Desmontando componente de entrevista, ejecutando limpieza..."
      );
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        console.log("🎤 Pistas del micrófono detenidas.");
      }
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
        console.log("🔌 Socket desconectado.");
      }
    };
  }, [jobId, token, connectToSocket]); // dependencias estables

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Entrevista en Progreso
        </h1>
        <p className="text-gray-600 font-mono p-4 bg-gray-100 rounded-lg mt-2">
          <strong>Estado:</strong> {status}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {roomUrl ? (
            <VideoCall roomUrl={roomUrl} onStream={handleStream} />
          ) : (
            <div className="h-[600px] flex items-center justify-center bg-gray-200 rounded-lg">
              Cargando videollamada...
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">Pregunta Actual</h3>
            <p className="text-gray-800 min-h-[60px]">{currentQuestion}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">
              Transcripción en Vivo
            </h3>
            <p className="text-gray-500 italic min-h-[60px]">
              {liveTranscript || "Habla para comenzar..."}
            </p>
          </div>
        </div>
      </div>
      {stream && socketRef.current && (
        <AudioStreamer stream={stream} socket={socketRef.current} />
      )}
    </div>
  );
}
