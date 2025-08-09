"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

// Tipos para los datos
interface Skill {
  id: string;
  name: string;
}

interface CreateJobFormProps {
  onJobCreated: () => void; // Función para notificar al padre que se creó un trabajo
  onClose: () => void; // Función para cerrar el modal
}

export default function CreateJobForm({
  onJobCreated,
  onClose,
}: CreateJobFormProps) {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 1. Carga todas las habilidades disponibles al montar el componente
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await fetch("http://localhost:3001/jobs/skills", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error(`Error del servidor: ${response.statusText}`);
        }
        const data = await response.json();
        setAllSkills(data);
      } catch (err) {
        console.error("Error fetching skills:", err);
        setError("No se pudieron cargar las habilidades.");
      }
    };
    if (token) {
      fetchSkills();
    }
  }, [token]);

  // 2. Maneja la selección de habilidades
  const handleSkillChange = (skillId: string) => {
    const newSelection = new Set(selectedSkills);
    if (newSelection.has(skillId)) {
      newSelection.delete(skillId);
    } else {
      newSelection.add(skillId);
    }
    setSelectedSkills(newSelection);
  };

  // 3. Envía el formulario al backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3001/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          skillIds: Array.from(selectedSkills), // Convierte el Set a un Array
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error al crear la oferta.");
      }

      onJobCreated(); // Notifica al componente padre para que actualice la lista de trabajos
      onClose(); // Cierra el modal
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Estructura del Modal
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Crear Nueva Oferta</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ... Inputs y Checkboxes ... */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
          >
            &times;
          </button>

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Título
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full mt-1 border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Descripción
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="w-full mt-1 border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Habilidades Requeridas
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2 border p-2 rounded-md max-h-40 overflow-y-auto">
              {allSkills.map((skill) => (
                <div key={skill.id} className="flex items-center">
                  <input
                    id={`skill-${skill.id}`}
                    type="checkbox"
                    onChange={() => handleSkillChange(skill.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label
                    htmlFor={`skill-${skill.id}`}
                    className="ml-2 text-sm text-gray-700"
                  >
                    {skill.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-indigo-300"
            >
              {isLoading ? "Creando..." : "Crear Oferta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
