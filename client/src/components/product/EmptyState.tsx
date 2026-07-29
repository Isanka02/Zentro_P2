import { PackageX } from "lucide-react";

const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <PackageX size={48} className="text-gray-300 mb-3" />
      <h3 className="text-gray-900 font-medium">No products found</h3>
      <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search terms</p>
    </div>
  );
};

export default EmptyState;