import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Pencil,
  Archive,
  RotateCcw,
  Package,
  Loader2,
  AlertTriangle,
  X,
  Star,
  ImagePlus,
} from "lucide-react";
import type { FormEvent, ChangeEvent } from "react";

import {
  createProduct,
  fetchProducts,
  setProductAvailability,
  updateProduct,
  type Product,
  type ProductInput,
} from "../../api/products";

import { fetchCategories } from "../../api/categories";
import { getErrorMessage } from "../../lib/errorMessage";
import Pagination from "../../components/product/Pagination";

interface ProductFormState {
  name: string;
  description: string;
  price: string;
  discountPrice: string;
  category: string;
  stock: string;
  tags: string;
  isFeatured: boolean;
  variants: Array<{ _id?: string; label: string; sku: string; price: string; discountPrice: string; stock: string }>;
}

const emptyForm: ProductFormState = {
  name: "",
  description: "",
  price: "",
  discountPrice: "",
  category: "",
  stock: "0",
  tags: "",
  isFeatured: false,
  variants: [],
};

const AdminProducts = () => {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const productsQueryKey = ["admin-products", search, page] as const;
  const productsQuery = useQuery({
    queryKey: productsQueryKey,
    queryFn: () => fetchProducts({ keyword: search || undefined, page, limit: 50, sort: "newest", includeInactive: true }),
  });
  const categoriesQuery = useQuery({ queryKey: ["admin-categories"], queryFn: fetchCategories });
  const products = productsQuery.data?.products ?? [];
  const categories = categoriesQuery.data ?? [];
  const loading = productsQuery.isLoading;
  const totalPages = Math.max(1, productsQuery.data?.pagination.totalPages ?? 1);
  const productsError = productsQuery.isError ? getErrorMessage(productsQuery.error, "Failed to load products") : "";
  const categoriesError = categoriesQuery.isError ? getErrorMessage(categoriesQuery.error, "Failed to load categories") : "";
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [form, setForm] =
    useState<ProductFormState>(emptyForm);

  // Image upload state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const openCreateForm = () => {
    setEditingProduct(null);
    setForm(emptyForm);

    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);

    setShowForm(true);
    setError("");
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);

    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      discountPrice:
        product.discountPrice !== undefined
          ? String(product.discountPrice)
          : "",
      category: product.category._id,
      stock: String(product.stock),
      tags: product.tags.join(", "),
      isFeatured: product.isFeatured,
      variants: (product.variants ?? []).map((variant) => ({
        _id: variant._id,
        label: variant.label,
        sku: variant.sku ?? "",
        price: String(variant.price),
        discountPrice: variant.discountPrice === undefined ? "" : String(variant.discountPrice),
        stock: String(variant.stock),
      })),
    });

    // Existing Cloudinary/product images
    setExistingImages(product.images);

    // New files start empty when editing
    setImageFiles([]);
    setImagePreviews([]);

    setShowForm(true);
    setError("");
  };

  const closeForm = () => {
    // Release temporary preview URLs
    imagePreviews.forEach((preview) =>
      URL.revokeObjectURL(preview)
    );

    setShowForm(false);
    setEditingProduct(null);
    setForm(emptyForm);

    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    setError("");
  };

  const handleChange = (
    field: keyof ProductFormState,
    value: string | boolean
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateVariant = (index: number, field: "label" | "sku" | "price" | "discountPrice" | "stock", value: string) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, currentIndex) => currentIndex === index ? { ...variant, [field]: value } : variant),
    }));
  };

  // Select images from device
  const handleImageSelect = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const remainingSlots =
      5 - existingImages.length - imageFiles.length;

    if (remainingSlots <= 0) {
      setError("You can upload a maximum of 5 images.");
      event.target.value = "";
      return;
    }

    // Only accept images that fit into the remaining slots
    const selectedFiles = files.slice(0, remainingSlots);

    // Check file types
    const invalidFile = selectedFiles.find(
      (file) => !file.type.startsWith("image/")
    );

    if (invalidFile) {
      setError("Only image files are allowed.");
      event.target.value = "";
      return;
    }

    // Check file sizes
    const tooLarge = selectedFiles.find(
      (file) => file.size > 5 * 1024 * 1024
    );

    if (tooLarge) {
      setError("Each image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    // Create temporary preview URLs
    const previews = selectedFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setImageFiles((current) => [
      ...current,
      ...selectedFiles,
    ]);

    setImagePreviews((current) => [
      ...current,
      ...previews,
    ]);

    setError("");

    // Allow selecting the same file again later
    event.target.value = "";
  };

  // Remove a newly selected image
  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);

    setImageFiles((current) =>
      current.filter((_, i) => i !== index)
    );

    setImagePreviews((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  // Remove an existing image while editing
  const removeExistingImage = (index: number) => {
    setExistingImages((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!form.description.trim()) {
      setError("Product description is required.");
      return;
    }

    if (!form.category) {
      setError("Please select a category.");
      return;
    }

    const price = Number(form.price);

    const discountPrice =
      form.discountPrice.trim() === ""
        ? undefined
        : Number(form.discountPrice);

    const stock = Number(form.stock);

    if (form.variants.length === 0 && (!Number.isFinite(price) || price < 0)) {
      setError("Please enter a valid product price.");
      return;
    }

    if (
      form.variants.length === 0 &&
      discountPrice !== undefined &&
      (!Number.isFinite(discountPrice) || discountPrice < 0)
    ) {
      setError("Please enter a valid discount price.");
      return;
    }

    if (
      form.variants.length === 0 &&
      discountPrice !== undefined &&
      discountPrice >= price
    ) {
      setError(
        "Discount price must be lower than the regular price."
      );
      return;
    }

    if (form.variants.length === 0 && (!Number.isInteger(stock) || stock < 0)) {
      setError("Stock must be a whole number of 0 or more.");
      return;
    }

    const variants = form.variants.map((variant) => ({
      ...(variant._id ? { _id: variant._id } : {}),
      label: variant.label.trim(),
      ...(variant.sku.trim() ? { sku: variant.sku.trim() } : {}),
      price: Number(variant.price),
      discountPrice: variant.discountPrice.trim() ? Number(variant.discountPrice) : undefined,
      stock: Number(variant.stock),
    }));
    if (variants.some((variant) => !variant.label || !Number.isFinite(variant.price) || variant.price < 0 ||
      (variant.discountPrice !== undefined && (!Number.isFinite(variant.discountPrice) || variant.discountPrice < 0 || variant.discountPrice >= variant.price)) ||
      !Number.isInteger(variant.stock) || variant.stock < 0)) {
      setError("Each variant needs a label, valid LKR price and whole-number stock. Discounts must be below the price.");
      return;
    }
    const normalizedLabels = variants.map((variant) => variant.label.toLocaleLowerCase());
    const normalizedSkus = variants.flatMap((variant) => variant.sku ? [variant.sku.toLocaleLowerCase()] : []);
    if (new Set(normalizedLabels).size !== normalizedLabels.length || new Set(normalizedSkus).size !== normalizedSkus.length) {
      setError("Variant labels and SKUs must be unique within this product.");
      return;
    }
    if (variants.length > 50 || variants.reduce((total, variant) => total + variant.stock, 0) > 1_000_000_000) {
      setError("A product can have up to 50 variants and 1000000000 total units in stock.");
      return;
    }

    // Maximum 5 images total
    if (
      existingImages.length + imageFiles.length > 5
    ) {
      setError("A product can have a maximum of 5 images.");
      return;
    }

    const productData: ProductInput = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: variants.length ? Math.min(...variants.map((variant) => variant.discountPrice ?? variant.price)) : price,
      discountPrice: variants.length ? undefined : discountPrice,
      category: form.category,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      stock: variants.length ? variants.reduce((total, variant) => total + variant.stock, 0) : stock,
      isFeatured: form.isFeatured,
      variants,
    };

    try {
      setFormLoading(true);
      setError("");

      if (editingProduct) {
        await updateProduct(
          editingProduct._id,
          productData,
          imageFiles,
          existingImages
        );
      } else {
        await createProduct(
          productData,
          imageFiles
        );
      }

      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });

      // Close after successful save
      setFormLoading(false);
      closeForm();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save product"));
    } finally {
      setFormLoading(false);
    }
  };

  const handleAvailabilityToggle = async (product: Product) => {
    const isActive = product.isActive === false;
    const confirmed = window.confirm(isActive
      ? `Restore "${product.name}" to the store?`
      : `Archive "${product.name}"? It will be hidden from shoppers, but its order and review history will be kept.`);

    if (!confirmed) return;

    try {
      setError("");
      await setProductAvailability(product._id, isActive);
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update product availability"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Products
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Manage the Zentro product catalog.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Error */}
      {(error || productsError || categoriesError) && !showForm && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle
            size={20}
            className="text-red-500 shrink-0"
          />

          <p className="text-sm text-red-700 flex-1">
            {error || productsError || categoriesError}
          </p>

          <button
            onClick={() => setError("")}
            className="text-red-400 hover:text-red-600"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Search */}
      <form
        onSubmit={handleSearch}
        className="bg-white border border-gray-200 rounded-xl p-4"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Search
          </button>
        </div>
      </form>

      {/* Products */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2
              size={28}
              className="mx-auto text-blue-600 animate-spin"
            />

            <p className="text-sm text-gray-500 mt-3">
              Loading products...
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package
              size={40}
              className="mx-auto text-gray-300 mb-3"
            />

            <p className="text-sm font-medium text-gray-700">
              No products found
            </p>

            <p className="text-xs text-gray-400 mt-1">
              Add a product or change your search.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                    Product
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                    Category
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                    Price
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                    Stock
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                    Rating
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr
                    key={product._id}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          {product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package
                                size={20}
                                className="text-gray-400"
                              />
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="font-medium text-gray-900">
                            {product.name}
                          </p>

                          {product.isFeatured && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 mt-1">
                              <Star
                                size={11}
                                fill="currentColor"
                              />
                              Featured
                            </span>
                          )}
                          {product.isActive === false && (
                            <span className="mt-1 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">Archived</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {product.category?.name ?? "Uncategorized"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">
                        LKR{" "}
                        {product.discountPrice ??
                          product.price}
                      </div>

                      {product.discountPrice !== undefined && (
                        <div className="text-xs text-gray-400 line-through">
                          LKR {product.price}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={
                          product.stock <= 5
                            ? "text-red-600 font-medium"
                            : "text-gray-600"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-gray-700">
                        ★ {product.rating.toFixed(1)}
                      </span>

                      <span className="text-xs text-gray-400 ml-1">
                        ({product.numReviews})
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            openEditForm(product)
                          }
                          className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition"
                          title="Edit product"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() =>
                            handleAvailabilityToggle(product)
                          }
                          className={`p-2 border border-gray-200 rounded-lg text-gray-600 transition ${product.isActive === false ? "hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50" : "hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50"}`}
                          title={product.isActive === false ? "Restore product" : "Archive product"}
                        >
                          {product.isActive === false ? <RotateCcw size={16} /> : <Archive size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !productsQuery.isError && products.length > 0 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingProduct
                    ? "Edit Product"
                    : "Add Product"}
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  {editingProduct
                    ? "Update the product information."
                    : "Add a new product to the Zentro catalog."}
                </p>
              </div>

              <button
                onClick={closeForm}
                disabled={formLoading}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {(error || categoriesError) && (
              <div role="alert" className="mx-6 mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
                <AlertTriangle size={18} className="text-red-500 shrink-0" />
                <p className="text-sm text-red-700 flex-1">{error || categoriesError}</p>
                <button type="button" onClick={() => setError("")} aria-label="Dismiss product form error" className="text-red-400 hover:text-red-600">
                  <X size={18} />
                </button>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5"
            >
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Product Name
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    handleChange(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="Enter product name"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    handleChange(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Enter product description"
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>

              <section className="rounded-xl border border-gray-200 p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Product options</h3>
                    <p className="mt-1 text-xs text-gray-500">Add choices such as size, color, or storage. Each option keeps its own price and stock.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, variants: [...current.variants, { label: "", sku: "", price: "", discountPrice: "", stock: "0" }] }))}
                    disabled={form.variants.length >= 50}
                    className="shrink-0 rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                  >
                    Add option
                  </button>
                </div>
                {form.variants.length > 0 && (
                  <div className="space-y-3">
                    {form.variants.map((variant, index) => (
                      <div key={variant._id ?? `new-${index}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 rounded-lg bg-gray-50 p-3">
                        <input aria-label={`Option ${index + 1} label`} required maxLength={80} value={variant.label} onChange={(event) => updateVariant(index, "label", event.target.value)} placeholder="Option (e.g. Blue, 128 GB)" className="rounded-md border border-gray-200 px-3 py-2 text-sm lg:col-span-2" />
                        <input aria-label={`Option ${index + 1} SKU`} maxLength={40} value={variant.sku} onChange={(event) => updateVariant(index, "sku", event.target.value)} placeholder="SKU (optional)" className="rounded-md border border-gray-200 px-3 py-2 text-sm" />
                        <input aria-label={`Option ${index + 1} price`} required type="number" min="0" max="1000000000" step="0.01" value={variant.price} onChange={(event) => updateVariant(index, "price", event.target.value)} placeholder="Price (LKR)" className="rounded-md border border-gray-200 px-3 py-2 text-sm" />
                        <input aria-label={`Option ${index + 1} discount price`} type="number" min="0" max="1000000000" step="0.01" value={variant.discountPrice} onChange={(event) => updateVariant(index, "discountPrice", event.target.value)} placeholder="Sale price" className="rounded-md border border-gray-200 px-3 py-2 text-sm" />
                        <div className="flex gap-2">
                          <input aria-label={`Option ${index + 1} stock`} required type="number" min="0" step="1" value={variant.stock} onChange={(event) => updateVariant(index, "stock", event.target.value)} placeholder="Stock" className="min-w-0 flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm" />
                          <button type="button" onClick={() => setForm((current) => ({ ...current, variants: current.variants.filter((_, currentIndex) => currentIndex !== index) }))} aria-label={`Remove option ${index + 1}`} className="rounded-md p-2 text-red-600 hover:bg-red-50"><X size={16} /></button>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-gray-500">The storefront starts from the lowest option price. Combined stock: {form.variants.reduce((total, variant) => total + (Number(variant.stock) || 0), 0)} units.</p>
                  </div>
                )}
              </section>

              {/* Simple-product price / discount / stock */}
              {form.variants.length === 0 && <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Price (LKR)
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="1000000000"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      handleChange(
                        "price",
                        event.target.value
                      )
                    }
                    placeholder="0"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Discount Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="1000000000"
                    step="0.01"
                    value={form.discountPrice}
                    onChange={(event) =>
                      handleChange(
                        "discountPrice",
                        event.target.value
                      )
                    }
                    placeholder="Optional"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Stock
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(event) =>
                      handleChange(
                        "stock",
                        event.target.value
                      )
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
              </div>}

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category
                </label>

                <select
                  value={form.category}
                  onChange={(event) =>
                    handleChange(
                      "category",
                      event.target.value
                    )
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                >
                  <option value="">
                    Select a category
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category._id}
                      value={category._id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Images
                </label>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition">
                  <ImagePlus
                    size={32}
                    className="mx-auto text-gray-400 mb-3"
                  />

                  <p className="text-sm font-medium text-gray-700">
                    Add product images
                  </p>

                  <p className="text-xs text-gray-400 mt-1 mb-4">
                    PNG, JPG or WEBP · Maximum 5 images · 5 MB each
                  </p>

                  <label className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer transition">
                    Choose Images

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Existing images */}
                {existingImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      Current Images
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {existingImages.map((image, index) => (
                        <div
                          key={`${image}-${index}`}
                          className="relative aspect-square rounded-lg overflow-hidden border border-gray-200"
                        >
                          <img
                            src={image}
                            alt={`Product ${index + 1}`}
                            className="w-full h-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeExistingImage(index)
                            }
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New image previews */}
                {imagePreviews.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      New Images
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {imagePreviews.map((preview, index) => (
                        <div
                          key={preview}
                          className="relative aspect-square rounded-lg overflow-hidden border border-blue-200"
                        >
                          <img
                            src={preview}
                            alt={`New product image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeNewImage(index)
                            }
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-2">
                  {existingImages.length + imageFiles.length}/5 images selected
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tags
                </label>

                <input
                  type="text"
                  value={form.tags}
                  onChange={(event) =>
                    handleChange(
                      "tags",
                      event.target.value
                    )
                  }
                  placeholder="electronics, usb, accessory"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />

                <p className="text-xs text-gray-400 mt-1">
                  Separate tags with commas.
                </p>
              </div>

              {/* Featured */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(event) =>
                    handleChange(
                      "isFeatured",
                      event.target.checked
                    )
                  }
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />

                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Featured Product
                  </p>

                  <p className="text-xs text-gray-400">
                    Show this product as featured in the
                    catalog.
                  </p>
                </div>
              </label>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={formLoading}
                  className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                >
                  {formLoading && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {editingProduct
                    ? "Save Changes"
                    : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
