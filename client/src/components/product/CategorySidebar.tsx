import { useCategories } from "../../hooks/useCategories";

interface CategorySidebarProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

const CategorySidebar = ({ selectedCategory, onSelectCategory }: CategorySidebarProps) => {
  const { data: categories, isLoading } = useCategories();

  return (
    <div className="space-y-1">
      <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>

      <button
        onClick={() => onSelectCategory("all")}
        className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
          selectedCategory === "all" ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        All Categories
      </button>

      {isLoading && <p className="text-sm text-gray-400 px-3 py-2">Loading...</p>}

      {categories?.map((cat) => (
        <button
          key={cat._id}
          onClick={() => onSelectCategory(cat._id)}
          className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
            selectedCategory === cat._id ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
};

export default CategorySidebar;