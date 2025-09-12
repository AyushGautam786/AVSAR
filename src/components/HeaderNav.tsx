"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, LogIn, User, Home, Building2, LifeBuoy, Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LoginDialog } from "@/components/LoginDialog";
import { authClient, useSession } from "@/lib/auth-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface HeaderNavProps {
  className?: string;
}

const navItems = [
  { label: "Home", href: "/", sectionId: "home" },
  { label: "Companies Listed", href: "/", sectionId: "companies" },
  { label: "Reviews", href: "/", sectionId: "reviews" },
  { label: "Eligibility", href: "/", sectionId: "eligibility" },
];

export default function HeaderNav({ className }: HeaderNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session, refetch } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Handle navigation clicks - scroll to section if on home page, otherwise navigate then scroll
  const handleNavClick = async (sectionId: string) => {
    setMobileMenuOpen(false);
    
    if (pathname === "/") {
      // Already on home page, just scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // Navigate to home page first, then scroll after navigation completes
      router.push("/");
      // Wait for navigation to complete before scrolling
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  };

  const isCurrentSection = (sectionId: string) => {
    // For simplicity, we'll mark "home" as current when on the home page
    // In a real app, you might use scroll position to determine active section
    return pathname === "/" && sectionId === "home";
  };

  const initials = (session?.user?.name || session?.user?.email || "U")
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSignOut = async () => {
    const { error } = await authClient.signOut();
    if (!error?.code) {
      localStorage.removeItem("bearer_token");
      await refetch();
      router.push("/");
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border ${className}`}
    >
      <nav className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6" role="navigation" aria-label="Main navigation">
        {/* Logo and Site Name */}
        <Link href="/" className="flex items-center space-x-2 text-foreground hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          <span className="font-display font-semibold text-lg">AVSAR</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <button
              key={item.sectionId}
              onClick={() => handleNavClick(item.sectionId)}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-current={isCurrentSection(item.sectionId) ? "page" : undefined}
            >
              {item.label}
            </button>
          ))}
          <Link
            href="/recommendations"
            className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Recommendations
          </Link>
        </div>

        {/* Desktop Auth/User Actions */}
        <div className="hidden md:flex items-center space-x-2">
          {session?.user ? (
            <HoverCard openDelay={50} closeDelay={50} open={userMenuOpen} onOpenChange={setUserMenuOpen}>
              <HoverCardTrigger asChild>
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-border p-1.5 hover:bg-secondary transition-colors"
                  onClick={() => setUserMenuOpen((v) => !v)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </HoverCardTrigger>
              <HoverCardContent side="right" align="end" className="w-64 bg-card/70 backdrop-blur-md border-border">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{session.user.name || "User"}</p>
                      <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
                    </div>
                  </div>
                  <div className="grid gap-1.5 pt-2">
                    <Link href="/profile" className="flex items-center gap-2 px-2 py-2 rounded hover:bg-accent/60 text-sm">
                      <User className="h-4 w-4" /> Profile
                    </Link>
                    <button
                      onClick={() => handleNavClick("home")}
                      className="flex items-center gap-2 px-2 py-2 rounded hover:bg-accent/60 text-sm"
                    >
                      <Home className="h-4 w-4" /> Home
                    </button>
                    <button
                      onClick={() => handleNavClick("companies")}
                      className="flex items-center gap-2 px-2 py-2 rounded hover:bg-accent/60 text-sm"
                    >
                      <Building2 className="h-4 w-4" /> Companies
                    </button>
                    <Link href="/recommendations" className="flex items-center gap-2 px-2 py-2 rounded hover:bg-accent/60 text-sm">
                      <Sparkles className="h-4 w-4" /> Recommendations
                    </Link>
                    <a href="mailto:support@avsar.com" className="flex items-center gap-2 px-2 py-2 rounded hover:bg-accent/60 text-sm">
                      <LifeBuoy className="h-4 w-4" /> Support
                    </a>
                    <button onClick={handleSignOut} className="flex items-center gap-2 px-2 py-2 rounded hover:bg-accent/60 text-sm text-destructive">
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          ) : (
            <>
              <LoginDialog
                trigger={
                  <Button variant="ghost" size="sm">
                    <LogIn className="w-4 h-4 mr-2" />
                    Log in
                  </Button>
                }
              />
              <Button size="sm" asChild>
                <Link href="/auth/register">Register</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription>
                Navigate to different sections or access your account.
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col space-y-2 mt-6">
              {/* Mobile Navigation Links */}
              {navItems.map((item) => (
                <button
                  key={item.sectionId}
                  onClick={() => handleNavClick(item.sectionId)}
                  className="flex items-center px-3 py-3 text-left text-foreground hover:bg-accent rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-current={isCurrentSection(item.sectionId) ? "page" : undefined}
                >
                  {item.label}
                </button>
              ))}
              
              {/* Mobile Auth/User Actions */}
              <div className="pt-4 mt-4 border-t border-border space-y-2">
                {session?.user ? (
                  <div className="grid gap-2">
                    <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded hover:bg-accent">Profile</Link>
                    <button onClick={() => handleNavClick("home")} className="w-full text-left px-3 py-2 rounded hover:bg-accent">Home</button>
                    <button onClick={() => handleNavClick("companies")} className="w-full text-left px-3 py-2 rounded hover:bg-accent">Companies</button>
                    <Link href="/recommendations" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded hover:bg-accent">Recommendations</Link>
                    <a href="mailto:support@avsar.com" className="px-3 py-2 rounded hover:bg-accent">Support</a>
                    <button onClick={async () => { await handleSignOut(); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded hover:bg-accent text-destructive">Sign out</button>
                  </div>
                ) : (
                  <>
                    <LoginDialog
                      trigger={
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <LogIn className="w-4 h-4 mr-2" />
                          Log in
                        </Button>
                      }
                    />
                    <Button size="sm" className="w-full" asChild>
                      <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                        Register
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}