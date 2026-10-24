"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clapperboard, ChevronLeft, ChevronRight, Volume2, VolumeX, X, Loader2 } from "lucide-react";

interface Step {
  title: string;
  text: string;
  route: string;
  targets: string[];
  /** true: highlight the union of all targets; false: highlight the first selector that matches */
  union?: boolean;
  prepare: () => Promise<void>;
}

const jsonPost = (url: string, body: object) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

const loginAs = (role: "user" | "admin") => jsonPost("/api/auth/login", { role, demo: true });

/** Make sure the dashboard has at least one needs-human inquiry to point at (as the demo parent). */
async function ensureHumanSample() {
  const res = await fetch("/api/inquiries", { cache: "no-store" });
  const data = res.ok ? await res.json() : { inquiries: [] };
  if (data.inquiries?.some((i: { needs_human: boolean }) => i.needs_human)) return;
  await loginAs("user");
  await jsonPost("/api/inquiries", {
    parent_name: "陈小明",
    phone: "012-3456789",
    branch: "SS2",
    child_age: 10,
    question: "请问你们的老师是全职老师吗？如果两个孩子一起报名有没有兄弟姐妹折扣？",
  });
  await loginAs("admin");
}

const STEPS: Step[] = [
  {
    title: "① 登录与角色分离",
    text: "欢迎体验 EduPulse AI。系统分为家长端与教务管理端，支持新家长注册与一键演示切换。",
    route: "/login",
    targets: ["#role-switch"],
    prepare: async () => {
      await fetch("/api/auth/logout", { method: "POST" });
    },
  },
  {
    title: "② 家长咨询与快速填充",
    text: "在家长端，家长可以选择 SS2 或 SS15 分店并提交问题。您可以点击这里的快速测试样例，一键测试收费、校车或超纲问题。",
    route: "/new",
    targets: ["#inquiry-card"],
    prepare: async () => {
      await loginAs("user");
    },
  },
  {
    title: "③ AI 防幻觉引擎",
    text: "提交后，AI 会自动将问题分类为收费、时间、课程或其他，并严格依据官方 9 条 FAQ 起草回复，绝不编造虚假信息。",
    route: "/new",
    targets: ["#submit-btn"],
    prepare: async () => {
      await loginAs("user");
    },
  },
  {
    title: "④ 管理后台与分店筛选",
    text: "在管理后台，老师可以按 SS2 或 SS15 分店筛选，实时查看总咨询数和待人工处理数。",
    route: "/admin",
    targets: ["#branch-filter", "#kpi-cards"],
    union: true,
    prepare: async () => {
      await loginAs("admin");
      await ensureHumanSample();
    },
  },
  {
    title: "⑤ 人工兜底审核",
    text: "超出 FAQ 范围的问题会自动标记为需要人工。老师可以随时编辑 AI 草稿，点击批准后，家长即可在个人中心看到正式回复。",
    route: "/admin",
    targets: ['article[data-human="true"]', "article"],
    prepare: async () => {
      await loginAs("admin");
    },
  },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor(selectors: string[], timeout = 8000): Promise<HTMLElement | null> {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    for (const s of selectors) {
      const el = document.querySelector<HTMLElement>(s);
      if (el) return el;
    }
    await sleep(120);
  }
  return null;
}

export default function DemoTour() {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [voice, setVoice] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const runId = useRef(0);
  const voiceRef = useRef(true);
  voiceRef.current = voice;

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (!voiceRef.current) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.95;
    const zh = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("zh"));
    if (zh) u.voice = zh;
    window.speechSynthesis.speak(u);
  }, []);

  const go = useCallback(
    async (n: number) => {
      const id = ++runId.current;
      const s = STEPS[n];
      setStep(n);
      setBusy(true);
      setRect(null);
      window.speechSynthesis?.cancel();
      try {
        await s.prepare();
        if (window.location.pathname !== s.route) {
          router.push(s.route);
        }
        router.refresh();
        await sleep(300);
        const el = await waitFor(s.targets);
        if (id !== runId.current) return;
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
        await sleep(450);
      } finally {
        if (id === runId.current) setBusy(false);
      }
      if (id === runId.current) speak(s.text);
    },
    [router, speak]
  );

  const end = useCallback(() => {
    runId.current++;
    window.speechSynthesis?.cancel();
    setActive(false);
    setRect(null);
  }, []);

  // Track the highlighted element's rectangle (union of all matched targets).
  useEffect(() => {
    if (!active || busy) return;
    const measure = () => {
      const found = STEPS[step].targets
        .map((sel) => document.querySelector<HTMLElement>(sel))
        .filter((e): e is HTMLElement => !!e);
      const use = STEPS[step].union ? found : found.slice(0, 1);
      if (!use.length) return setRect(null);
      const rs = use.map((e) => e.getBoundingClientRect());
      const l = Math.min(...rs.map((r) => r.left));
      const t = Math.min(...rs.map((r) => r.top));
      const r = Math.max(...rs.map((r) => r.right));
      const b = Math.max(...rs.map((r) => r.bottom));
      setRect(new DOMRect(l, t, r - l, b - t));
    };
    measure();
    const iv = setInterval(measure, 250);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearInterval(iv);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, busy, step]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && end();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, end]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  if (!active) {
    return (
      <button
        id="start-tour"
        onClick={() => {
          setActive(true);
          go(0);
        }}
        className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-2xl shadow-indigo-600/40 transition hover:scale-105"
      >
        <Clapperboard className="h-4 w-4" /> 🎬 播放系统语音导览 (Interactive Tour)
      </button>
    );
  }

  const s = STEPS[step];
  const pad = 8;
  const tooltipTop = rect ? rect.top + rect.height / 2 > window.innerHeight * 0.5 : false;

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      {rect ? (
        <div
          className="absolute rounded-2xl ring-4 ring-indigo-400 transition-all duration-300"
          style={{
            left: rect.left - pad,
            top: rect.top - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px rgba(15,23,42,0.6)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900/60" />
      )}

      <div
        className={`pointer-events-auto absolute left-1/2 w-[min(92vw,30rem)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl ${
          tooltipTop ? "top-5" : "bottom-5"
        }`}
        role="dialog"
        aria-label="系统导览"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-indigo-600">
            步骤 {step + 1} / {STEPS.length}
          </p>
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <span key={i} className={`h-1.5 w-6 rounded-full ${i <= step ? "bg-indigo-600" : "bg-slate-200"}`} />
            ))}
          </div>
        </div>
        <h3 className="mt-2 text-lg font-bold">{s.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.text}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            disabled={step === 0 || busy}
            onClick={() => go(step - 1)}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> 上一步
          </button>
          {step < STEPS.length - 1 ? (
            <button
              disabled={busy}
              onClick={() => go(step + 1)}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} 下一步 <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={end} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700">
              完成 ✓
            </button>
          )}
          <button
            onClick={() => {
              const next = !voice;
              setVoice(next);
              voiceRef.current = next;
              if (next) speak(s.text);
              else window.speechSynthesis?.cancel();
            }}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            {voice ? <Volume2 className="h-4 w-4 text-indigo-600" /> : <VolumeX className="h-4 w-4 text-slate-400" />}
            🔊 语音{voice ? "开" : "关"}
          </button>
          <button onClick={end} className="ml-auto flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-rose-50 hover:text-rose-600">
            <X className="h-4 w-4" /> 结束导览
          </button>
        </div>
      </div>
    </div>
  );
}
