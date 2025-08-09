// "use client";

// import { useEffect } from "react";
// import { io } from "socket.io-client";

// const socket = io("http://localhost:3001");

// export default function AudioStreamer({ stream }: { stream: MediaStream }) {
//   useEffect(() => {
//     const audioContext = new AudioContext({ sampleRate: 16000 });
//     const source = audioContext.createMediaStreamSource(stream);
//     const processor = audioContext.createScriptProcessor(4096, 1, 1);

//     source.connect(processor);
//     processor.connect(audioContext.destination);

//     processor.onaudioprocess = (e) => {
//       const inputData = e.inputBuffer.getChannelData(0);
//       const buffer = new ArrayBuffer(inputData.length * 2);
//       const outputData = new DataView(buffer);

//       for (let i = 0; i < inputData.length; i++) {
//         let s = inputData[i] * 32767;
//         s = Math.max(-32768, Math.min(32767, s));
//         outputData.setInt16(i * 2, s, true);
//       }

//       socket.emit("audio_chunk", buffer);
//     };

//     return () => {
//       processor.disconnect();
//       source.disconnect();
//       audioContext.close();
//     };
//   }, [stream]);

//   return null;
// }

// 3. AudioStreamer.tsx - CON INICIALIZACIÓN MANUAL
// "use client";

// import { useEffect, useRef, useState } from "react";
// import { io, Socket } from "socket.io-client";

// type Props = {
//   stream: MediaStream | null;
// };

// export default function AudioStreamer({ stream }: Props) {
//   const socketRef = useRef<Socket | null>(null);
//   const audioContextRef = useRef<AudioContext | null>(null);
//   const processorRef = useRef<ScriptProcessorNode | null>(null);
//   const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
//   const [isStreaming, setIsStreaming] = useState(false);
//   const [transcription, setTranscription] = useState("");
//   const [socketConnected, setSocketConnected] = useState(false);
//   const [transcriptionStarted, setTranscriptionStarted] = useState(false);

//   // Inicializar socket
//   useEffect(() => {
//     if (!socketRef.current) {
//       console.log("🔌 Conectando a WebSocket...");
//       socketRef.current = io("http://localhost:3001");

//       socketRef.current.on("connect", () => {
//         console.log("✅ WebSocket conectado");
//         setSocketConnected(true);
//       });

//       socketRef.current.on("disconnect", () => {
//         console.log("❌ WebSocket desconectado");
//         setSocketConnected(false);
//       });

//       socketRef.current.on("transcript", (text: string) => {
//         console.log("📝 Transcripción recibida:", text);
//         setTranscription((prev) => prev + " " + text);
//       });
//     }

//     return () => {
//       if (socketRef.current) {
//         socketRef.current.disconnect();
//         socketRef.current = null;
//         setSocketConnected(false);
//       }
//     };
//   }, []);

//   // Manejar stream de audio
//   useEffect(() => {
//     if (!stream || !transcriptionStarted) {
//       cleanup();
//       return;
//     }

//     console.log("🎵 Iniciando procesamiento de audio...");

//     const startStreaming = async () => {
//       try {
//         // Crear AudioContext
//         audioContextRef.current = new (window.AudioContext ||
//           (window as any).webkitAudioContext)({
//           sampleRate: 16000,
//         });

//         const audioContext = audioContextRef.current;
//         sourceRef.current = audioContext.createMediaStreamSource(stream);
//         processorRef.current = audioContext.createScriptProcessor(1024, 1, 1);

//         const processor = processorRef.current;
//         const source = sourceRef.current;

//         processor.onaudioprocess = (event) => {
//           const inputData = event.inputBuffer.getChannelData(0);

//           // Convertir a Int16Array
//           const buffer = new ArrayBuffer(inputData.length * 2);
//           const view = new DataView(buffer);

//           for (let i = 0; i < inputData.length; i++) {
//             const sample = Math.max(-1, Math.min(1, inputData[i]));
//             const int16Sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
//             view.setInt16(i * 2, int16Sample, true);
//           }

