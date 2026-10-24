import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Inquiry, Status } from "./types";

// In-memory fallback (survives hot reloads via globalThis). Used when Supabase env vars are missing
// or when a Supabase call fails, so the app never crashes.
const g = globalThis as unknown as { __inquiries?: Inquiry[]; __sb?: SupabaseClient | null };

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

/** Demo seed data so the app looks populated immediately (memory mode only). */
function seedInquiries(): Inquiry[] {
  const M = "[需要人工跟进]";
  return [
    {
      id: "seed-0005", user_id: "seed-parent-2", parent_name: "陈美玲", phone: "011-2345678", branch: "SS15", child_age: 6,
      question: "我女儿才6岁，可以报名吗？",
      category: "其他", needs_human: true, status: "pending", created_at: ago(15),
      ai_draft: `陈美玲您好，感谢您咨询 SS15 分店！关于您6岁的孩子：\n• 我们目前招收 7 至 17 岁的学生，您孩子的年龄需要另行咨询。\n\n${M} SS15 分店的工作人员将尽快联系您跟进。`,
    },
    {
      id: "seed-0004", user_id: "seed-parent-3", parent_name: "林志豪", phone: "016-8889999", branch: "SS15", child_age: 12,
      question: "你们周六上课吗？几点到几点？",
      category: "时间", needs_human: false, status: "approved", created_at: ago(60),
      ai_draft: "林志豪您好，感谢您咨询 SS15 分店！关于您12岁的孩子：\n• 上课时间为周一至五 2pm–8pm，周六 9am–1pm，周日休息。\n\n如需预约免费试课或有其他问题，欢迎随时联系我们。",
    },
    {
      id: "seed-0003", user_id: "demo-parent", parent_name: "陈小明", phone: "012-3456789", branch: "SS2", child_age: 10,
      question: "请问你们的老师是全职老师吗？如果两个孩子一起报名有没有兄弟姐妹折扣？",
      category: "其他", needs_human: true, status: "pending", created_at: ago(120),
      ai_draft: `陈小明您好，感谢您咨询 SS2 分店！\n\n${M} 您问题中的部分内容（老师是否全职、兄弟姐妹折扣）不在我们的常见问答范围内，SS2 分店的工作人员将尽快联系您跟进。`,
    },
    {
      id: "seed-0002", user_id: "seed-parent-4", parent_name: "黄淑芬", phone: "017-1112222", branch: "SS15", child_age: 14,
      question: "14岁有教什么科目？有校车接送吗？",
      category: "课程", needs_human: false, status: "pending", created_at: ago(240),
      ai_draft: "黄淑芬您好，感谢您咨询 SS15 分店！关于您14岁的孩子：\n• 科目有国文、英文、数学、科学，中学另有历史、地理；每班最多 12 人。\n• 很抱歉，我们不提供校车服务。\n\n如需预约免费试课或有其他问题，欢迎随时联系我们。",
    },
    {
      id: "seed-0001", user_id: "demo-parent", parent_name: "陈小明", phone: "012-3456789", branch: "SS2", child_age: 9,
      question: "你好，我孩子今年9岁，请问SS2分店每个月学费多少钱？第一次报名有什么费用？",
      category: "收费", needs_human: false, status: "approved", created_at: ago(300),
      ai_draft: "陈小明您好，感谢您咨询 SS2 分店！关于您9岁的孩子：\n• 小学学费为 RM280/月，报名费为 RM50。\n\n如需预约免费试课或有其他问题，欢迎随时联系我们。",
    },
  ];
}

const mem: Inquiry[] = (g.__inquiries ??= seedInquiries());

function client(): SupabaseClient | null {
  if (g.__sb !== undefined) return g.__sb;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  g.__sb = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return g.__sb;
}

export function storageMode(): "supabase" | "memory" {
  return client() ? "supabase" : "memory";
}

export async function insertInquiry(
  data: Omit<Inquiry, "id" | "created_at" | "status">
): Promise<Inquiry> {
  const sb = client();
  if (sb) {
    const { data: row, error } = await sb.from("inquiries").insert({ ...data, status: "pending" }).select().single();
    if (!error && row) return row as Inquiry;
    console.error("Supabase insert failed, falling back to memory:", error?.message);
  }
  const rec: Inquiry = { ...data, id: crypto.randomUUID(), status: "pending", created_at: new Date().toISOString() };
  mem.unshift(rec);
  return rec;
}

export async function listInquiries(): Promise<Inquiry[]> {
  const sb = client();
  if (sb) {
    const { data, error } = await sb.from("inquiries").select("*").order("created_at", { ascending: false });
    if (!error && data) return data as Inquiry[];
    console.error("Supabase list failed, falling back to memory:", error?.message);
  }
  return [...mem];
}

export async function updateInquiry(
  id: string,
  patch: { status?: Status; ai_draft?: string }
): Promise<Inquiry | null> {
  const sb = client();
  if (sb) {
    const { data, error } = await sb.from("inquiries").update(patch).eq("id", id).select().single();
    if (!error && data) return data as Inquiry;
    console.error("Supabase update failed, trying memory:", error?.message);
  }
  const rec = mem.find((r) => r.id === id);
  if (!rec) return null;
  Object.assign(rec, patch);
  return rec;
}
