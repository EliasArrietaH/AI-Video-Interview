"use client";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Define los tipos de datos que esperas recibir de la API
interface Turn {
  id: string;
  question_text: string;
  answer_transcript: string;
  score: number;
}
interface InterviewData {
  id: string;
  final_score: number;
  turns: Turn[];
  job: {
    title: string;
  };
}

export default function ResultsPage() {
  const { token, isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const interviewId = params.interviewId as string;

  const [interviewData, setInterviewData] = useState<InterviewData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!token || !interviewId) return;

    const fetchResults = async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await fetch(
          `http://localhost:3001/interviews/${interviewId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) {
          throw new Error(
            "No se pudieron cargar los resultados de la entrevista."
          );
        }
        const data = await res.json();
        setInterviewData(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [token, interviewId, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Cargando resultados...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!interviewData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        No se encontraron datos para esta entrevista.
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-8 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-2">
          ¡Entrevista Completada!
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Resultados para la oferta:{" "}
          <span className="font-semibold">{interviewData.job.title}</span>
        </p>

        <div className="text-center bg-white p-6 rounded-lg shadow-lg w-fit mx-auto mb-10 border border-gray-200">
          <h2 className="text-md sm:text-lg font-semibold text-gray-500 tracking-widest">
            KENDYL SCORE
          </h2>
          <p className="text-6xl sm:text-7xl font-bold text-indigo-600 my-2">
            {Number(interviewData.final_score).toFixed(1)}
          </p>
          <p className="text-gray-500">/ 100</p>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
            Desglose de la Entrevista
          </h3>
          {interviewData.turns.map((turn, index) => (
            <div
              key={turn.id}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex justify-between items-start gap-4">
                <p className="font-semibold text-gray-800 flex-1">
                  <span className="text-indigo-600">Pregunta {index + 1}:</span>
                  <span className="font-normal ml-2">{turn.question_text}</span>
                </p>
                <span className="text-xl font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
                  {Number(turn.score).toFixed(0)}
                </span>
              </div>
              <p className="mt-3 text-gray-700 border-l-4 border-gray-200 pl-4 py-1">
                <span className="font-semibold">Tu respuesta:</span>
                <span className="italic ml-2">"{turn.answer_transcript}"</span>
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
