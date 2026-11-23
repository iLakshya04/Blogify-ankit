import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="max-w-xl mx-auto px-4 py-20 text-center">
      <p className="text-sm font-medium text-gray-500 tabular-nums">404</p>
      <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-gray-900">
        Page not found
      </h1>
      <p className="mt-3 text-sm text-gray-600">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block px-4 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
      >
        Back to home
      </Link>
    </main>
  );
}
