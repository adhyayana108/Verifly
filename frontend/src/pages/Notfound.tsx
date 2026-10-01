import { Link } from "react-router";
import { Button } from "../components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-sm text-ink-faint">404</p>
      <h1 className="font-mono text-xl text-ink">That page doesn't exist.</h1>
      <p className="text-sm text-ink-dim max-w-sm">Check the address, or head back to somewhere that does.</p>
      <Link to="/">
        <Button variant="secondary" size="sm">
          Back to VERIFLY
        </Button>
      </Link>
    </div>
  );
}