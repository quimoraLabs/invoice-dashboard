import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext/useAuth";
import { UserButton } from "@clerk/react"; // TODO: Use this after B2B launch, remove custom dropdown
import {
  HiMenu,
  HiX,
  HiHome,
  HiUsers,
  HiCube,
  HiDocumentText,
  HiLogout,
  HiUser,
  HiMoon,
  HiSun,
  HiOfficeBuilding,
} from "react-icons/hi";
import ProfileModal from "../components/modals/ProfileViewModal";
import WorkspaceSwitcher from "../components/workspace/WorkspaceSwitcher";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userLoggedIn, currentUser, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    window.localStorage.setItem(
      "invoice-dashboard-theme",
      isDarkMode ? "dark" : "light",
    );
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((current) => !current);

  const navItems = [
    { to: "/home", label: "Dashboard", icon: <HiHome size={18} /> },
    { to: "/customers", label: "Customers", icon: <HiUsers size={18} /> },
    { to: "/products", label: "Products", icon: <HiCube size={18} /> },
    { to: "/invoice", label: "Invoices", icon: <HiDocumentText size={18} /> },
    { to: "/business-profile", label: "Business Profile", icon: <HiOfficeBuilding size={18} /> },
  ];
  const handleLogout = async () => {
    if (signOut) {
      await signOut();
    }
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
    navigate("/login");
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 200);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 border-b border-border bg-surface print:hidden">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link to="/home" className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-violet-500 text-sm sm:text-base font-semibold text-primary-foreground shadow-sm">
                I
              </div>
              <div className="leading-tight hidden xs:block">
                <p className="text-sm font-semibold text-foreground">
                  Invomora
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  Business dashboard
                </p>
              </div>
            </Link>

            {userLoggedIn && <WorkspaceSwitcher />}
          </div>

          {userLoggedIn ? (
            <>
              {/* Desktop Tabs */}
              <div className="hidden items-center gap-2 rounded-full border border-border bg-surface-elevated p-1 md:flex">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition  ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-surface hover:text-foreground"
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {/* Right Side: Theme Toggle + Profile Dropdown */}
              <div className="hidden md:flex items-center gap-2">
                {/* Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  aria-pressed={isDarkMode}
                  aria-label={
                    isDarkMode ? "Switch to light mode" : "Switch to dark mode"
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-elevated transition hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {isDarkMode ? (
                    <HiSun size={18} className="text-amber-400" />
                  ) : (
                    <HiMoon size={18} className="text-foreground" />
                  )}
                </button>

                {/* Profile Dropdown Container */}
                <div
                  className="relative py-2"
                  ref={dropdownRef}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-elevated ring-2 ring-transparent transition hover:ring-border focus:outline-none"
                  >
                    {currentUser?.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt="Profile"
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <HiUser size={18} className="text-muted-foreground" />
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 w-52 origin-top-right rounded-2xl border border-border bg-surface-elevated p-1.5 shadow-xl ring-1 ring-black/5">
                      <button
                        onClick={() => {
                          setIsProfileModalOpen(true);
                          setIsDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface"
                      >
                        <HiUser size={16} className="text-muted-foreground" />
                        My Profile
                      </button>
                      <Link
                        to="/business-profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface"
                      >
                        <HiOfficeBuilding size={16} className="text-muted-foreground" />
                        Business Profile
                      </Link>
                      <hr className="my-1 border-border" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-danger transition hover:bg-surface"
                      >
                        <HiLogout size={16} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="hidden gap-3 md:flex">
              <Link
                to="/login"
                className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-surface"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
              >
                Register
              </Link>
            </div>
          )}

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-full border border-border p-2 text-foreground md:hidden"
          >
            {isMenuOpen ? <HiX size={20} /> : <HiMenu size={20} />}
          </button>
        </nav>

        {/* Mobile Sidebar Navigation */}
        {isMenuOpen && (
          <div className="border-t border-border bg-surface px-4 py-4 shadow-lg md:hidden">
            {userLoggedIn ? (
              <div className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium ${
                      location.pathname === item.to
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
                <button
                  onClick={toggleTheme}
                  aria-pressed={isDarkMode}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-foreground"
                >
                  {isDarkMode ? <HiSun size={18} /> : <HiMoon size={18} />}
                  {isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                </button>
                <button
                  onClick={() => {
                    setIsProfileModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-foreground"
                >
                  <HiUser size={18} />
                  My Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-danger"
                >
                  <HiLogout size={16} />
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-2xl px-3 py-2 text-sm font-medium text-muted-foreground"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-2xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};

export default Header;
