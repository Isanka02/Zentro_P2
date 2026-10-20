import { useState, type FormEvent } from "react";
import { normalizeSriLankanPhone } from "../../lib/shippingData";
import { useShippingOptions } from "../../hooks/useShippingOptions";
import type { ShippingInfo } from "../../store/checkoutStore";

interface ShippingFormProps {
  initialValues: ShippingInfo;
  onSubmit: (info: ShippingInfo) => void;
  onChange?: (info: ShippingInfo) => void;
}

type FormErrors = Partial<Record<keyof ShippingInfo, string>>;

const ShippingForm = ({
  initialValues,
  onSubmit,
  onChange,
}: ShippingFormProps) => {
  const [form, setForm] = useState<ShippingInfo>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const { data: shippingOptions, isLoading: shippingOptionsLoading, isError: shippingOptionsError, refetch: refetchShippingOptions } = useShippingOptions();

  const handleChange = (field: keyof ShippingInfo, value: string) => {
    const next = { ...form, [field]: value };
    if (field === "province") {
      next.district = "";
    }
    setForm(next);
    onChange?.(next);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = "Enter a valid email";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!normalizeSriLankanPhone(form.phone)) newErrors.phone = "Enter a valid Sri Lankan phone number";
    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.province) newErrors.province = "Select a province";
    if (!form.district) newErrors.district = "Select a district";
    if (!form.postalCode.trim()) newErrors.postalCode = "Postal code is required";
    else if (!/^\d{5}$/.test(form.postalCode.trim())) newErrors.postalCode = "Enter the five-digit Sri Lankan postcode";
    if (!shippingOptions) newErrors.province = "Shipping options are unavailable. Please try again.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const phone = normalizeSriLankanPhone(form.phone);
    if (validate() && phone) {
      onSubmit({ ...form, phone });
    }
  };

  const districts = form.province ? shippingOptions?.districtsByProvince[form.province] ?? [] : [];

  const inputClass = (hasError: boolean) =>
    `w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      hasError ? "border-red-400" : "border-gray-300"
    }`;

  return (
    <form onSubmit={handleSubmit} id="shipping-form" className="space-y-4">
      <h2 className="font-semibold text-gray-900">Shipping Information</h2>
      {shippingOptionsLoading && <p role="status" className="text-sm text-gray-500">Loading Sri Lankan delivery options…</p>}
      {shippingOptionsError && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Could not load delivery options. <button type="button" onClick={() => void refetchShippingOptions()} className="font-semibold underline">Try again</button></div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
          <input
            value={form.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            className={inputClass(!!errors.fullName)}
          />
          {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className={inputClass(!!errors.email)}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
        <input
            type="tel"
            autoComplete="tel"
            maxLength={32}
          value={form.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          className={inputClass(!!errors.phone)}
          placeholder="0771234567 or +94 771234567"
        />
        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input
          value={form.address}
          onChange={(e) => handleChange("address", e.target.value)}
          className={inputClass(!!errors.address)}
          placeholder="Street address, apartment, etc."
        />
        {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            value={form.city}
            onChange={(e) => handleChange("city", e.target.value)}
            className={inputClass(!!errors.city)}
          />
          {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Postal code</label>
          <input
            inputMode="numeric"
            maxLength={5}
            value={form.postalCode}
            onChange={(e) => handleChange("postalCode", e.target.value)}
            className={inputClass(!!errors.postalCode)}
            placeholder="10100"
          />
          {errors.postalCode && <p className="text-xs text-red-500 mt-1">{errors.postalCode}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
          <select
            value={form.province}
            onChange={(e) => handleChange("province", e.target.value)}
            disabled={!shippingOptions}
            className={inputClass(!!errors.province)}
          >
            <option value="">Select province</option>
            {(shippingOptions?.provinces ?? []).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {errors.province && <p className="text-xs text-red-500 mt-1">{errors.province}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
          <select
            value={form.district}
            onChange={(e) => handleChange("district", e.target.value)}
            disabled={!form.province || !shippingOptions}
            className={`${inputClass(!!errors.district)} disabled:bg-gray-100 disabled:cursor-not-allowed`}
          >
            <option value="">{form.province ? "Select district" : "Select a province first"}</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {errors.district && <p className="text-xs text-red-500 mt-1">{errors.district}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
        <input
          value={form.country}
          disabled
          className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
        />
      </div>
    </form>
  );
};

export default ShippingForm;
