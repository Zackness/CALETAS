"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, Loader2, CheckCircle, XCircle } from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correct: number; // índice de la respuesta correcta
  explanation: string;
}

export default function FichasIA() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === "application/pdf") {
      setFile(f);
      setError(null);
    } else {
      setError("Solo se permiten archivos PDF");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setQuestions(null);
    setAnswers([]);
    setFeedback([]);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/ia/fichas", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Error generando cuestionario");
      const data = await res.json();
      setQuestions(data.questions);
      setAnswers(Array(data.questions.length).fill(null));
    } catch (err: any) {
      setError(err.message || "Error generando cuestionario");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (qIdx: number, optIdx: number) => {
    setAnswers((prev) => prev.map((a, i) => (i === qIdx ? optIdx : a)));
  };

  const handleSubmit = () => {
    if (!questions) return;
    const fb = questions.map((q, i) => {
      const correct = answers[i] === q.correct;
      return {
        correct,
        explanation: correct
          ? "¡Respuesta correcta!"
          : `Incorrecto. La respuesta correcta es: "${q.options[q.correct]}". ${q.explanation}`,
      };
    });
    setFeedback(fb);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light px-2">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-special text-[#40C9A9] mb-2">Fichas de Estudio IA</h1>
          <p className="text-white/70 text-base md:text-lg">
            Sube un PDF y la IA generará un cuestionario interactivo para que practiques.
          </p>
        </div>
        {!questions && (
          <form onSubmit={handleUpload} className="bg-[#354B3A] border border-white/10 rounded-2xl shadow-xl p-6 md:p-10 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="file" className="text-white/80">Archivo PDF *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                required
                className="bg-white/10 border-white/20 text-white file:text-white file:bg-[#40C9A9] file:border-0 file:rounded-lg file:px-4 file:py-2 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg mt-1"
              />
              {file && <div className="text-[#40C9A9] text-sm mt-1">Archivo seleccionado: {file.name}</div>}
              {error && <div className="text-red-400 text-sm mt-1">{error}</div>}
            </div>
            <Button
              type="submit"
              className="w-full bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white font-bold text-lg py-3 rounded-xl mt-2 shadow-lg transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin h-5 w-5" /> Generando cuestionario...</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><Upload className="h-5 w-5" /> Generar cuestionario</span>
              )}
            </Button>
          </form>
        )}
        {questions && (
          <div className="bg-[#354B3A] border border-white/10 rounded-2xl shadow-xl p-6 md:p-10 space-y-8 mt-4">
            <h2 className="text-xl font-special text-[#40C9A9] mb-4">Cuestionario generado</h2>
            {questions.map((q, i) => (
              <div key={i} className="mb-6">
                <div className="mb-2 text-white font-bold">{i + 1}. {q.question}</div>
                <div className="flex flex-col gap-2">
                  {q.options.map((opt, j) => (
                    <label key={j} className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors
                      ${answers[i] === j ? "bg-[#40C9A9]/20 border border-[#40C9A9]" : "bg-white/10 border border-white/10"}
                    `}>
                      <input
                        type="radio"
                        name={`q${i}`}
                        checked={answers[i] === j}
                        onChange={() => handleSelect(i, j)}
                        className="accent-[#40C9A9]"
                      />
                      <span className="text-white text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
                {feedback[i] && (
                  <div className={`mt-2 flex items-center gap-2 text-sm ${feedback[i].correct ? "text-[#40C9A9]" : "text-red-400"}`}>
                    {feedback[i].correct ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {feedback[i].explanation}
                  </div>
                )}
              </div>
            ))}
            {!feedback.length && (
              <Button onClick={handleSubmit} className="w-full bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white font-bold text-lg py-3 rounded-xl mt-2 shadow-lg transition-colors">
                Ver resultados
              </Button>
            )}
            {feedback.length > 0 && (
              <Button onClick={() => { setQuestions(null); setAnswers([]); setFeedback([]); setFile(null); }} className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white font-bold text-lg py-3 rounded-xl shadow-lg transition-colors">
                Cargar otro PDF
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 