//           // Enviar al backend
//           if (socketRef.current?.connected) {
//             socketRef.current.emit("audio_chunk", buffer);
//           }
//         };

//         // Conectar nodos
//         source.connect(processor);
//         processor.connect(audioContext.destination);

//         setIsStreaming(true);
//         console.log("✅ Streaming iniciado");
//       } catch (error) {
//         console.error("❌ Error iniciando streaming:", error);
//       }
//     };

//     startStreaming();
//     return cleanup;
//   }, [stream, transcriptionStarted]);

//   const startTranscription = () => {
//     if (socketRef.current?.connected) {
//       console.log("🚀 Iniciando transcripción...");
//       socketRef.current.emit("start_transcription");
//       setTranscriptionStarted(true);
//     }
//   };

//   const stopTranscription = () => {
//     console.log("🛑 Deteniendo transcripción...");
//     setTranscriptionStarted(false);
//     cleanup();
//   };

//   const cleanup = () => {
//     setIsStreaming(false);

//     if (processorRef.current) {
//       processorRef.current.disconnect();
//       processorRef.current = null;
//     }

//     if (sourceRef.current) {
//       sourceRef.current.disconnect();
//       sourceRef.current = null;
//     }

//     if (audioContextRef.current && audioContextRef.current.state !== "closed") {
//       audioContextRef.current.close();
//       audioContextRef.current = null;
//     }
//   };

//   return (
//     <div className="space-y-4">
//       {/* Controles */}
//       <div className="bg-blue-50 p-4 rounded border">
//         <h3 className="font-semibold text-lg mb-4">Control de Transcripción</h3>

//         <div className="flex gap-3 mb-4">
//           <button
//             onClick={startTranscription}
//             disabled={!stream || !socketConnected || transcriptionStarted}
//             className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
//           >
//             {transcriptionStarted
//               ? "🎤 Transcribiendo..."
//               : "Iniciar Transcripción"}
//           </button>

//           <button
//             onClick={stopTranscription}
//             disabled={!transcriptionStarted}
//             className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
//           >
//             Detener
//           </button>
//         </div>

//         {/* Estados */}
//         <div className="grid grid-cols-3 gap-4 text-sm">
//           <div
//             className={`flex items-center gap-2 ${
//               socketConnected ? "text-green-600" : "text-red-600"
//             }`}
//           >
//             <span
//               className={`w-2 h-2 rounded-full ${
//                 socketConnected ? "bg-green-500" : "bg-red-500"
//               }`}
//             ></span>
//             WebSocket
//           </div>
//           <div
//             className={`flex items-center gap-2 ${
//               stream ? "text-green-600" : "text-red-600"
//             }`}
//           >
//             <span
//               className={`w-2 h-2 rounded-full ${
//                 stream ? "bg-green-500" : "bg-red-500"
//               }`}
//             ></span>
//             Audio Stream
//           </div>
//           <div
//             className={`flex items-center gap-2 ${
//               isStreaming ? "text-green-600" : "text-red-600"
//             }`}
//           >
//             <span
//               className={`w-2 h-2 rounded-full ${
//                 isStreaming ? "bg-green-500 animate-pulse" : "bg-red-500"
//               }`}
//             ></span>
//             Procesando
//           </div>
//         </div>
//       </div>

//       {/* Transcripción */}
//       <div className="bg-gray-50 p-4 rounded border">
//         <h3 className="font-semibold text-lg mb-2">Transcripción en Vivo</h3>

//         <div className="bg-white p-4 rounded border min-h-[150px] max-h-[300px] overflow-y-auto">
//           {transcription ? (
//             <p className="text-gray-800 leading-relaxed">{transcription}</p>
//           ) : (
//             <p className="text-gray-400 italic">
//               {transcriptionStarted
//                 ? "Escuchando... habla cerca del micrófono"
//                 : 'Presiona "Iniciar Transcripción" y habla'}
//             </p>
//           )}
//         </div>

//         {transcription && (
//           <button
//             onClick={() => setTranscription("")}
//             className="mt-3 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
//           >
//             Limpiar transcripción
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }

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
