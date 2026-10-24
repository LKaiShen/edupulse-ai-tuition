"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Send, User, Phone, Cake, X, CheckCircle2, AlertTriangle, Bot } from "lucide-react";
import type { Inquiry } from "@/lib/types";

const TESTS = [
  { label: "💰 收费测试", age: 9, branch: "SS2", q: "你好，我孩子今年9岁，请问SS2分店每个月学费多少钱？第一次报名有什么费用？" },
  { label: "🚌 课程与校车测试", age: 14, branch: "SS15", q: "14岁有教什么科目？你们平时几点开门？有校车接送吗？" },
  { label: "🙋‍♂️ 超纲人工测试", age: 10, branch: "SS2", q: "请问你们的老师是全职老师吗？如果两个孩子一起报名有没有兄弟姐妹折扣？" },
] as const;

const field =
  "w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

export default function InquiryForm({ defaults }: { defaults: { name: string; phone: string } }) {
  const [f, setF] = useState({ parent_name: defaults.name, phone: defaults.phone, branch: "SS2", child_age: "", question: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ inquiry: Inquiry; engine: string; needs_human: boolean } | null>(null);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, child_age: Number(f.child_age) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "提交失败");
      setDone(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="inquiry-card" className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-indigo-900/5 sm:p-8">
      <h2 className="text-xl font-bold">家长咨询表单</h2>

      <div className="mt-4 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 p-3">
        <p className="mb-2 text-xs font-semibold text-indigo-700">✨ 快速测试样例 (Quick Fill Test Cases)</p>
        <div className="flex flex-wrap gap-2">
          {TESTS.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setF({ parent_name: defaults.name, phone: defaults.phone, branch: t.branch, child_age: String(t.age), question: t.q })}
              className="rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-600 hover:text-white"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            姓名 (Parent Name)
            <div className="relative mt-1">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="parent_name" required className={`${field} pl-10 pr-3`} value={f.parent_name} onChange={(e) => set("parent_name", e.target.value)} />
            </div>
          </label>
          <label className="block text-sm font-medium">
            电话 (Phone Number)
            <div className="relative mt-1">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="phone" required className={`${field} pl-10 pr-3`} value={f.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset>
            <legend className="text-sm font-medium">分店 (Branch)</legend>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {["SS2", "SS15"].map((b) => (
                <label
                  key={b}
                  className={`cursor-pointer rounded-xl border py-2.5 text-center text-sm font-semibold transition ${
                    f.branch === b ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/25" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input type="radio" name="branch" value={b} required checked={f.branch === b} onChange={() => set("branch", b)} className="sr-only" />
                  {b}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm font-medium">
            孩子年龄 (Child Age)
            <div className="relative mt-1">
              <Cake className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="child_age" type="number" min={1} max={99} required placeholder="5 - 18" className={`${field} pl-10 pr-3`} value={f.child_age} onChange={(e) => set("child_age", e.target.value)} />
            </div>
          </label>
        </div>
        <label className="block text-sm font-medium">
          问题 (Question)
          <textarea id="question" required rows={5} className={`${field} mt-1 px-3`} value={f.question} onChange={(e) => set("question", e.target.value)} />
        </label>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <button
          id="submit-btn"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:brightness-110 disabled:opacity-60"
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> AI 正在处理中...</> : <><Send className="h-4 w-4" /> 提交咨询</>}
        </button>
      </form>

      {done && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button aria-label="关闭" onClick={() => setDone(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h3 className="mt-3 text-xl font-bold">提交成功！</h3>
            <p className="mt-1 text-sm text-slate-600">AI 已完成分类，工作人员审核后会在「我的咨询记录」中回复您。</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-sky-100 px-3 py-1 font-medium text-sky-700">分类：{done.inquiry.category}</span>
              {done.needs_human && (
                <span className="flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 font-medium text-rose-700">
                  <AlertTriangle className="h-3.5 w-3.5" /> 将由工作人员亲自跟进
                </span>
              )}
              <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">状态：审核中</span>
            </div>
            <p className="mt-3 flex items-center gap-1 text-xs text-slate-400">
              <Bot className="h-3.5 w-3.5" /> 引擎：{done.engine === "gemini" ? "Gemini" : "规则兜底"}
            </p>
            <Link href="/my" className="mt-5 block rounded-xl bg-indigo-600 py-2.5 text-center font-semibold text-white transition hover:bg-indigo-700">
              查看我的咨询进度 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
