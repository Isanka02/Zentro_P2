import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Banknote,
  Search,
  ShieldCheck,
  Truck,
  Headphones,
  Sparkles,
  ShoppingBag,
  Home as HomeIcon,
  Laptop,
  Heart,
} from "lucide-react";

import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";
import ProductCard from "../components/product/ProductCard";
import zentroLogo from "../assets/zen.png";


const categoryIcons = [
  Laptop,
  HomeIcon,
  ShoppingBag,
  Heart,
];

const Home = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: featuredData, isLoading: featuredLoading } = useProducts({
    sort: "featured",
    featuredOnly: true,
    page: 1,
    limit: 4,
  });

  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
    } else {
      navigate("/products");
    }
  };

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-sky-50">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          {/* Hero content */}
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm">
              <Sparkles size={16} />
              Your everyday shopping destination
            </div>

            <h1 className="text-4xl font-black leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Everything you need.
              <span className="block text-blue-600">
                All in one place.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-gray-600 sm:text-lg">
              Discover products you love, explore new favourites, and enjoy
              a simple shopping experience with Zentro.
            </p>

            {/* Search */}
            <form
              onSubmit={handleSearch}
              className="mt-8 flex max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
            >
              <div className="flex flex-1 items-center">
                <Search
                  size={20}
                  className="ml-4 shrink-0 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="What are you looking for?"
                  className="w-full border-0 bg-transparent px-3 py-4 text-sm outline-none"
                />
              </div>

              <button
                type="submit"
                className="m-1 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Search
              </button>
            </form>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Shop Now
                <ArrowRight size={17} />
              </Link>

              <a
                href="#categories"
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Explore Categories
              </a>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative hidden lg:block">
            <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />

            <div className="relative rounded-3xl border border-white bg-white/80 p-5 shadow-2xl backdrop-blur">
              {featuredData?.products?.[0]?.images?.[0] ? (
                <img
                  src={featuredData.products[0].images[0]}
                  alt={featuredData.products[0].name}
                  className="h-[390px] w-full rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-[390px] items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50">
                  <div className="text-center">
                    <ShoppingBag
                      size={70}
                      className="mx-auto text-blue-500"
                    />
                    <p className="mt-4 text-lg font-semibold text-blue-800">
                      Shop smarter with Zentro
                    </p>
                  </div>
                </div>
              )}

              {featuredData?.products?.[0] && (
                <div className="absolute bottom-9 left-9 right-9 rounded-xl bg-white/95 p-4 shadow-lg backdrop-blur">
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                    Featured
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {featuredData.products[0].name}
                  </p>

                  <Link
                    to={`/products/${featuredData.products[0]._id}`}
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    View product
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-gray-100 px-4 py-6 sm:grid-cols-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 px-4 py-3">
            <Truck className="text-blue-600" size={22} />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Fast Delivery
              </p>
              <p className="text-xs text-gray-500">To your doorstep</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 px-4 py-3">
            <ShieldCheck className="text-blue-600" size={22} />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Secure Shopping
              </p>
              <p className="text-xs text-gray-500">Protected checkout</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 px-4 py-3">
            <Banknote className="text-blue-600" size={22} />
            <div>
              <p className="text-sm font-semibold text-gray-900">LKR Pricing</p>
              <p className="text-xs text-gray-500">Prices shown in Sri Lankan rupees</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 px-4 py-3">
            <Headphones className="text-blue-600" size={22} />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Customer Support
              </p>
              <p className="text-xs text-gray-500">We're here to help</p>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section
        id="categories"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Browse
            </p>

            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              Shop by category
            </h2>

            <p className="mt-2 text-gray-500">
              Find what you're looking for faster.
            </p>
          </div>

          <Link
            to="/products"
            className="hidden items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 sm:flex"
          >
            View all
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categoriesLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-2xl bg-gray-100"
              />
            ))
          ) : categories && categories.length > 0 ? (
            categories.slice(0, 4).map((category, index) => {
              const Icon =
                categoryIcons[index % categoryIcons.length];

              return (
                <Link
                  key={category._id}
                  to={`/products?category=${category._id}`}
                  className="group rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                    <Icon size={23} />
                  </div>

                  <h3 className="mt-5 font-semibold text-gray-900">
                    {category.name}
                  </h3>

                  <div className="mt-2 flex items-center gap-1 text-xs font-medium text-gray-500 group-hover:text-blue-600">
                    Explore
                    <ArrowRight size={13} />
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-500">
              Categories will appear here.
            </div>
          )}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Zentro picks
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                Featured products
              </h2>

              <p className="mt-2 text-gray-500">
                Popular products worth checking out.
              </p>
            </div>

            <Link
              to="/products"
              className="hidden items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 sm:flex"
            >
              View all products
              <ArrowRight size={16} />
            </Link>
          </div>

          {featuredLoading ? (
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-96 animate-pulse rounded-xl bg-white"
                />
              ))}
            </div>
          ) : featuredData?.products?.length ? (
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {featuredData.products.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-xl bg-white p-10 text-center text-sm text-gray-500">
              Featured products will appear here.
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
  <div className="overflow-hidden rounded-3xl bg-blue-50 px-6 py-12 text-center sm:px-12">
    <img
      src={zentroLogo}
      alt="Zentro"
      className="mx-auto h-16 w-auto object-contain"
    />

    <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-bold text-gray-900 sm:text-4xl">
      Ready to find something you love?
    </h2>

    <p className="mx-auto mt-4 max-w-xl text-gray-600">
      Explore our collection and discover products selected for everyday
      life.
    </p>

    <Link
      to="/products"
      className="mt-7 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
    >
      Start Shopping
      <ArrowRight size={17} />
    </Link>
  </div>
</section>
    </div>
  );
};

export default Home;
