"use client";

import { usePathname } from "next/navigation";
import HeaderNav from "@/components/HeaderNav";
import HomeContent from "@/components/HomeContent";
import LoginForm from "@/components/LoginForm";

export default function Page() {
  const pathname = usePathname();

  // Determine which content to render based on the current path
  const renderContent = () => {
    if (pathname === "/auth/login") {
      return <LoginForm />;
    }
    
    // Default to home content
    return (
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <HomeContent />
        </div>
      </main>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Show header navigation for all routes except login */}
      {pathname !== "/auth/login" && <HeaderNav />}
      
      {/* Main content area */}
      {renderContent()}
      
      {/* Footer - only show on home page */}
      {pathname === "/" && (
        <footer className="border-t border-border bg-card/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">L</span>
                  </div>
                  <span className="font-display font-semibold text-lg">Lendscape</span>
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  AI-powered internship recommendations to help you find the perfect career opportunity.
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold">Quick Links</h3>
                <nav className="flex flex-col space-y-2">
                  <button 
                    onClick={() => {
                      const element = document.getElementById("companies");
                      element?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground text-left transition-colors"
                  >
                    Browse Companies
                  </button>
                  <button 
                    onClick={() => {
                      const element = document.getElementById("reviews");
                      element?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground text-left transition-colors"
                  >
                    Student Reviews
                  </button>
                  <button 
                    onClick={() => {
                      const element = document.getElementById("eligibility");
                      element?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground text-left transition-colors"
                  >
                    Check Eligibility
                  </button>
                </nav>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold">Contact</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>support@lendscape.com</p>
                  <p>1-800-INTERN-1</p>
                  <p className="text-xs">
                    © 2024 Lendscape. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}