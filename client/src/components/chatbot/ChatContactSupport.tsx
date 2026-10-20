import { Link, useNavigate } from "react-router-dom";
import { LifeBuoy, MessageSquare, ShieldAlert, LogIn } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

interface ChatContactSupportProps {
  onBackToMenu: () => void;
}

export const ChatContactSupport = ({ onBackToMenu }: ChatContactSupportProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isLoggedIn = Boolean(user);

  return (
    <div className="space-y-3.5 text-sm">
      {/* Bot Prompt */}
      <div className="rounded-xl rounded-tl-sm bg-blue-50 border border-blue-100 p-3 text-gray-800">
        <p className="font-semibold text-blue-950 flex items-center gap-1.5">
          <LifeBuoy size={16} className="text-blue-700" /> Contact Zentro Support
        </p>
        <p className="mt-1 text-xs text-gray-700 leading-relaxed">
          Need assistance with an order, product inquiry, or account issue? Our support team is here to assist.
        </p>
      </div>

      {/* Available Support Channel */}
      <div className="rounded-xl border border-gray-200 bg-white p-3.5 space-y-3 shadow-xs">
        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 shrink-0">
            <MessageSquare size={16} />
          </span>
          <div className="text-xs">
            <p className="font-semibold text-gray-900">In-App Customer Support Inbox</p>
            <p className="mt-0.5 text-gray-600 leading-relaxed">
              Submit your question or issue directly to the Zentro team. You will receive in-app notifications and replies directly in your account.
            </p>
          </div>
        </div>

        {isLoggedIn ? (
          <button
            type="button"
            onClick={() => navigate("/support")}
            className="w-full py-2.5 px-3 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition flex items-center justify-center gap-1.5"
          >
            <LifeBuoy size={14} /> Open Support Inbox
          </button>
        ) : (
          <div className="rounded-lg bg-amber-50/80 border border-amber-200 p-2.5 text-xs text-amber-900 space-y-2">
            <p className="leading-relaxed">
              To start a conversation with our support team, please log in to your Zentro account.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              <LogIn size={13} /> Sign In to Open Support Ticket
            </Link>
          </div>
        )}
      </div>

      {/* Notice About Unconfigured Public Contact Details */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 space-y-1.5 text-xs text-gray-600">
        <div className="flex items-center gap-1.5 font-semibold text-gray-800">
          <ShieldAlert size={14} className="text-gray-500" />
          <span>Notice on Phone & Email Support</span>
        </div>
        <p className="text-[11px] leading-relaxed text-gray-600">
          Direct telephone hotlines and public support emails are not currently configured for this store. All communications are securely tracked and managed through the in-app support portal above.
        </p>
      </div>

      {/* Footer Navigation */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBackToMenu}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          ← Back to help topics
        </button>
      </div>
    </div>
  );
};
