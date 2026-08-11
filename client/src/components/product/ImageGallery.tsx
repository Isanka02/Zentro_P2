import { useState } from "react";

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

const FALLBACK = "https://placehold.co/600x600?text=No+Image";

const ImageGallery = ({ images, productName }: ImageGalleryProps) => {
  const gallery = images.length > 0 ? images : [FALLBACK];
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div>
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
        <img
          src={gallery[activeIndex]}
          alt={productName}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK;
          }}
        />
      </div>

      {gallery.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {gallery.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${
                i === activeIndex ? "border-blue-600" : "border-gray-200"
              }`}
            >
              <img
                src={img}
                alt={`${productName} thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK;
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;