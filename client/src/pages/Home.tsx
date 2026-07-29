import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import ProductCard from "../components/product/ProductCard";
import CategorySidebar from "../components/product/CategorySidebar";
import PriceFilter from "../components/product/PriceFilter";
import SortDropdown from "../components/product/SortDropdown";
import Pagination from "../components/product/Pagination";
import ProductGridSkeleton from "../components/product/ProductGridSkeleton";
import EmptyState from "../components/product/EmptyState";
import ErrorState from "../components/product/ErrorState";

const Home = () => {
  const [searchParams] = useSearchParams();
  const urlKeyword = searchParams.get("search") || "";

  const [category, setCategory] = useState("all");
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({});
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useProducts({
    keyword: urlKeyword || undefined,
    category: category === "all" ? undefined : category,
    minPrice: priceRange.min,
    maxPrice: priceRange.max,
    sort,
    page,
    limit: 12,
  });

  const handleCategorySelect = (catId: string) => {
    setCategory(catId);
    setPage(1);
  };

  const handlePriceApply = (min: string, max: string) => {
    setPriceRange({ min: min ? Number(min) : undefined, max: max ? Number(max) : undefined });
    setPage(1);
  };

  const handlePriceClear = () => {
    setPriceRange({});
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        <aside className="hidden md:block">
          <CategorySidebar selectedCategory={category} onSelectCategory={handleCategorySelect} />
          <PriceFilter onApply={handlePriceApply} onClear={handlePriceClear} />
        </aside>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold text-gray-900">
              {urlKeyword ? `Results for "${urlKeyword}"` : "All Products"}
              {data && <span className="text-gray-400 font-normal ml-2">({data.pagination.total})</span>}
            </h1>
            <SortDropdown value={sort} onChange={handleSortChange} />
          </div>

          {isLoading && <ProductGridSkeleton />}

          {isError && <ErrorState onRetry={() => refetch()} />}

          {!isLoading && !isError && data?.products.length === 0 && <EmptyState />}

          {!isLoading && !isError && data && data.products.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {data.products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              <Pagination page={page} totalPages={data.pagination.totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;