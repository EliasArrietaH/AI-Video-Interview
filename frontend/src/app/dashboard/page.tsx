"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import CreateJobForm from "@/components/CreateJobForm";

// Define los tipos de datos
interface Skill {
  id: string;
  name: string;
}
interface Job {
  id: string;
  title: string;
  description: string;
  skills: Skill[];
}

export default function DashboardPage() {
  const { user, token, isAuthenticated, logout } = useAuth(); // Obtenemos el usuario
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // <-- Estado para el modal

  // useCallback para evitar re-crear la función en cada render
  const fetchJobs = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3001/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      fetchJobs();
    }
  }, [isAuthenticated, router, fetchJobs]);

  const handleStartInterview = (jobId: string) => {
    router.push(`/interview/${jobId}`);
  };

  return (
    <div className="container mx-auto p-4">
      {/* Botón para cerrar sesión */}
      <button
        onClick={logout}
        className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white rounded"
      >
        Cerrar Sesión
      </button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Ofertas Disponibles</h1>
        {/* Solo muestra el botón si el usuario es de tipo 'business' */}
        {user?.role === "business" && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            + Crear Nueva Oferta
          </button>
        )}
      </div>

      {isLoading ? (
        <p>Cargando ofertas...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="p-4 border rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold">{job.title}</h2>
              <p className="text-gray-600 my-2">{job.description}</p>
              <div className="flex flex-wrap gap-2 my-3">
                {job.skills.map((s) => (
                  <span
                    key={s.id}
                    className="px-2 py-1 bg-gray-200 text-sm rounded-full"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
              {/* Solo el talento puede iniciar la entrevista */}
              {user?.role === "talent" && (
                <button
                  onClick={() => handleStartInterview(job.id)}
                  className="w-full mt-2 px-4 py-2 bg-green-500 text-white rounded"
                >
                  Iniciar Entrevista
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Renderiza el modal condicionalmente */}
      {isModalOpen && (
        <CreateJobForm
          onClose={() => setIsModalOpen(false)}
          onJobCreated={() => {
            fetchJobs(); // Actualiza la lista de trabajos cuando se crea uno nuevo
          }}
        />
      )}
    </div>
  );
}
