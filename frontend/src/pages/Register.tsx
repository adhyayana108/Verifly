import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { InlineError } from "../components/ui/ErrorState";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordTooShort = password.length > 0 && password.length < 8;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(username, email, password);
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create your account. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="flex flex-col gap-1 mb-7">
        <h1 className="text-xl text-ink">Create an account</h1>
        <p className="text-sm text-ink-faint">Create your account to get started.</p>
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
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={!passwordTooShort ? "At least 8 characters." : undefined}
          error={passwordTooShort ? "At least 8 characters." : undefined}
          required
        />

        {error && <InlineError message={error} />}

        <Button type="submit" variant="primary" loading={loading} className="mt-1 w-full">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-faint">
        Already have an account?{" "}
        <Link to="/login" className="text-signal hover:text-signal/80 transition-colors">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}