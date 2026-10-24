export type Branch = "SS2" | "SS15";
export type Category = "收费" | "时间" | "课程" | "其他";
export type Status = "pending" | "approved";

export interface Inquiry {
  id: string;
  parent_name: string;
  phone: string;
  branch: Branch;
  child_age: number;
  question: string;
  category: Category;
  ai_draft: string;
  needs_human: boolean;
  status: Status;
  created_at: string;
  user_id?: string | null;
}

export interface TriageResult {
  category: Category;
  needs_human: boolean;
  ai_draft: string;
}

export const CATEGORIES: Category[] = ["收费", "时间", "课程", "其他"];
