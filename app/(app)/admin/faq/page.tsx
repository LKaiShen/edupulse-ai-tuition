import { MapPin, Clock, Users, ShieldCheck, BookOpenCheck, Bot } from "lucide-react";
import { requireRole } from "@/lib/guard";
import { FAQ_ITEMS } from "@/lib/ai";

const BRANCHES = [
  { code: "SS2", hours: "周一至五 2pm–8pm | 周六 9am–1pm | 周日休", cap: "每班最多 12 人" },
  { code: "SS15", hours: "周一至五 2pm–8pm | 周六 9am–1pm | 周日休", cap: "每班最多 12 人" },
];

export default function FaqPage() {
  requireRole("admin");
  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">分店与 FAQ 知识库</h1>
      <p className="mt-1 text-sm text-slate-500">只读参考：AI 草稿仅可依据以下 9 条官方 FAQ，超出范围一律转人工。</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {BRANCHES.map((b) => (
          <div key={b.code} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white"><MapPin className="h-5 w-5" /></span>
              <h2 className="text-lg font-bold">{b.code} 分店</h2>
            </div>
            <p className="mt-3 flex gap-2 text-sm text-slate-600"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {b.hours}</p>
            <p className="mt-1.5 flex gap-2 text-sm text-slate-600"><Users className="h-4 w-4 shrink-0 text-emerald-600" /> {b.cap}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-bold"><BookOpenCheck className="h-5 w-5 text-emerald-600" /> 官方 FAQ 规则 (9 条)</h2>
        <ol className="mt-4 space-y-2.5">
          {FAQ_ITEMS.map((t, n) => (
            <li key={n} className="flex gap-3 rounded-xl bg-slate-50 p-3 text-sm">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white">{n + 1}</span>
              {t}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/40 p-6">
        <h2 className="flex items-center gap-2 font-bold"><ShieldCheck className="h-5 w-5 text-rose-600" /> AI 防幻觉规则 (Guardrails)</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
          <li>问题任何一部分超出上述 FAQ（如兄弟姐妹折扣、师资、地址、成绩、假期营），必须标记「需要人工」。</li>
          <li>孩子年龄不在 7–17 岁，需要特别咨询，同样转人工。</li>
          <li>禁止编造、假设或推断 FAQ 之外的政策、价格或事实。</li>
          <li>询问校车属于 FAQ 范围（不提供校车），单独询问无需人工。</li>
        </ul>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><Bot className="h-3.5 w-3.5" /> 分类：收费 / 时间 / 课程 / 其他</p>
      </div>
    </div>
  );
}
