import { useState, useRef, type FormEvent, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { User as UserIcon, Mail, Phone, MapPin, Package, Heart, CheckCircle2, AlertCircle, Save, Edit2, Image as ImageIcon, Camera } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { updateProfile } from "../api/auth";

const presetAvatars = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
];

const Profile = () => {
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image file size should be less than 5MB.");
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const img = new window.Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setAvatar(compressedDataUrl);
        };
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updatedUser = await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        avatar: avatar.trim(),
      });

      setUser(updatedUser);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white/20 border-2 border-white/40 flex-shrink-0 shadow-sm">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full font-bold text-2xl flex items-center justify-center">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-blue-100 text-xs mt-0.5 capitalize">{user.role} Account</p>
          </div>
        </div>

        <button
          onClick={() => {
            setIsEditing(!isEditing);
            setError("");
            setSuccess("");
          }}
          className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 rounded-xl text-xs font-semibold backdrop-blur-md transition self-start sm:self-auto"
        >
          <Edit2 size={16} />
          {isEditing ? "Cancel Editing" : "Edit Profile"}
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* Profile Form / Details View */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 flex items-center gap-2">
          <UserIcon size={20} className="text-blue-600" />
          Personal Details
        </h2>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Avatar Upload Area */}
            <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl space-y-4">
              <label className="block text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                <ImageIcon size={16} className="text-blue-600" />
                Profile Avatar / Image
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Preview Circle */}
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500 shadow-sm flex-shrink-0 bg-gray-100">
                  {avatar ? (
                    <img src={avatar} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xl">
                      {name ? name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                </div>

                <div className="space-y-3 flex-1 text-center sm:text-left">
                  {/* Upload from Device Button */}
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-2xs"
                    >
                      <Camera size={16} />
                      Upload from Device
                    </button>

                    {avatar && (
                      <button
                        type="button"
                        onClick={() => setAvatar("")}
                        className="text-xs text-gray-500 hover:text-red-600 px-3 py-2 rounded-xl border border-gray-200 hover:border-red-200 transition"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Supports PNG, JPG, or WebP (Max 2MB). Direct upload from your device.
                  </p>

                  {/* Preset Quick Options */}
                  <div className="pt-2 border-t border-gray-200/60">
                    <span className="text-[11px] text-gray-500 block mb-1.5">Or choose a preset avatar:</span>
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      {presetAvatars.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatar(url)}
                          className={`w-9 h-9 rounded-full overflow-hidden border-2 transition ${
                            avatar === url ? "border-blue-600 ring-2 ring-blue-200 scale-105" : "border-gray-200 opacity-60 hover:opacity-100"
                          }`}
                        >
                          <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">Email address cannot be changed.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+94 7X XXX XXXX"
                  className="w-full p-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Default Shipping Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street Address, City, Province"
                  className="w-full p-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <UserIcon size={18} className="text-gray-400 mt-0.5" />
              <div>
                <span className="text-xs text-gray-500 block">Full Name</span>
                <span className="font-semibold text-gray-900">{user.name}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <Mail size={18} className="text-gray-400 mt-0.5" />
              <div>
                <span className="text-xs text-gray-500 block">Email Address</span>
                <span className="font-semibold text-gray-900">{user.email}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <Phone size={18} className="text-gray-400 mt-0.5" />
              <div>
                <span className="text-xs text-gray-500 block">Phone Number</span>
                <span className="font-semibold text-gray-900">
                  {user.phone || "Not set yet"}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <MapPin size={18} className="text-gray-400 mt-0.5" />
              <div>
                <span className="text-xs text-gray-500 block">Default Delivery Address</span>
                <span className="font-semibold text-gray-900">
                  {user.address || "Not set yet"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/orders"
          className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between hover:border-blue-300 transition group shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
              <Package size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">My Orders</h3>
              <p className="text-xs text-gray-500">View order status & receipts</p>
            </div>
          </div>
        </Link>

        <Link
          to="/wishlist"
          className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between hover:border-red-300 transition group shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition">
              <Heart size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">My Wishlist</h3>
              <p className="text-xs text-gray-500">Saved favorite items</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Profile;
