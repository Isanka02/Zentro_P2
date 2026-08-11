import { useProducts } from "../../hooks/useProducts";
import ProductCard from "./ProductCard";

interface RelatedProductsProps {
  categoryId: string;
  excludeProductId: string;
}

const RelatedProducts = ({ categoryId, excludeProductId }: RelatedProductsProps) => {
  const { data, isLoading } = useProducts({ category: categoryId, limit: 5 });

  const related = data?.products.filter((p) => p._id !== excludeProductId).slice(0, 4);

  if (isLoading || !related || related.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">You may also like</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {related.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;