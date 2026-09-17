import { useState, type FormEvent } from "react";
import { PROVINCES, DISTRICTS_BY_PROVINCE, type Province } from "../../lib/shippingData";
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

  const handleChange = (field: keyof ShippingInfo, value: string) => {
  setForm((prev) => {
    const next = { ...prev, [field]: value };

    if (field === "province") {
      next.district = "";
    }

    onChange?.(next);

    return next;
  });
};

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = "Enter a valid email";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.province) newErrors.province = "Select a province";
    if (!form.district) newErrors.district = "Select a district";
    if (!form.postalCode.trim()) newErrors.postalCode = "Postal code is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(form);
    }
  };

  const districts = form.province ? DISTRICTS_BY_PROVINCE[form.province as Province] : [];

  const inputClass = (hasError: boolean) =>
    `w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      hasError ? "border-red-400" : "border-gray-300"
    }`;

  return (
    <form onSubmit={handleSubmit} id="shipping-form" className="space-y-4">
      <h2 className="font-semibold text-gray-900">Shipping Information</h2>

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
          value={form.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          className={inputClass(!!errors.phone)}
          placeholder="07XXXXXXXX"
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
            value={form.postalCode}
            onChange={(e) => handleChange("postalCode", e.target.value)}
            className={inputClass(!!errors.postalCode)}
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
            className={inputClass(!!errors.province)}
          >
            <option value="">Select province</option>
            {PROVINCES.map((p) => (
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
            disabled={!form.province}
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