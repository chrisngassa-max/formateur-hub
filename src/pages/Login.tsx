import { BadgeEuro, LineChart, ShieldCheck } from "lucide-react";
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

  if (loading) return <div className="page"><p>Chargement...</p></div>;
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
      else setInfo("Compte cree. Verifiez votre email si la confirmation est activee, sinon vous pouvez vous connecter.");
    }
    setBusy(false);
  }

  return (
    <main className="auth-page">
      <section className="auth-brand">
        <div className="auth-brand-inner">
          <span className="brand-mark" aria-hidden="true">FP</span>
          <div>
            <p className="sidebar-kicker">FormaPredict</p>
            <h1>Prequalifiez les financements sans perdre le fil.</h1>
          </div>
          <p>
            Un espace conseiller pour prioriser les dossiers, suivre les pieces et estimer le reste a charge.
          </p>
          <div className="auth-proof" aria-label="Points forts">
            <span><ShieldCheck size={16} /> Dossiers securises</span>
            <span><LineChart size={16} /> Scores lisibles</span>
            <span><BadgeEuro size={16} /> CPF & aides</span>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <header>
            <p className="eyebrow">Espace conseiller</p>
            <h2>{mode === "signin" ? "Connexion" : "Creer un compte"}</h2>
            <p>Accedez a vos projections et dossiers candidats.</p>
          </header>

          {configError && <p className="ai-error">{configError}</p>}

          <form onSubmit={onSubmit} className="auth-form">
            {mode === "signup" && (
              <>
                <label>
                  Prenom
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </label>
                <label>
                  Nom
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </label>
              </>
            )}
            <label>
              Email
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
              Mot de passe
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {error && <p className="ai-error">{error}</p>}
            {info && <p>{info}</p>}
            <button type="submit" disabled={busy || Boolean(configError)}>
              {busy ? "..." : mode === "signin" ? "Se connecter" : "Creer le compte"}
            </button>
          </form>

          <p className="auth-switch">
            {mode === "signin" ? "Pas de compte ?" : "Deja un compte ?"}{" "}
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setInfo(null);
              }}
            >
              {mode === "signin" ? "Creer un compte" : "Se connecter"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
