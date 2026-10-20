import { Link } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";

const NotFound = () => (
  <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">404 · Page not found</p>
    <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">We can’t find that page</h1>
    <p className="mt-3 max-w-md text-gray-600">The link may be out of date, or the page may have moved. You can continue shopping from the Zentro store.</p>
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      <Link to="/" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
        <ArrowLeft size={16} /> Back to home
      </Link>
      <Link to="/products" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
        <Search size={16} /> Browse products
      </Link>
    </div>
  </main>
);

export default NotFound;
