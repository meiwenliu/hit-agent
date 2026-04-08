"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { RichAnswer } from "@/components/rich-answer";
import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import { api, type QuestionRecord, type TeacherNotification } from "@/lib/api";
import { pick } from "@/lib/i18n";

export default function TeacherQuestionsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState<TeacherNotification[]>([]);
  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [activeQuestionId, setActiveQuestionId] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [message, setMessage] = useState("");

  const reload = async () => {
    const [notificationList, questionList] = await Promise.all([
      api.listTeacherNotifications(),
      api.listTeacherQuestions({ status: "pending" }).catch(() => api.listTeacherQuestions()),
    ]);
    setNotifications(notificationList);
    setQuestions(questionList);
    if (!activeQuestionId && questionList[0]) setActiveQuestionId(questionList[0].id);
  };

  useEffect(() => {
    if (!loading && (!user || user.role !== "teacher")) router.push("/");
  }, [loading, router, user]);

  useEffect(() => {
    if (!user || user.role !== "teacher") return;
    let alive = true;
    const load = async () => {
      try {
        const [notificationList, questionList] = await Promise.all([
          api.listTeacherNotifications(),
          api.listTeacherQuestions({ status: "pending" }).catch(() => api.listTeacherQuestions()),
        ]);
        if (!alive) return;
        setNotifications(notificationList);
        setQuestions(questionList);
        if (!activeQuestionId && questionList[0]) setActiveQuestionId(questionList[0].id);
      } catch {
        if (!alive) return;
        setNotifications([]);
        setQuestions([]);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [activeQuestionId, user]);

  const activeQuestion = questions.find((item) => item.id === activeQuestionId) || questions[0];

  if (!user || user.role !== "teacher") {
    return <main className="section-card rounded-[28px] p-8 text-center text-slate-500">{pick(language, "正在加载学生提问反馈中心...", "Loading student question center...")}</main>;
  }

  return (
    <main className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr]">
      <section className="glass-panel rounded-[32px] px-5 py-6 md:px-6">
        <div className="border-b border-slate-200 pb-4">
          <p className="text-sm font-semibold text-slate-500">{pick(language, "学生提问反馈中心", "Student Question Center")}</p>
          <h2 className="mt-2 text-2xl font-black text-slate-900">{pick(language, "处理学生发给教师的问题与站内提醒", "Handle questions sent to teachers and in-platform alerts")}</h2>
        </div>

        <div className="mt-5 rounded-[24px] border border-slate-200 bg-white/75 p-4">
          <p className="text-sm font-semibold text-slate-900">{pick(language, "未读提醒", "Unread Alerts")}</p>
          <div className="mt-3 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-sm text-slate-500">{pick(language, "当前没有未读提醒。", "There are no unread alerts right now.")}</div>
            ) : notifications.map((item) => (
              <div key={item.id} className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-600">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">{item.created_at}</p>
                <p className="mt-2">{item.content}</p>
                {!item.is_read ? (
                  <button onClick={() => api.markTeacherNotificationRead(item.id).then(() => reload())} className="mt-3 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                    {pick(language, "标记已读", "Mark as Read")}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {questions.length === 0 ? (
            <div className="section-card rounded-[24px] p-6 text-center text-slate-500">{pick(language, "当前没有待处理问题。", "There are no pending questions right now.")}</div>
          ) : questions.map((item) => (
            <button key={item.id} onClick={() => { setActiveQuestionId(item.id); setReplyDraft(item.teacher_answer_content || ""); }} className={`w-full rounded-[24px] px-4 py-4 text-left transition ${activeQuestion?.id === item.id ? "ui-tab-active" : "ui-pill text-slate-700"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{item.question_text || pick(language, "附件提问", "Attachment-based question")}</p>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${activeQuestion?.id === item.id ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"}`}>{item.anonymous ? pick(language, "匿名学生", "Anonymous Student") : item.asker_display_name}</span>
              </div>
              <p className={`mt-2 text-xs ${activeQuestion?.id === item.id ? "text-slate-300" : "text-slate-500"}`}>
                {item.created_at} · {item.answer_target_type === "both" ? "AI + Teacher" : item.answer_target_type === "teacher" ? pick(language, "仅教师", "Teacher only") : pick(language, "仅 AI", "AI only")}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-[32px] px-5 py-6 md:px-6">
        {activeQuestion ? (
          <>
            <div className="border-b border-slate-200 pb-4">
              <p className="text-sm font-semibold text-slate-500">{pick(language, "问题详情", "Question Details")}</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">{activeQuestion.question_text || pick(language, "附件提问", "Attachment-based question")}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {pick(language, "所属学生：", "Student: ")}
                {activeQuestion.anonymous ? pick(language, "匿名学生", "Anonymous Student") : `${activeQuestion.asker_display_name}${activeQuestion.asker_class_name ? ` · ${activeQuestion.asker_class_name}` : ""}`}
                {pick(language, "。若学生选择“AI + 教师”，你可以在 AI 回答基础上补充、纠正或延伸说明。", ". If the student selected “AI + Teacher”, you can supplement, correct or extend the AI answer.")}
              </p>
            </div>

            {activeQuestion.attachment_items.length > 0 ? (
              <div className="mt-5 section-card rounded-[26px] p-5">
                <h3 className="text-lg font-bold text-slate-900">{pick(language, "学生上传附件", "Student Attachments")}</h3>
                <div className="mt-3 flex flex-wrap gap-3">
                  {activeQuestion.attachment_items.map((attachment) => (
                    <a key={attachment.id} href={`${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"}${attachment.download_url}`} target="_blank" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                      {attachment.file_name}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {activeQuestion.ai_answer_content ? (
              <div className="mt-5 rounded-[26px] bg-slate-900 px-5 py-5 text-sm leading-7 text-white">
                <p className="text-xs font-semibold text-slate-300">{pick(language, "AI 回答", "AI Answer")}</p>
                <RichAnswer content={activeQuestion.ai_answer_content} className="mt-2" />
              </div>
            ) : null}

            <div className="mt-5 section-card rounded-[26px] p-5">
              <h3 className="text-lg font-bold text-slate-900">{pick(language, "教师回复", "Teacher Reply")}</h3>
              <textarea value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} rows={6} placeholder={pick(language, "请输入教师回复内容，可用于纠正 AI 回答、补充课堂联系和延伸建议。", "Enter the teacher reply here. You can correct the AI answer, add course context or extend the explanation.")} className="mt-4 w-full rounded-[24px] border border-slate-300 bg-white px-4 py-4 text-sm leading-7 text-slate-900" />
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={async () => {
                    await api.replyTeacherQuestion(activeQuestion.id, { reply_content: replyDraft, status: "replied" });
                    setMessage(pick(language, "教师回复已提交，学生端会看到新的教师回答状态。", "Teacher reply submitted. Students will now see the updated teacher-response state."));
                    await reload();
                  }}
                  className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  {pick(language, "提交回复", "Submit Reply")}
                </button>
                <button
                  onClick={async () => {
                    await api.replyTeacherQuestion(activeQuestion.id, { reply_content: replyDraft || activeQuestion.teacher_answer_content || pick(language, "已处理并关闭。", "Processed and closed."), status: "closed" });
                    setMessage(pick(language, "该问题已关闭。", "This question has been closed."));
                    await reload();
                  }}
                  className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
                >
                  {pick(language, "关闭问题", "Close Question")}
                </button>
              </div>
              {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
            </div>
          </>
        ) : (
          <div className="section-card rounded-[28px] p-8 text-center text-slate-500">{pick(language, "请从左侧选择一个学生问题进行查看与回复。", "Choose a student question from the left to review and reply.")}</div>
        )}
      </section>
    </main>
  );
}
