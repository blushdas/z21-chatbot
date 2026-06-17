import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Plus, LogIn, PanelLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useBrand } from "@/context/BrandContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatSidebarHeaderProps {
  isAuthenticated: boolean;
  onNewChat: () => void;
  isNewChatDisabled?: boolean;
}

const ChatSidebarHeader: React.FC<ChatSidebarHeaderProps> = ({
  isAuthenticated,
  onNewChat,
  isNewChatDisabled = false,
}) => {
  const { closeSidebar } = useSidebarState();
  const navigate = useNavigate();
  const location = useLocation();
  const favoritesActive = location.pathname === '/favorites';
  const { activeBrand, productName, logoUrl, logoDarkUrl } = useBrand();
  return (
    <div className="px-4 pt-6 pb-4 relative">
      {/* Desktop-only collapse button - completely hidden on mobile */}
      <Button
        variant="ghost"
        size="icon"
        onClick={closeSidebar}
        className="absolute top-2 right-2 text-[var(--chat-muted)] hover:text-[var(--chat-text)] hidden sm:flex"
        aria-label="Collapse sidebar"
      >
        <PanelLeft size={16} />
      </Button>

      {/* Logo */}
      <div className="mb-4 flex justify-center">
        {activeBrand && (logoUrl || logoDarkUrl) ? (
          <>
            <img
              src={logoUrl ?? logoDarkUrl ?? ''}
              alt={productName}
              className="w-full max-w-[144px] h-auto cursor-pointer dark:hidden"
              onClick={() => navigate("/")}
            />
            <img
              src={logoDarkUrl ?? logoUrl ?? ''}
              alt={productName}
              className="w-full max-w-[144px] h-auto cursor-pointer hidden dark:block"
              onClick={() => navigate("/")}
            />
          </>
        ) : activeBrand ? (
          <button
            onClick={() => navigate("/")}
            className="text-xl font-heading font-bold text-foreground"
          >
            {productName}
          </button>
        ) : (
          <>
            <img
              src="/lovable-uploads/Daryle_Logo_Dark.svg"
              alt="Daryle AI"
              className="w-full max-w-[144px] h-auto cursor-pointer dark:hidden"
              onClick={() => navigate("/")}
            />
            <img
              src="/lovable-uploads/Daryle_Logo_White.svg"
              alt="Daryle AI"
              className="w-full max-w-[144px] h-auto cursor-pointer hidden dark:block"
              onClick={() => navigate("/")}
            />
          </>
        )}
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-full">
              <Button
                onClick={onNewChat}
                disabled={isNewChatDisabled}
                className="w-full bg-brand-yellow hover:bg-brand-yellow/90 text-brand-blue text-sm py-2 font-heading disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} className="mr-2" />
                New Chat
              </Button>
            </div>
          </TooltipTrigger>
          {isNewChatDisabled && (
            <TooltipContent side="bottom" className="bg-brand-blue text-white border-brand-blue/50">
              <p>You're already in a new chat — start typing to begin!</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      {!isAuthenticated && (
        <div className="mt-4 text-center text-[var(--chat-muted)] text-sm">
          <LogIn className="mx-auto mb-2" size={20} />
          <p className="mb-3">Sign in to save your conversations</p>
          <Button
            onClick={() => navigate("/auth")}
            variant="outline"
            className="w-full text-brand-yellow border-brand-yellow hover:bg-brand-yellow hover:text-brand-blue text-sm"
          >
            Sign In
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChatSidebarHeader;
