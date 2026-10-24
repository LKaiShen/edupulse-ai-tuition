"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  GraduationCap, FilePlus2, Inbox, LayoutDashboard, BookOpenCheck, LogOut,
  PanelLeftClose, PanelLeftOpen, Menu, X, FlaskConical, Loader2,
} from "lucide-react";

interface Props {
  session: { name: string; email: string; phone: string; role: "user" | "admin" };
  children: React.ReactNode;
}

const MENUS = {
  user: [
    { href: "/new", label: "📝 提交新咨询 (New Inquiry)", short: "提交新咨询", icon: FilePlus2 },
    { href: "/my", label: "📬 我的咨询记录 (My Inquiries)", short: "我的咨询记录", icon: Inbox },
  ],
  admin: [
    { href: "/admin", label: "📊 咨询管理看板 (Inquiry Dashboard)", short: "咨询管理看板", icon: LayoutDashboard, exact: true },
    { href: "/admin/faq", label: "🏢 分店与 FAQ 知识库 (FAQ Rules)", short: "分店与 FAQ 知识库", icon: BookOpenCheck },
  ],
};

export default function AppShell({ session, children }: Props) {
  const path = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const isAdmin = session.role === "admin";

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  async function switchRole() {
    setBusy(true);
    const target = isAdmin ? "user" : "admin";
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: target, demo: true }),
    });
    router.replace(target === "admin" ? "/admin" : "/new");
    router.refresh();
    setBusy(false);
    setOpen(false);
  }

  const initials = session.name.trim().slice(0, 1).toUpperCase();
  const badge = isAdmin
    ? "bg-emerald-100 text-emerald-700"
    : "bg-indigo-100 text-indigo-700";
  const roleLabel = isAdmin ? "管理端 Admin Console" : "家长端 Parent Portal";

  const sidebar = (compact: boolean) => (
    <div className="flex h-full flex-col bg-white">
      <div className={`flex items-center gap-2 border-b border-slate-200/80 p-4 ${compact ? "justify-center" : ""}`}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
          <GraduationCap className="h-5 w-5" />
        </span>
        {!compact && (
          <div className="min-w-0">
            <p className="font-extrabold leading-tight">EduPulse AI</p>
            <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge}`}>{roleLabel}</span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {MENUS[session.role].map((m) => {
          const active = "exact" in m && m.exact ? path === m.href : path.startsWith(m.href);
          const Icon = m.icon;
          return (
            <Link
              key={m.href}
              href={m.href}
              onClick={() => setOpen(false)}
              title={m.short}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? isAdmin ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25" : "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                  : "text-slate-600 hover:bg-slate-100"
              } ${compact ? "justify-center" : ""}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!compact && <span>{m.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-slate-200/80 p-3">
        {!compact && (
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-3">
            <p className="flex items-center gap-1 text-xs font-semibold text-amber-800">
              <FlaskConical className="h-3.5 w-3.5" /> 🧪 考官快捷切换 (Demo Switcher)
            </p>
            <button
              id="demo-switcher"
              onClick={switchRole}
              disabled={busy}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-amber-500 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-3 w-3 animate-spin" />}
              {isAdmin ? "切换到 家长视图 (Parent View)" : "切换到 管理员视图 (Admin View)"}
            </button>
          </div>
        )}
        <div className={`flex items-center gap-3 ${compact ? "justify-center" : ""}`}>
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-bold ${badge}`}>{initials}</span>
          {!compact && (
            <div className="min-w-0 text-sm">
              <p className="truncate font-semibold">{session.name}</p>
              <p className="truncate text-xs text-slate-500">{session.email}</p>
              {session.phone && <p className="truncate text-xs text-slate-400">{session.phone}</p>}
            </div>
          )}
        </div>
        <button
          id="signout-btn"
          onClick={signOut}
          title="退出登录"
          className={`flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600 ${compact ? "px-0" : ""}`}
        >
          <LogOut className="h-4 w-4" /> {!compact && "🚪 退出登录 (Sign Out)"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* desktop sidebar */}
      <aside className={`sticky top-0 hidden h-screen shrink-0 border-r border-slate-200/80 transition-all duration-200 lg:block ${collapsed ? "w-20" : "w-64"}`}>
        {sidebar(collapsed)}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label="折叠侧边栏"
          className="absolute -right-3 top-6 grid h-6 w-6 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow hover:text-indigo-600"
        >
          {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 shadow-2xl">{sidebar(false)}</div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
          <button aria-label="菜单" onClick={() => setOpen((o) => !o)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="font-bold">EduPulse AI</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge}`}>{roleLabel}</span>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
