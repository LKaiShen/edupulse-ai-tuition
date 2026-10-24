import type { Branch, Category, TriageResult } from "./types";
import { CATEGORIES } from "./types";

export const FAQ_ITEMS = [
  "小学 RM280/月，中学 RM350/月，报名费 RM50 (小学: 7-12岁, 中学: 13-17岁)",
  "周一至五 2pm–8pm，周六 9am–1pm，周日休",
  "每班最多 12 人",
  "科目：国文、英文、数学、科学；中学另有历史、地理",
  "一次免费试课，需预约",
  "招收学生年龄：7 至 17 岁",
  "付款方式：银行转账或现金，每月 5 号前缴",
  "请假规则：请假提前一天通知，每月最多补课 2 次",
  "交通：不提供校车",
];

export const FAQ = FAQ_ITEMS.map((t, n) => `${n + 1}. ${t}`).join("\n");

export const MARKER = "[需要人工跟进]";

interface Input {
  parent_name: string;
  branch: Branch;
  child_age: number;
  question: string;
}

function buildPrompt(i: Input) {
  return `你是补习中心 (${i.branch} 分店) 的客服助理。严格只能根据下面的 FAQ 回答，禁止编造、假设或推断任何 FAQ 之外的政策、价格或事实。

# FAQ (唯一可用事实)
${FAQ}

# 规则
1. category 只能是: 收费, 时间, 课程, 其他。
2. 如果家长的问题中【任何一部分】询问 FAQ 未涵盖的信息 (如兄弟姐妹折扣、老师资历/是否全职、具体地址、考试成绩/及格率、假期营等)，或孩子年龄不在 7–17 岁范围内需要特别咨询，必须 needs_human = true。
3. 问校车属于 FAQ 已涵盖 (不提供校车)，单独询问不需要人工。
4. ai_draft: 用中文礼貌称呼家长姓名，提及所选分店和孩子年龄。
   - needs_human=false: 仅用 FAQ 事实给出准确完整的回复。
   - needs_human=true: 回答 FAQ 能回答的部分；未知部分明确说明会有工作人员跟进，并在草稿中清楚标注 ${MARKER}。
5. 年龄 7-12 为小学收费，13-17 为中学收费。

# 询问
家长姓名: ${i.parent_name}
分店: ${i.branch}
孩子年龄: ${i.child_age}
问题: ${i.question}

只输出 JSON。`;
}

/** Enforce the hard rules regardless of what the LLM returned. */
function sanitize(r: Partial<TriageResult>, i: Input): TriageResult {
  const category: Category = CATEGORIES.includes(r.category as Category) ? (r.category as Category) : "其他";
  let needs = Boolean(r.needs_human);
  if (i.child_age < 7 || i.child_age > 17) needs = true;
  let draft = String(r.ai_draft ?? "").trim();
  if (!draft) {
    needs = true;
    draft = `${i.parent_name}您好，感谢您咨询 ${i.branch} 分店。关于您的问题，工作人员将尽快跟进。`;
  }
  if (needs && !draft.includes(MARKER)) draft += `\n\n${MARKER} 工作人员将尽快联系您跟进。`;
  if (!needs) draft = draft.replaceAll(MARKER, "").trim();
  return { category, needs_human: needs, ai_draft: draft };
}

async function callGemini(i: Input, apiKey: string): Promise<TriageResult> {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildPrompt(i) }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              category: { type: "STRING", enum: CATEGORIES },
              needs_human: { type: "BOOLEAN" },
              ai_draft: { type: "STRING" },
            },
            required: ["category", "needs_human", "ai_draft"],
          },
        },
      }),
      signal: AbortSignal.timeout(30000),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");
  return sanitize(JSON.parse(text), i);
}

// ---------- Rule-based fallback (no API key / API failure) ----------
function fallbackTriage(i: Input): TriageResult {
  const q = i.question;
  const has = (re: RegExp) => re.test(q);
  const parts: string[] = [];
  const cats: Category[] = [];
  const age = i.child_age;
  const primary = age >= 7 && age <= 12;
  const secondary = age >= 13 && age <= 17;

  let known = false;
  if (has(/学费|收费|多少钱|费用|报名费|价|RM|fee/i)) {
    known = true;
    cats.push("收费");
    if (primary) parts.push("小学学费为 RM280/月，报名费为 RM50");
    else if (secondary) parts.push("中学学费为 RM350/月，报名费为 RM50");
    else parts.push("小学 (7-12岁) 学费 RM280/月，中学 (13-17岁) 学费 RM350/月，报名费 RM50");
  }
  if (has(/几点|开门|时间|星期|周[一二三四五六日末]|营业|上课/)) {
    known = true;
    cats.push("时间");
    parts.push("上课时间为周一至五 2pm–8pm，周六 9am–1pm，周日休息");
  }
  if (has(/科目|教什么|课程|科|班|人数|几个人|多少人/)) {
    known = true;
    cats.push("课程");
    parts.push(
      secondary
        ? "科目有国文、英文、数学、科学，中学另有历史、地理；每班最多 12 人"
        : "科目有国文、英文、数学、科学 (中学另有历史、地理)；每班最多 12 人"
    );
  }
  if (has(/试课|试听/)) {
    known = true;
    cats.push("课程");
    parts.push("我们提供一次免费试课，需提前预约");
  }
  if (has(/校车|接送|交通/)) {
    known = true;
    cats.push("其他");
    parts.push("很抱歉，我们不提供校车服务");
  }
  if (has(/付款|缴费|转账|现金|怎么交|如何交/)) {
    known = true;
    cats.push("收费");
    parts.push("付款方式为银行转账或现金，请在每月 5 号前缴交");
  }
  if (has(/请假|补课/)) {
    known = true;
    cats.push("其他");
    parts.push("请假需提前一天通知，每月最多补课 2 次");
  }
  if (has(/年龄|几岁|收.*岁/)) {
    known = true;
    cats.push("其他");
    parts.push("我们招收 7 至 17 岁的学生");
  }

  const unknownTopic = has(/折扣|优惠|兄弟|姐妹|老师|师资|全职|资历|地址|位置|在哪|成绩|及格|通过率|假期|营|退费|退款|考试/);
  const ageOut = age < 7 || age > 17;
  const needs = unknownTopic || ageOut || !known;

  const category: Category = cats[0] ?? "其他";
  let draft = `${i.parent_name}您好，感谢您咨询 ${i.branch} 分店！关于您${age}岁的孩子：\n`;
  if (parts.length) draft += parts.map((p) => `• ${p}。`).join("\n");
  if (ageOut) draft += `\n• 我们目前招收 7 至 17 岁的学生，您孩子的年龄需要另行咨询。`;
  if (needs) {
    draft += `\n\n${MARKER} 您问题中的部分内容不在我们的常见问答范围内，${i.branch} 分店的工作人员将尽快联系您跟进。`;
  } else {
    draft += `\n\n如需预约免费试课或有其他问题，欢迎随时联系我们。`;
  }
  return sanitize({ category, needs_human: needs, ai_draft: draft }, i);
}

export async function triage(i: Input): Promise<{ result: TriageResult; engine: "gemini" | "fallback" }> {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (key) {
    try {
      return { result: await callGemini(i, key), engine: "gemini" };
    } catch (e) {
      console.error("Gemini failed, using fallback triage:", e);
    }
  }
  return { result: fallbackTriage(i), engine: "fallback" };
}
