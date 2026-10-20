import { useEffect, useRef, useState } from "react";
import { X, Home, ChevronLeft } from "lucide-react";
import zentroChatbotMascot from "../../assets/zentro-chatbot-mascot.png";
import { useAuthStore } from "../../store/authStore";
import { ChatMainMenu, type ChatTopic } from "./ChatMainMenu";
import { ChatOrderTracking } from "./ChatOrderTracking";
import { ChatDeliveryInfo } from "./ChatDeliveryInfo";
import { ChatReturnsPolicy } from "./ChatReturnsPolicy";
import { ChatPaymentHelp } from "./ChatPaymentHelp";
import { ChatProductHelp } from "./ChatProductHelp";
import { ChatContactSupport } from "./ChatContactSupport";


export const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState<ChatTopic>("menu");
  const [unreadPrompt, setUnreadPrompt] = useState(true);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  // Scroll to top of body when topic changes
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = 0;
    }
  }, [topic]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadPrompt(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleResetToMenu = () => {
    setTopic("menu");
  };

  const topicTitles: Record<ChatTopic, string> = {
    menu: "Help Menu",
    orders: "Track My Order",
    delivery: "Delivery Information",
    returns: "Returns & Refunds",
    payment: "Payment Help",
    products: "Product Questions",
    support: "Contact Support",
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
        {/* Helper popup pill before first opening */}
        {!isOpen && unreadPrompt && (
          <button
            type="button"
            onClick={handleOpen}
            className="hidden sm:flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3.5 py-1.5 text-xs font-semibold text-gray-800 shadow-lg hover:border-blue-400 hover:text-blue-600 transition"
          >
            <span>Need help? Ask Zentro</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => (isOpen ? handleClose() : handleOpen())}
          aria-label={isOpen ? "Close shopping help assistant" : "Open shopping help assistant"}
          aria-expanded={isOpen}
          className="relative flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 active:scale-95 transition focus:outline-none focus:ring-3 focus:ring-blue-400/50"
        >
          {isOpen ? <X size={22} /> : <img src={zentroChatbotMascot} alt="" className="h-[60px] w-[60px] object-contain drop-shadow-sm" draggable={false} />}
          {!isOpen && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
            </span>
          )}
        </button>
      </div>

      {/* Floating Chat Panel */}
      {isOpen && (
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Zentro Shopping Help Assistant"
          className="fixed bottom-20 right-4 sm:right-6 z-50 flex h-[540px] max-h-[82vh] w-[calc(100vw-2rem)] sm:w-[390px] flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <header className="flex items-center justify-between border-b border-gray-200 bg-gray-900 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                <img src={zentroChatbotMascot} alt="" className="h-8 w-8 object-contain" draggable={false} />
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 border border-gray-900" />
              </div>
              <div>
                <h2 className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
                  Zentro Shopping Help
                </h2>
                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Live Store Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {topic !== "menu" && (
                <button
                  type="button"
                  onClick={handleResetToMenu}
                  aria-label="Return to main help menu"
                  title="Main Help Menu"
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition"
                >
                  <Home size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close help assistant"
                title="Close"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {/* Subheader Breadcrumb / Navigation */}
          {topic !== "menu" && (
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-3.5 py-2 text-xs">
              <button
                type="button"
                onClick={handleResetToMenu}
                className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 transition"
              >
                <ChevronLeft size={14} /> Back to menu
              </button>
              <span className="text-gray-500 font-medium text-[11px] truncate max-w-[170px]">
                {topicTitles[topic]}
              </span>
            </div>
          )}

          {/* Chat Body */}
          <div
            ref={chatBodyRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/40"
          >
            {topic === "menu" && (
              <ChatMainMenu
                onSelectTopic={(selected) => setTopic(selected)}
                userName={user?.name}
              />
            )}

            {topic === "orders" && (
              <ChatOrderTracking
                onBackToMenu={handleResetToMenu}
                onContactSupport={() => setTopic("support")}
              />
            )}

            {topic === "delivery" && (
              <ChatDeliveryInfo
                onBackToMenu={handleResetToMenu}
                onTrackOrder={() => setTopic("orders")}
                onContactSupport={() => setTopic("support")}
              />
            )}

            {topic === "returns" && (
              <ChatReturnsPolicy
                onBackToMenu={handleResetToMenu}
                onContactSupport={() => setTopic("support")}
              />
            )}

            {topic === "payment" && (
              <ChatPaymentHelp
                onBackToMenu={handleResetToMenu}
                onContactSupport={() => setTopic("support")}
              />
            )}

            {topic === "products" && (
              <ChatProductHelp
                onBackToMenu={handleResetToMenu}
                onContactSupport={() => setTopic("support")}
              />
            )}

            {topic === "support" && (
              <ChatContactSupport onBackToMenu={handleResetToMenu} />
            )}
          </div>

          {/* Footer note */}
          <footer className="border-t border-gray-100 bg-white px-3 py-2 text-center text-[10px] text-gray-400">
            Guided shopping assistant · Zentro Sri Lanka
          </footer>
        </aside>
      )}
    </>
  );
};

export default ChatbotWidget;
