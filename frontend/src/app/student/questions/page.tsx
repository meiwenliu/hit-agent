"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { RichAnswer } from "@/components/rich-answer";
import { useAuth } from "@/components/auth-provider";
import { api, type QuestionRecord } from "@/lib/api";

export default function StudentQuestionHistoryPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [items, setItems] = useState<QuestionRecord[]>([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== "student")) router.push("/");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "student") return;
    api.listQuestionHistory().then(setItems).catch(() => setItems([]));
  }, [user]);

  if (!user || user.role !== "student") {
    return <main className="section-card rounded-[28px] p-8 text-center text-slate-500">正在加载学习问答记录...</main>;
  }

  return (
    <main className="glass-panel rounded-[32px] px-6 py-8 md:px-8">
      <div className="border-b border-slate-200 pb-6">
        <p className="text-sm font-semibold text-slate-500">学习问答记录</p>
        <h2 className="mt-2 text-3xl font-black text-slate-900">查看历史提问、附件与教师回复</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">这里汇总本人账号下的所有提问记录。若提问时选择了匿名发言，教师端只会看到“匿名学生”，但你仍可在这里查看完整历史。</p>
      </div>
      <div className="mt-6 space-y-4">
        {items.length === 0 ? (
          <div className="section-card rounded-[28px] p-8 text-center text-slate-500">还没有历史提问，先去课程专属 AI 助教页面开始一次问答吧。</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="section-card rounded-[28px] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">{item.created_at}</p>
                  <h3 className="mt-2 text-lg font-bold text-slate-900">{item.question_text || "附件提问"}</h3>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                  <span className="rounded-full bg-slate-100 px-3 py-1">{item.answer_target_type === "ai" ? "仅 AI" : item.answer_target_type === "teacher" ? "仅教师" : "AI + 教师"}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">{item.teacher_reply_status === "pending" ? "教师待回复" : item.teacher_reply_status === "replied" ? "教师已回复" : item.teacher_reply_status === "closed" ? "已关闭" : "未请求教师"}</span>
                  {item.has_attachments ? <span className="rounded-full bg-slate-100 px-3 py-1">附件 {item.attachment_count} 个</span> : null}
                </div>
              </div>
              {item.ai_answer_content ? (
                <div className="mt-4 rounded-[22px] bg-slate-900 px-5 py-4 text-sm leading-7 text-white">
                  <p className="text-xs font-semibold text-slate-300">AI 回答</p>
                  <RichAnswer content={item.ai_answer_content} className="mt-2" />
                </div>
              ) : null}
              <div className="mt-4 rounded-[22px] border border-slate-200 bg-white px-5 py-4 text-sm leading-7 text-slate-700">
                <p className="text-xs font-semibold text-slate-500">教师回答</p>
                <RichAnswer content={item.teacher_answer_content || "当前还没有教师补充回复。"} className="mt-2" />
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
