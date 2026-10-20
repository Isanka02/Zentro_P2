import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import CatalogFilters, { type CatalogFilterValues } from "../components/product/CatalogFilters";
import ProductCard from "../components/product/ProductCard";
import SortDropdown from "../components/product/SortDropdown";
import Pagination from "../components/product/Pagination";
import ProductGridSkeleton from "../components/product/ProductGridSkeleton";
import EmptyState from "../components/product/EmptyState";
import ErrorState from "../components/product/ErrorState";

const Products = () => {
  const [searchParams] = useSearchParams();
  const urlKeyword = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category") || "all";

  return <ProductsContent key={`${urlCategory}:${urlKeyword}`} urlKeyword={urlKeyword} urlCategory={urlCategory} />;
};

const ProductsContent = ({ urlKeyword, urlCategory }: { urlKeyword: string; urlCategory: string }) => {
  const [category, setCategory] = useState(urlCategory);
  const [filters, setFilters] = useState<CatalogFilterValues>({ inStock: false, tag: "" });
  const [sort, setSort] = useState(urlKeyword ? "relevance" : "featured");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useProducts({
    keyword: urlKeyword || undefined,
    category: category === "all" ? undefined : category,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    inStock: filters.inStock,
    minRating: filters.minRating,
    tag: filters.tag || undefined,
    sort,
    page,
    limit: 12,
  });

  const handleCategorySelect = (catId: string) => {
    setCategory(catId);
    setPage(1);
  };

  const handleFiltersApply = (value: CatalogFilterValues) => {
    setFilters(value);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[260px_1fr]">
        <aside>
          <CatalogFilters category={category} filters={filters} onCategoryChange={handleCategorySelect} onApply={handleFiltersApply} />
        </aside>

        <div>
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              {urlKeyword
                ? `Results for "${urlKeyword}"`
                : "All Products"}

              {data && (
                <span className="ml-2 font-normal text-gray-400">
                  ({data.pagination.total})
                </span>
              )}
            </h1>

            <SortDropdown value={sort} onChange={handleSortChange} hasSearch={Boolean(urlKeyword.trim())} />
          </div>

          {isLoading && <ProductGridSkeleton />}

          {isError && <ErrorState onRetry={() => refetch()} />}

          {!isLoading &&
            !isError &&
            data?.products.length === 0 && <EmptyState />}

          {!isLoading &&
            !isError &&
            data &&
            data.products.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {data.products.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                    />
                  ))}
                </div>

                <Pagination
                  page={page}
                  totalPages={data.pagination.totalPages}
                  onPageChange={setPage}
                />
              </>
            )}
        </div>
      </div>
    </div>
  );
};

export default Products;
