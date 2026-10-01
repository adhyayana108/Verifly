import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { InlineError } from "../components/ui/ErrorState";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/app";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't sign in. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="flex flex-col gap-1 mb-7">
        <h1 className="text-xl text-ink">Sign in</h1>
        <p className="text-sm text-ink-faint">Enter your credentials to continue.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <InlineError message={error} />}

        <Button type="submit" variant="primary" loading={loading} className="mt-1 w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-faint">
        No account yet?{" "}
        <Link to="/register" className="text-signal hover:text-signal/80 transition-colors">
          Register
        </Link>
      </p>
    </AuthLayout>
  );
}