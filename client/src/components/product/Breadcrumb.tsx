import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface BreadcrumbProps {
  category: { name: string; slug: string };
  productName: string;
}

const Breadcrumb = ({ category, productName }: BreadcrumbProps) => {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-4 flex-wrap">
      <Link to="/" className="hover:text-blue-600">Home</Link>
      <ChevronRight size={14} />
      <Link to={`/?category=${category.slug}`} className="hover:text-blue-600">
        {category.name}
      </Link>
      <ChevronRight size={14} />
      <span className="text-gray-900 truncate">{productName}</span>
    </nav>
  );
};

export default Breadcrumb;