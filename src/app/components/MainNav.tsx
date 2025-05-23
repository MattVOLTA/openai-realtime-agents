"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase";

export default function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = getSupabaseClient();
  
  const navItems = [
    { label: "Home", href: "/" },
    { label: "Interviews", href: "/interviews" },
  ];

  const handleSignOut = async () => {
    try {
      // First, sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear any localStorage or sessionStorage items
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies (except session cookies set by the server which can't be cleared client-side)
      document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      console.log("Signed out successfully, redirecting to login page");
      
      // Force a full page navigation instead of using router
      // This ensures a complete refresh including memory cache
      window.location.href = '/login';
    } catch (error) {
      console.error("Error during sign out:", error);
      // Fallback to router if the above fails
      router.refresh();
      router.push("/login");
    }
  };
  
  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-gray-900 flex items-center">
              <span className="text-blue-600 mr-1">Volta</span> Research
            </Link>
          </div>
          
          <div className="hidden md:flex items-center">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <button
              onClick={handleSignOut}
              className="ml-6 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 