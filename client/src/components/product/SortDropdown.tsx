interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
  hasSearch?: boolean;
}

const SortDropdown = ({ value, onChange, hasSearch = false }: SortDropdownProps) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
    >
      {hasSearch && <option value="relevance">Most Relevant</option>}
      <option value="featured">Featured</option>
      <option value="newest">Newest</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
      <option value="rating">Rating</option>
    </select>
  );
};

export default SortDropdown;
