import { BadgeEuro, LineChart, ShieldCheck, UserPlus, LogIn, ArrowRight } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function Login() {
  const { signIn, signUp, user, loading, configError } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center"><p className="text-zinc-500 animate-pulse">Chargement...</p></div>;
  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    if (mode === "signin") {
      const { error } = await signIn(email, password);
      if (error) setError(error);
      else navigate("/");
    } else {
      const { error } = await signUp(email, password, firstName, lastName);
      if (error) setError(error);
      else setInfo("Compte créé. Vérifiez votre email si la confirmation est activée, sinon vous pouvez vous connecter.");
    }
    setBusy(false);
  }

  return (
    <main className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Left side: Branding */}
      <section className="flex-1 bg-indigo-950 text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-900 blur-3xl opacity-50" aria-hidden="true" />
        
        <div className="relative z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-lg mb-8">
            FP
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">FormaPredict</p>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6">
            Préqualifiez les financements sans perdre le fil.
          </h1>
          <p className="text-lg text-indigo-200 max-w-xl">
            Un espace conseiller pour prioriser les dossiers, suivre les pièces et estimer le reste à charge.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-6 mt-12 lg:mt-0 text-sm font-medium text-indigo-100">
          <span className="flex items-center gap-2"><ShieldCheck size={20} className="text-indigo-400" /> Dossiers sécurisés</span>
          <span className="flex items-center gap-2"><LineChart size={20} className="text-indigo-400" /> Scores lisibles</span>
          <span className="flex items-center gap-2"><BadgeEuro size={20} className="text-indigo-400" /> CPF & aides</span>
        </div>
      </section>

      {/* Right side: Login Form */}
      <section className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-zinc-50">
        <div className="w-full max-w-md flex flex-col gap-8 rounded-3xl bg-white p-8 sm:p-10 shadow-xl border border-zinc-100 relative">
          
          <header className="flex flex-col gap-2 text-center items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-2">
              {mode === "signin" ? <LogIn size={24} /> : <UserPlus size={24} />}
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Espace conseiller</p>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              {mode === "signin" ? "Connexion" : "Créer un compte"}
            </h2>
          </header>

          {configError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 text-center">
              {configError}
            </div>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {mode === "signup" && (
              <div className="flex gap-4">
                <label className="flex flex-col gap-1.5 flex-1">
                  <span className="text-sm font-semibold text-zinc-700">Prénom</span>
                  <input 
                    className="h-11 rounded-lg border border-zinc-300 bg-white px-4 text-sm shadow-sm placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    placeholder="Jean"
                  />
                </label>
                <label className="flex flex-col gap-1.5 flex-1">
                  <span className="text-sm font-semibold text-zinc-700">Nom</span>
                  <input 
                    className="h-11 rounded-lg border border-zinc-300 bg-white px-4 text-sm shadow-sm placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    placeholder="Dupont"
                  />
                </label>
              </div>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-zinc-700">Email</span>
              <input 
                type="email" 
                required 
                className="h-11 rounded-lg border border-zinc-300 bg-white px-4 text-sm shadow-sm placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="jean.dupont@exemple.com"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-zinc-700">Mot de passe</span>
              <input 
                type="password" 
                required 
                minLength={6} 
                className="h-11 rounded-lg border border-zinc-300 bg-white px-4 text-sm shadow-sm placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
              />
            </label>
            
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
            {info && <p className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100">{info}</p>}
            
            <button 
              type="submit" 
              disabled={busy || Boolean(configError)}
              className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
            >
              {busy ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                <>
                  {mode === "signin" ? "Se connecter" : "Créer le compte"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="flex flex-col items-center gap-3 pt-4 border-t border-zinc-100">
            <p className="text-sm text-zinc-500">
              {mode === "signin" ? "Vous n'avez pas encore de compte ?" : "Vous avez déjà un compte ?"}
            </p>
            <button
              type="button"
              className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setInfo(null);
              }}
            >
              {mode === "signin" ? "Créer un compte conseiller" : "Connectez-vous à votre espace"}
            </button>
          </div>

        </div>
      </section>
    </main>
  );
}
