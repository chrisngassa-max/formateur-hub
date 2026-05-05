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

  if (loading) return <div className="page"><p>Chargement…</p></div>;
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
    <div className="page narrow">
      <header className="page-header">
        <div>
          <p className="eyebrow">FormaPredict</p>
          <h2>{mode === "signin" ? "Connexion" : "Créer un compte"}</h2>
          <p>Accédez à l'espace conseiller.</p>
        </div>
      </header>
      <section className="panel">
        {configError && <p className="ai-error">{configError}</p>}
        <form onSubmit={onSubmit} className="auth-form" style={{ display: "grid", gap: 12 }}>
          {mode === "signup" && (
            <>
              <label>Prénom<input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></label>
              <label>Nom<input value={lastName} onChange={(e) => setLastName(e.target.value)} /></label>
            </>
          )}
          <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Mot de passe<input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {error && <p className="ai-error">{error}</p>}
          {info && <p>{info}</p>}
          <button type="submit" disabled={busy || Boolean(configError)}>
            {busy ? "..." : mode === "signin" ? "Se connecter" : "Créer le compte"}
          </button>
        </form>
        <p style={{ marginTop: 16 }}>
          {mode === "signin" ? "Pas de compte ?" : "Déjà un compte ?"}{" "}
          <button className="secondary" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setInfo(null); }}>
            {mode === "signin" ? "Créer un compte" : "Se connecter"}
          </button>
        </p>
      </section>
    </div>
  );
}
