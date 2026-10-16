import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/authContext/useAuth";
import { UserButton } from "@clerk/react";
import {
  Menu as MenuIcon,
  X as XIcon,
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Mail,
  Sun,
  Moon,
  Lock,
  LogOut,
  Building2,
  ClipboardList,
} from "lucide-react";
import InvitationsModal from "../components/workspace/InvitationsModal";
import ConfigureDropdown from "./ConfigureDropdown";
import InvomoraLogo from "../components/InvomoraLogo";
import { useWorkspace } from "../contexts/WorkspaceContext";

const Header = () => {
  const location = useLocation();
  const { userLoggedIn, signOut } = useAuth();
  const { myPendingInvites } = useWorkspace();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInvitationsOpen, setIsInvitationsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  const mobileDrawerRef = useRef(null);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    window.localStorage.setItem(
      "invoice-dashboard-theme",
      isDarkMode ? "dark" : "light"
    );
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((current) => !current);

  // Core daily operational tabs ONLY (Audit Log & Business Profile moved to Configure dropdown)
  const navItems = [
    { to: "/home", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { to: "/invoice", label: "Invoices", icon: <FileText size={16} /> },
    { to: "/customers", label: "Customers", icon: <Users size={16} /> },
    { to: "/products", label: "Products", icon: <Package size={16} /> },
  ];

  // Auto-close mobile drawer on outside click or page scroll
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleOutsideClick = (event) => {
      if (
        mobileDrawerRef.current &&
        !mobileDrawerRef.current.contains(event.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleScroll = () => {
      setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isMenuOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 border-b border-border bg-surface print:hidden">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left Section: Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/home" className="group flex items-center gap-2.5 sm:gap-3 shrink-0">
              <InvomoraLogo size={38} className="sm:w-10 sm:h-10 transition-transform group-hover:scale-105" />
              <div className="leading-tight hidden xs:block">
                <p className="text-sm font-semibold text-foreground">
                  Invomora
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  Business dashboard
                </p>
              </div>
            </Link>
          </div>

          {userLoggedIn ? (
            <>
              {/* Center Section: Core Primary Navigation Tabs Only */}
              <div className="hidden items-center gap-1.5 rounded-full border border-border bg-surface-elevated p-1 md:flex">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-surface hover:text-foreground"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Right Section: Configure Dropdown + Lock Screen + Invitations + Theme + Clerk UserButton */}
              <div className="hidden md:flex items-center gap-2">
                {/* Secondary Operational & Workspace Dropdown */}
                <ConfigureDropdown />

                {/* Lock Screen Shortcut Button (Relocated from profile dropdown) */}
                <button
                  onClick={() => window.dispatchEvent(new Event("invomora_lock_screen"))}
                  title="Lock Dashboard Screen"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-elevated text-muted-foreground transition hover:bg-surface hover:text-foreground focus:outline-hidden cursor-pointer"
                >
                  <Lock size={15} />
                </button>

                {/* Invitations Button */}
                <button
                  onClick={() => setIsInvitationsOpen(true)}
                  title="Workspace Invitations"
                  className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-elevated text-muted-foreground transition hover:bg-surface hover:text-foreground focus:outline-hidden cursor-pointer"
                >
                  <Mail
                    size={16}
                    className={
                      myPendingInvites?.length > 0
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                  />
                  {myPendingInvites?.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-xs animate-pulse">
                      {myPendingInvites.length}
                    </span>
                  )}
                </button>

                {/* Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  aria-pressed={isDarkMode}
                  aria-label={
                    isDarkMode ? "Switch to light mode" : "Switch to dark mode"
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-elevated transition hover:bg-surface focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                >
                  {isDarkMode ? (
                    <Sun size={16} className="text-amber-400" />
                  ) : (
                    <Moon size={16} className="text-foreground" />
                  )}
                </button>

                {/* Standardized Clerk Built-in UserButton */}
                <div className="flex items-center pl-1">
                  <UserButton
                    afterSignOutUrl="/login"
                    appearance={{
                      elements: {
                        avatarBox: "h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-border transition",
                      },
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="hidden gap-3 md:flex">
              <Link
                to="/login"
                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover shadow-xs"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            ref={menuButtonRef}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation menu"
            className="rounded-full border border-border p-2 text-foreground md:hidden cursor-pointer"
          >
            {isMenuOpen ? <XIcon size={18} /> : <MenuIcon size={18} />}
          </button>
        </nav>

        {/* Mobile Sidebar Navigation Drawer */}
        {isMenuOpen && (
          <div
            ref={mobileDrawerRef}
            className="border-t border-border bg-surface px-4 py-4 shadow-lg md:hidden animate-in fade-in duration-150"
          >
            {userLoggedIn ? (
              <div className="space-y-3">
                {/* Primary Daily Tabs */}
                <div className="space-y-1">
                  <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Navigation
                  </div>
                  {navItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${
                        location.pathname === item.to
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>

                <hr className="border-border" />

                {/* Operations & Workspace Section */}
                <div className="space-y-1">
                  <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Operations & Workspace
                  </div>
                  <Link
                    to="/business-profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-surface"
                  >
                    <Building2 size={16} className="text-muted-foreground" />
                    <span>Business Profile</span>
                  </Link>

                  <Link
                    to="/activity-log"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-surface"
                  >
                    <ClipboardList size={16} className="text-muted-foreground" />
                    <span>Workspace Audit Log</span>
                  </Link>

                  <button
                    onClick={() => {
                      setIsInvitationsOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-surface cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-primary" />
                      <span>Workspace Invitations</span>
                    </div>
                    {myPendingInvites?.length > 0 && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                        {myPendingInvites.length}
                      </span>
                    )}
                  </button>
                </div>

                <hr className="border-border" />

                {/* Account & Security Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs font-medium text-muted-foreground">Account</span>
                    <UserButton afterSignOutUrl="/login" />
                  </div>

                  <button
                    onClick={toggleTheme}
                    aria-pressed={isDarkMode}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground cursor-pointer"
                  >
                    {isDarkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
                    <span>{isDarkMode ? "Switch to light mode" : "Switch to dark mode"}</span>
                  </button>

                  <button
                    onClick={() => {
                      window.dispatchEvent(new Event("invomora_lock_screen"));
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-surface cursor-pointer"
                  >
                    <Lock size={16} className="text-muted-foreground" />
                    <span>Lock Screen</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (signOut) signOut();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-danger cursor-pointer"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground text-center shadow-xs"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      <InvitationsModal
        isOpen={isInvitationsOpen}
        onClose={() => setIsInvitationsOpen(false)}
      />
    </>
  );
};

export default Header;
