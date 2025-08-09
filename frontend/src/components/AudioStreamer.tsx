"use client";

import { useEffect, useRef } from "react";
import { type Socket } from "socket.io-client"; // Usamos 'import type'

type Props = {
  stream: MediaStream | null;
  socket: Socket | null;
};

/**
 * Un componente "headless" que procesa un MediaStream de audio y lo transmite
 * a través de un socket de Socket.IO proporcionado. No renderiza ninguna UI.
 */
export default function AudioStreamer({ stream, socket }: Props) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    // Solo se activa si tenemos un stream y un socket conectado
    if (!stream || !socket || !socket.connected) {
      cleanup(); // Se asegura de limpiar si el stream o el socket se pierden
      return;
    }

    console.log("🎤 AudioStreamer: Iniciando procesamiento de audio...");

    const startStreaming = () => {
      try {
        // 1. Configura el AudioContext para procesar el audio
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)({
          sampleRate: 16000, // Tasa de muestreo requerida por Deepgram
        });
        const audioContext = audioContextRef.current;

        // 2. Crea los nodos de procesamiento
        sourceRef.current = audioContext.createMediaStreamSource(stream);
        processorRef.current = audioContext.createScriptProcessor(1024, 1, 1); // Buffer de 1024, 1 canal de entrada, 1 de salida

        const processor = processorRef.current;
        const source = sourceRef.current;

        // 3. Define la función que se ejecuta cada vez que el buffer se llena
        processor.onaudioprocess = (event) => {
          const inputData = event.inputBuffer.getChannelData(0);

          // Convierte el audio de Float32 a PCM 16-bit
          const buffer = new ArrayBuffer(inputData.length * 2);
          const view = new DataView(buffer);
          for (let i = 0; i < inputData.length; i++) {
            const sample = Math.max(-1, Math.min(1, inputData[i]));
            const int16Sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
            view.setInt16(i * 2, int16Sample, true);
          }

          // 4. Emite el chunk de audio a través del socket proporcionado
          if (socket.connected) {
            socket.emit("audio_chunk", buffer);
          }
        };

        // 5. Conecta los nodos para que el audio fluya
        source.connect(processor);
        processor.connect(audioContext.destination); // Necesario para que onaudioprocess se dispare en algunos navegadores

        console.log("✅ AudioStreamer: Streaming iniciado.");
      } catch (error) {
        console.error("❌ AudioStreamer: Error iniciando el streaming:", error);
      }
    };

    startStreaming();

    // La función de limpieza se ejecuta cuando el componente se desmonta o las props cambian
    return cleanup;
  }, [stream, socket]); // Se re-ejecuta si el stream o el socket cambian

  const cleanup = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    console.log("🧹 AudioStreamer: Limpieza completa.");
  };

  // Este componente no renderiza nada visible en la página
  return null;
}
