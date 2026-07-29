import { useState } from "react";

interface PriceFilterProps {
  onApply: (min: string, max: string) => void;
  onClear: () => void;
}

const PriceFilter = ({ onApply, onClear }: PriceFilterProps) => {
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const handleClear = () => {
    setMin("");
    setMax("");
    onClear();
  };

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Min"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
        <span className="text-gray-400">-</span>
        <input
          type="number"
          placeholder="Max"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => onApply(min, max)}
          className="flex-1 bg-blue-600 text-white text-sm py-1.5 rounded-md hover:bg-blue-700"
        >
          Apply
        </button>
        <button
          onClick={handleClear}
          className="flex-1 border border-gray-300 text-gray-600 text-sm py-1.5 rounded-md hover:bg-gray-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default PriceFilter;