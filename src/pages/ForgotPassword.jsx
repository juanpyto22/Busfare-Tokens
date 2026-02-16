import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setError("Error: " + error.message);
    } else {
      setMessage("¡Revisa tu correo para restablecer la contraseña!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#050911] via-[#0a1628] to-[#050911] p-4">
      <div className="w-full max-w-md bg-[#10182a] rounded-xl shadow-lg p-8 border border-blue-900/40 relative z-10">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-200">Recuperar contraseña</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-blue-200 font-semibold">Correo electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-[#0a1628] border border-blue-800 text-blue-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:from-cyan-400 hover:to-blue-500 transition shadow-md"
          >
            Enviar enlace
          </button>
          {message && <div className="text-green-400 text-center font-semibold">{message}</div>}
          {error && <div className="text-red-400 text-center font-semibold">{error}</div>}
        </form>
      </div>
    </div>
  );
}