import { useState, type FormEvent } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useCategories } from "../../hooks/useCategories";

export interface CatalogFilterValues {
  minPrice?: number;
  maxPrice?: number;
  inStock: boolean;
  minRating?: number;
  tag: string;
}

interface CatalogFiltersProps {
  category: string;
  filters: CatalogFilterValues;
  onCategoryChange: (category: string) => void;
  onApply: (filters: CatalogFilterValues) => void;
}

const CatalogFilters = ({ category, filters, onCategoryChange, onApply }: CatalogFiltersProps) => {
  const { data: categories, isLoading } = useCategories();
  const [draft, setDraft] = useState(filters);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    const empty: CatalogFilterValues = { inStock: false, tag: "" };
    setDraft(empty);
    setError("");
    onCategoryChange("all");
    onApply(empty);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (draft.minPrice !== undefined && draft.maxPrice !== undefined && draft.minPrice > draft.maxPrice) {
      setError("Minimum price must be less than maximum price.");
      return;
    }
    setError("");
    onApply({ ...draft, tag: draft.tag.trim() });
    setIsOpen(false);
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="hidden items-center gap-2 font-semibold text-gray-900 md:flex"><SlidersHorizontal size={17} />Filters</h2>
        <button type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} className="flex w-full items-center justify-between font-semibold text-gray-900 md:hidden">
          <span className="flex items-center gap-2"><SlidersHorizontal size={17} />Filters</span>
          <span className="text-xs font-normal text-gray-500">{isOpen ? "Hide" : "Show"}</span>
        </button>
      </div>

      <div className={`${isOpen ? "block" : "hidden"} mt-4 md:block`}>
        <div className="space-y-1 border-b border-gray-100 pb-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-800">Categories</h3>
          <button type="button" onClick={() => onCategoryChange("all")} className={`block w-full rounded-md px-3 py-2 text-left text-sm ${category === "all" ? "bg-blue-50 font-medium text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
            All categories
          </button>
          {isLoading && <p className="px-3 py-2 text-sm text-gray-400">Loading categories…</p>}
          {categories?.map((item) => (
            <button key={item._id} type="button" onClick={() => onCategoryChange(item._id)} className={`block w-full rounded-md px-3 py-2 text-left text-sm ${category === item._id ? "bg-blue-50 font-medium text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
              {item.name}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4 pt-4">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-gray-800">Price range (LKR)</legend>
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="catalog-min-price">Minimum price</label>
              <input id="catalog-min-price" type="number" min="0" step="0.01" value={draft.minPrice ?? ""} onChange={(event) => setDraft((value) => ({ ...value, minPrice: event.target.value === "" ? undefined : Number(event.target.value) }))} placeholder="Min" className="w-full min-w-0 rounded-md border border-gray-300 px-2 py-2 text-sm" />
              <span className="text-gray-400">–</span>
              <label className="sr-only" htmlFor="catalog-max-price">Maximum price</label>
              <input id="catalog-max-price" type="number" min="0" step="0.01" value={draft.maxPrice ?? ""} onChange={(event) => setDraft((value) => ({ ...value, maxPrice: event.target.value === "" ? undefined : Number(event.target.value) }))} placeholder="Max" className="w-full min-w-0 rounded-md border border-gray-300 px-2 py-2 text-sm" />
            </div>
          </fieldset>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={draft.inStock} onChange={(event) => setDraft((value) => ({ ...value, inStock: event.target.checked }))} className="size-4 rounded border-gray-300 text-blue-600" />
            In stock only
          </label>

          <label className="block text-sm font-semibold text-gray-800">
            Minimum rating
            <select value={draft.minRating ?? ""} onChange={(event) => setDraft((value) => ({ ...value, minRating: event.target.value === "" ? undefined : Number(event.target.value) }))} className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-normal">
              <option value="">Any rating</option>
              <option value="4">4 stars and up</option>
              <option value="3">3 stars and up</option>
              <option value="2">2 stars and up</option>
              <option value="1">1 star and up</option>
            </select>
          </label>

          <label className="block text-sm font-semibold text-gray-800">
            Product tag
            <input type="search" maxLength={40} value={draft.tag} onChange={(event) => setDraft((value) => ({ ...value, tag: event.target.value }))} placeholder="e.g. cotton, handmade" className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 font-normal" />
          </label>

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">Apply filters</button>
            <button type="button" onClick={reset} className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Clear</button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CatalogFilters;
