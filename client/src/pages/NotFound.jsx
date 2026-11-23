import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="max-w-xl mx-auto px-4 py-20 text-center">
      <p className="text-sm font-medium text-amber-700 tabular-nums">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#111214]">
        Page not found
      </h1>
      <p className="mt-3 text-sm text-stone-600">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block px-4 py-2.5 text-sm font-medium text-white bg-[#121316] hover:bg-stone-800 rounded-lg transition-colors"
      >
        Back to home
      </Link>
    </main>
  );
}
