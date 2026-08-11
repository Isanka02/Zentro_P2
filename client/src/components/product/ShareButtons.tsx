import { Globe, MessageCircle, Link2, Check } from "lucide-react";
import { useState } from "react";

const ShareButtons = ({ productName }: { productName: string }) => {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 mt-4">
      <span className="text-sm text-gray-500">Share:</span>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-full border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-600"
      >
        <Globe size={16} />
      </a>

      <a
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(productName)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-full border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-600"
      >
        <MessageCircle size={16} />
      </a>
      <button
        onClick={handleCopy}
        className="p-2 rounded-full border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-600"
      >
        {copied ? <Check size={16} className="text-green-600" /> : <Link2 size={16} />}
      </button>
    </div>
  );
};

export default ShareButtons;
