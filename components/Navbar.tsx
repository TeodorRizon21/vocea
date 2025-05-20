"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  SchoolIcon as Student,
  Home,
  Search,
  MessageSquare,
  LayoutDashboard,
  LogIn,
  UserPlus,
  LogOut,
  Settings,
  Shield,
  ShieldAlert,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle, useLanguage } from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import Image from "next/image";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

const NavItem = ({ href, icon, label, isActive, onClick }: NavItemProps) => (
  <li>
    <Link
      href={href}
      className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm
        ${
          isActive
            ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300"
            : "text-gray-600 dark:text-gray-300 hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-900 dark:hover:text-indigo-300"
        }`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </Link>
  </li>
);

const Navbar = () => {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { isLoaded, isSignedIn, user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const { language, translations } = useLanguage();
  const t = translations[language as keyof typeof translations];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // Check for admin and moderator roles in public metadata
      const publicMetadata = user.publicMetadata;
      setIsAdmin(publicMetadata.isAdmin === true);
      setIsModerator(
        publicMetadata.isModerator === true || publicMetadata.isAdmin === true
      ); // Admins are also moderators
    }
  }, [isLoaded, isSignedIn, user]);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Navigation Menu */}
      <div className={`fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 rounded-r-3xl flex flex-col justify-between py-6 px-4 shadow-lg text-gray-800 dark:text-gray-200 transform transition-transform duration-300 ease-in-out z-50 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex justify-center bg-indigo-900 dark:bg-indigo-900 w-24 h-24 rounded-full items-center mx-auto shadow-md p-2">
            <Image
              src="/logo-vocea.png"
              alt="VOC Logo"
              width={160}
              height={160}
              className="object-contain"
            />
          </div>

          {/* Menu Section */}
          <ul className="space-y-2">
            <NavItem
              href="/"
              icon={<Home size={20} />}
              label={t.home}
              isActive={pathname === "/"}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <NavItem
              href="/browse"
              icon={<Search size={20} />}
              label={t.browse}
              isActive={pathname === "/browse"}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <NavItem
              href="/forum"
              icon={<MessageSquare size={20} />}
              label={t.forum}
              isActive={pathname === "/forum"}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <NavItem
              href="/dashboard"
              icon={<LayoutDashboard size={20} />}
              label={t.dashboard}
              isActive={pathname === "/dashboard"}
              onClick={() => setIsMobileMenuOpen(false)}
            />
          </ul>
        </div>

        {/* Bottom Section */}
        <div className="space-y-2">
          <Separator />
          <LanguageToggle />
          <ThemeToggle />

          {/* Admin Panel - Only visible to admins */}
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-4 py-2 h-10 font-medium text-sm"
                >
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  {t.adminPanel}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <Link href="/admin/projects">
                  <DropdownMenuItem className="cursor-pointer">
                    <Card className="w-full p-4">
                      <h3 className="font-medium text-sm">{t.projectsManagement}</h3>
                      <p className="text-sm text-muted-foreground">
                        {language === "ro"
                          ? "Gestionează toate proiectele"
                          : "Manage all projects"}
                      </p>
                    </Card>
                  </DropdownMenuItem>
                </Link>
                <Link href="/admin/reports">
                  <DropdownMenuItem className="cursor-pointer">
                    <Card className="w-full p-4">
                      <h3 className="font-medium text-sm">{t.reports}</h3>
                      <p className="text-sm text-muted-foreground">
                        {language === "ro"
                          ? "Vizualizează conținutul raportat"
                          : "View reported content"}
                      </p>
                    </Card>
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Moderator Panel - Only visible to moderators and admins */}
          {isModerator && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-4 py-2 h-10 font-medium text-sm"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {t.moderatorPanel}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <Link href="/moderator/news">
                  <DropdownMenuItem className="cursor-pointer">
                    <Card className="w-full p-4">
                      <h3 className="font-medium text-sm">{t.newsManagement}</h3>
                      <p className="text-sm text-muted-foreground">
                        {language === "ro"
                          ? "Gestionează ultimele știri"
                          : "Manage latest news"}
                      </p>
                    </Card>
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            variant="ghost"
            className="w-full justify-start px-4 py-2 h-10 font-medium text-sm"
            asChild
          >
            <Link href="/contact">
              <MessageSquare className="mr-2 h-4 w-4" />
              {t.contactUs}
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start px-4 py-2 h-10 font-medium text-sm"
            asChild
          >
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              {t.settings}
            </Link>
          </Button>
          <Separator />
          {isLoaded &&
            (isSignedIn ? (
              <Button
                variant="ghost"
                className="w-full justify-start px-4 py-2 h-10 font-medium text-sm text-red-600 hover:text-red-700 hover:bg-red-100"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t.signOut}
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-4 py-2 h-10 font-medium text-sm"
                  onClick={() => (window.location.href = "/sign-in")}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {t.signIn}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-4 py-2 h-10 font-medium text-sm"
                  onClick={() => (window.location.href = "/sign-up")}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t.signUp}
                </Button>
              </>
            ))}
        </div>
      </div>
    </>
  );
};

export default Navbar;
