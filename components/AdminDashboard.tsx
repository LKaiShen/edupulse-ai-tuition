"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Check, AlertTriangle, Pencil, Save, X, Database, Inbox, Hourglass, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import type { Inquiry } from "@/lib/types";

type Status = "all" | "pending" | "human" | "approved";
type BranchF = "all" | "SS2" | "SS15";

export default function AdminDashboard() {
  const router = useRouter();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [storage, setStorage] = useState("");
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState<BranchF>("all");
  const [status, setStatus] = useState<Status>("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inquiries", { cache: "no-store" });
      if (res.status === 401) return router.replace("/login");
      const data = await res.json();
      setItems(data.inquiries ?? []);
      setStorage(data.storage ?? "");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function patch(id: string, body: object) {
    const res = await fetch(`/api/inquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 401) return router.replace("/login");
    if (res.ok) {
      const { inquiry } = await res.json();
      setItems((p) => p.map((i) => (i.id === id ? inquiry : i)));
    }
  }

  const byBranch = useMemo(() => items.filter((i) => branch === "all" || i.branch === branch), [items, branch]);
  const kpi = {
    total: byBranch.length,
    human: byBranch.filter((i) => i.needs_human).length,
    pending: byBranch.filter((i) => i.status === "pending").length,
    approved: byBranch.filter((i) => i.status === "approved").length,
  };
  const shown = byBranch.filter((i) =>
    status === "all" ? true : status === "human" ? i.needs_human : i.status === status
  );

  const branchTabs: [BranchF, string][] = [
    ["all", "全部 (All Branches)"],
    ["SS2", "SS2 分店"],
    ["SS15", "SS15 分店"],
  ];
  const statusTabs: [Status, string, number][] = [
    ["all", "全部", kpi.total],
    ["pending", "待处理", kpi.pending],
    ["human", "需人工", kpi.human],
    ["approved", "已批准", kpi.approved],
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">管理后台</h1>
          <p className="mt-1 flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Database className="h-3.5 w-3.5" /> 存储: {storage === "supabase" ? "Supabase" : "内存 (未配置 Supabase)"}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> 刷新
          </button>
        </div>
      </div>

      {/* Branch filter */}
      <div id="branch-filter" className="mt-6 inline-flex rounded-xl border border-slate-200/80 bg-white p-1 shadow-sm">
        {branchTabs.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setBranch(k)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
              branch === k ? "bg-indigo-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div id="kpi-cards" className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="总咨询数 (Total Inquiries)" value={kpi.total} icon={Inbox} cls="from-indigo-600 to-violet-600 shadow-indigo-600/25" />
        <Kpi label="待人工处理 (需要人工)" value={kpi.human} icon={AlertTriangle} cls="from-rose-600 to-red-500 shadow-rose-600/25" pulse />
        <Kpi label="待审核草稿 (Pending Approval)" value={kpi.pending} icon={Hourglass} cls="from-amber-500 to-orange-400 shadow-amber-500/25" />
        <Kpi label="已批准回复 (Approved)" value={kpi.approved} icon={CheckCircle2} cls="from-emerald-600 to-green-500 shadow-emerald-600/25" />
      </div>

      {/* Status pills */}
      <div className="mt-6 flex flex-wrap gap-2">
        {statusTabs.map(([k, label, n]) => (
          <button
            key={k}
            onClick={() => setStatus(k)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              status === k ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200/80 hover:bg-slate-100"
            }`}
          >
            {label} <span className="opacity-70">{n}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {!shown.length && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">暂无咨询记录</p>
        )}
        {shown.map((i) => (
          <article
            key={i.id}
            data-human={i.needs_human ? "true" : "false"}
            className={`rounded-2xl border bg-white p-5 shadow-sm ${
              i.needs_human ? "border-slate-200/80 border-l-4 border-l-rose-500 bg-rose-50/20" : "border-slate-200/80"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">{i.parent_name}</span>
              <span className="text-slate-500">{i.phone}</span>
              <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">{i.branch}</span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs">{i.child_age} 岁</span>
              <span className="rounded-md bg-sky-100 px-2 py-0.5 text-xs text-sky-700">{i.category}</span>
              {i.needs_human && (
                <span className="rounded-md bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">⚠️ 需要人工</span>
              )}
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${i.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {i.status === "approved" ? "已批准" : "待处理"}
              </span>
              <span className="ml-auto text-xs text-slate-400">{new Date(i.created_at).toLocaleString()}</span>
            </div>

            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm"><b>问题：</b>{i.question}</p>

            <div className="mt-3 overflow-hidden rounded-xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/60 to-white">
              <p className="flex items-center gap-1.5 border-b border-indigo-100 px-3 py-2 text-xs font-semibold text-indigo-700">
                <Sparkles className="h-3.5 w-3.5" /> ✨ AI 起草回复 (基于官方 FAQ)
              </p>
              {editing === i.id ? (
                <textarea rows={7} value={draft} onChange={(e) => setDraft(e.target.value)} className="w-full bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-300" />
              ) : (
                <p className="whitespace-pre-wrap p-3 text-sm">{i.ai_draft}</p>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              {editing === i.id ? (
                <>
                  <button onClick={async () => { await patch(i.id, { ai_draft: draft }); setEditing(null); }} className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700">
                    <Save className="h-4 w-4" /> 保存
                  </button>
                  <button onClick={() => setEditing(null)} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">
                    <X className="h-4 w-4" /> 取消
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setEditing(i.id); setDraft(i.ai_draft); }} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">
                    <Pencil className="h-4 w-4" /> 编辑草稿
                  </button>
                  {i.status === "pending" && (
                    <button onClick={() => patch(i.id, { status: "approved" })} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700">
                      <Check className="h-4 w-4" /> 批准
                    </button>
                  )}
                </>
              )}
            </div>
          </article>
        ))}
      </div>
      {loading && !items.length && (
        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> 加载中...</p>
      )}
    </div>
  );
}

function Kpi({ label, value, icon: Icon, cls, pulse }: { label: string; value: number; icon: React.ElementType; cls: string; pulse?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${cls} p-5 text-white shadow-lg`}>
      <Icon className="absolute -bottom-3 -right-3 h-20 w-20 opacity-15" />
      <div className="flex items-center gap-2 text-sm font-medium text-white/90">
        <Icon className="h-4 w-4" /> {label}
        {pulse && value > 0 && (
          <span className="relative ml-auto flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
          </span>
        )}
      </div>
      <p className="mt-3 text-4xl font-extrabold">{value}</p>
    </div>
  );
}
