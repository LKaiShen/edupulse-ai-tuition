"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Phone, Loader2, Sparkles, Tags, ShieldCheck, UserCheck, GraduationCap, ArrowRight } from "lucide-react";

const FEATURES = [
  { icon: Tags, title: "AI 自动分类", desc: "收费 / 时间 / 课程 / 其他" },
  { icon: ShieldCheck, title: "零幻觉 FAQ 智能起草", desc: "Strict Guardrails，只依据官方 FAQ" },
  { icon: UserCheck, title: "人工兜底审核机制", desc: "Human-in-the-Loop，超纲问题转人工" },
];

type Role = "user" | "admin";

const input =
  "w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

function Field({ icon: Icon, ...p }: { icon: React.ElementType } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input required className={input} {...p} />
    </div>
  );
}

export default function AuthView() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("user");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [f, setF] = useState({ name: "", phone: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function call(url: string, body: object) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "操作失败");
      router.replace(data.role === "admin" ? "/admin" : "/new");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
      setLoading(false);
    }
  }

  const isRegister = role === "user" && mode === "register";
  const roleBtn = (r: Role, label: string) => (
    <button
      type="button"
      onClick={() => { setRole(r); setMode("login"); setError(""); }}
      className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
        role === r ? (r === "admin" ? "bg-emerald-600 text-white shadow" : "bg-indigo-600 text-white shadow") : "text-slate-600 hover:bg-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-12 text-white lg:flex lg:flex-col lg:justify-center">
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute right-12 top-16 w-52 rotate-6 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
          <p className="text-xs text-indigo-200">今日咨询</p>
          <p className="text-3xl font-bold">128</p>
          <div className="mt-2 h-1.5 rounded-full bg-white/20"><div className="h-full w-3/4 rounded-full bg-emerald-400" /></div>
        </div>
        <div className="absolute bottom-16 right-16 w-56 -rotate-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
          <p className="flex items-center gap-1 text-xs text-indigo-200"><Sparkles className="h-3 w-3" /> AI 起草回复</p>
          <p className="mt-1 text-sm">陈小明家长您好，SS2 分店小学学费为 RM280/月…</p>
        </div>
        <div className="relative max-w-md">
          <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur">
            <GraduationCap className="h-8 w-8" />
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight">EduPulse AI</h1>
          <p className="mt-2 text-xl text-indigo-100">智能教务与家校咨询中心 (SS2 &amp; SS15)</p>
          <ul className="mt-10 space-y-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 backdrop-blur">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-indigo-200">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid place-items-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-indigo-900/5">
          <div id="role-switch" className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {roleBtn("user", "👨‍👩‍👧 家长通道 (Parent / User)")}
            {roleBtn("admin", "🛡️ 教务管理 (Admin)")}
          </div>

          <h2 className="mt-6 text-2xl font-bold">
            {role === "admin" ? "管理员登录" : isRegister ? "新家长注册" : "家长登录"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {role === "admin" ? "管理员账号由中心统一分配，不开放自行注册。" : isRegister ? "注册后将自动登录，并可提交咨询。" : "登录后提交咨询并查看回复。"}
          </p>

          <button
            id="demo-login"
            type="button"
            disabled={loading}
            onClick={() => call("/api/auth/login", { role, demo: true })}
            className="group mt-5 flex w-full items-center justify-between gap-2 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 text-left text-sm font-semibold text-amber-900 transition hover:shadow-md disabled:opacity-60"
          >
            <span>
              {role === "admin" ? "✨ 考官测试：一键以「管理员 (Admin)」身份登录" : "✨ 考官测试：一键以「家长 (陈小明)」身份登录"}
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-1" />
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" /> 或手动{isRegister ? "注册" : "登录"} <span className="h-px flex-1 bg-slate-200" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isRegister) call("/api/auth/register", f);
              else call("/api/auth/login", { role, email: f.email, password: f.password });
            }}
            className="space-y-4"
          >
            {isRegister && (
              <>
                <Field icon={User} id="reg-name" placeholder="家长姓名 (Parent Name)" value={f.name} onChange={(e) => set("name", e.target.value)} />
                <Field icon={Phone} id="reg-phone" placeholder="联系电话 (Phone Number)" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
              </>
            )}
            <Field
              icon={Mail}
              id="email"
              type={isRegister ? "email" : "text"}
              placeholder={role === "admin" ? "管理员邮箱 / 用户名" : "邮箱 (Email)"}
              value={f.email}
              onChange={(e) => set("email", e.target.value)}
              autoComplete="username"
            />
            <Field
              icon={Lock}
              id="password"
              type="password"
              minLength={isRegister ? 6 : undefined}
              placeholder={isRegister ? "密码 (至少 6 位)" : "密码 (Password)"}
              value={f.password}
              onChange={(e) => set("password", e.target.value)}
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
            <button
              id="login-btn"
              disabled={loading}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white shadow-lg transition disabled:opacity-60 ${
                role === "admin" ? "bg-emerald-600 shadow-emerald-600/25 hover:bg-emerald-700" : "bg-indigo-600 shadow-indigo-600/25 hover:bg-indigo-700"
              }`}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} {isRegister ? "注册并登录" : "登录"}
            </button>
          </form>

          {role === "user" && (
            <p className="mt-4 text-center text-sm text-slate-500">
              {isRegister ? "已有账号？" : "还没有账号？"}
              <button type="button" id="toggle-mode" onClick={() => { setMode(isRegister ? "login" : "register"); setError(""); }} className="ml-1 font-semibold text-indigo-600 hover:underline">
                {isRegister ? "登录 (Login)" : "新家长注册 (Register)"}
              </button>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
