"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, Hourglass, CheckCircle2, MessageSquareText, FilePlus2 } from "lucide-react";
import type { Inquiry } from "@/lib/types";

export default function MyInquiries() {
  const router = useRouter();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inquiries", { cache: "no-store" });
      if (res.status === 401) return router.replace("/login");
      setItems((await res.json()).inquiries ?? []);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000); // pick up admin approvals automatically
    return () => clearInterval(t);
  }, [load]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">我的咨询记录</h1>
          <p className="mt-1 text-sm text-slate-500">查看您提交的问题与补习中心的回复。</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> 刷新
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {!items.length && !loading && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            <p>您还没有提交过咨询</p>
            <Link href="/new" className="mt-3 inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              <FilePlus2 className="h-4 w-4" /> 提交新咨询
            </Link>
          </div>
        )}
        {items.map((i) => {
          const done = i.status === "approved";
          return (
            <article key={i.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">{i.branch}</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs">{i.child_age} 岁</span>
                <span className="rounded-md bg-sky-100 px-2 py-0.5 text-xs text-sky-700">{i.category}</span>
                <span
                  className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                    done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {done ? <><CheckCircle2 className="h-3 w-3" /> 已回复 (Replied)</> : <><Hourglass className="h-3 w-3" /> 审核中 (Pending)</>}
                </span>
                <span className="ml-auto text-xs text-slate-400">{new Date(i.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm"><b>我的问题：</b>{i.question}</p>
              {done ? (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <MessageSquareText className="h-3.5 w-3.5" /> 补习中心回复
                  </p>
                  <p className="whitespace-pre-wrap text-sm">{i.ai_draft}</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">工作人员正在审核您的咨询，审核通过后回复将显示在这里。</p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
