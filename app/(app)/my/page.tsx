import MyInquiries from "@/components/MyInquiries";
import { requireRole } from "@/lib/guard";

export default function MyPage() {
  requireRole("user");
  return <MyInquiries />;
}
