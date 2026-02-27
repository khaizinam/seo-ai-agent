"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const menuItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: "Quản lý bài viết",
    href: "/admin/articles",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 2V8h6" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8M8 16h8" />
      </svg>
    ),
  },
  {
    name: "Quản lý chiến dịch",
    href: "/admin/campaigns",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    name: "Cấu hình AI",
    href: "/admin/ai-settings",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg font-bold">SEO</div>
          <span className="text-xl font-bold text-foreground">ADMIN</span>
        </Link>
        <p className="text-[10px] text-muted-foreground mt-1 ml-11 uppercase tracking-widest font-semibold">Hệ thống quản trị</p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Menu chính</p>
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <div className="bg-muted/30 p-3 rounded-lg flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Super Admin</p>
            <p className="text-xs text-muted-foreground truncate">admin@seo.local</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
