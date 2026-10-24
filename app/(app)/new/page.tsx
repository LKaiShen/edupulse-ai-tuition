import { Clock, MapPin, Users, GraduationCap, Wallet, CalendarCheck, Sparkles } from "lucide-react";
import InquiryForm from "@/components/InquiryForm";
import { requireRole } from "@/lib/guard";

const HOURS = "周一至五 2pm–8pm | 周六 9am–1pm | 周日休";

export default function NewInquiryPage() {
  const s = requireRole("user");
  return (
    <>
      <section>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-3.5 py-1 text-sm font-medium text-indigo-700">
          ✨ AI 驱动 7x24 家校咨询中心
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          欢迎咨询 <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">SS2 / SS15</span> 补习中心
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          提交您的问题，系统将依据我们官方的课程与收费准则即时起草回复，并由工作人员审核确认。
        </p>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <aside className="space-y-5 lg:col-span-2">
          {["SS2", "SS15"].map((b) => (
            <div key={b} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white">
                  <MapPin className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-bold">{b} 分店</h2>
              </div>
              <p className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" /> {HOURS}
              </p>
            </div>
          ))}

          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-bold">
              <Sparkles className="h-4 w-4 text-indigo-600" /> 常见资讯速览 (Quick Info)
            </h2>
            <ul className="mt-3 space-y-2.5 text-sm text-slate-700">
              <li className="flex gap-2"><GraduationCap className="h-4 w-4 shrink-0 text-indigo-500" /> 招收学生年龄：7–17 岁</li>
              <li className="flex gap-2"><Users className="h-4 w-4 shrink-0 text-indigo-500" /> 小班制，每班最多 12 人</li>
              <li className="flex gap-2"><Wallet className="h-4 w-4 shrink-0 text-indigo-500" /> 小学 RM280/月 · 中学 RM350/月</li>
              <li className="flex gap-2"><CalendarCheck className="h-4 w-4 shrink-0 text-indigo-500" /> 提供 1 次免费试课（需预约）</li>
            </ul>
          </div>
        </aside>

        <section className="lg:col-span-3">
          <InquiryForm defaults={{ name: s.name, phone: s.phone }} />
        </section>
      </div>
    </>
  );
}
