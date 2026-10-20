import { useState, type FormEvent } from "react";
import { KeyRound, Save } from "lucide-react";
import { changePassword } from "../api/auth";
import { getErrorMessage } from "../lib/errorMessage";

const ChangePasswordForm = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword.length < 12) {
      setError("Use at least 12 characters for your new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password changed. Other signed-in sessions have been signed out.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not change your password."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
      <div className="mb-5 flex items-center gap-3"><div className="rounded-lg bg-blue-50 p-2 text-blue-600"><KeyRound size={19} /></div><div><h2 className="font-semibold text-gray-900">Change password</h2><p className="text-xs text-gray-500">Changing it signs out your other sessions.</p></div></div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-gray-700 sm:col-span-2">Current password<input required maxLength={128} type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500" /></label>
        <label className="space-y-1 text-sm font-medium text-gray-700">New password<input required minLength={12} maxLength={72} type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500" /></label>
        <label className="space-y-1 text-sm font-medium text-gray-700">Confirm new password<input required minLength={12} maxLength={72} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500" /></label>
        <div className="sm:col-span-2"><button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"><Save size={16} />{saving ? "Saving..." : "Update password"}</button></div>
      </form>
    </section>
  );
};

export default ChangePasswordForm;
