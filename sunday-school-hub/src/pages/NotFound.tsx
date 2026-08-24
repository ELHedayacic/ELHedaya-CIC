import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Compass className="h-10 w-10 text-aurora-500" />
      <h1 className="mt-4 font-display text-2xl font-semibold text-twilight-50">Page not found</h1>
      <p className="mt-2 text-sm text-twilight-200">The page you are looking for does not exist.</p>
      <Link to="/" className="btn-primary mt-6">
        Back home
      </Link>
    </div>
  );
}
