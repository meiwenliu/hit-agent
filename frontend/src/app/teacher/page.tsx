"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { api, type AssignmentSummary, type Course, type QuestionRecord, type TeacherNotification } from "@/lib/api";

export default function TeacherDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [notifications, setNotifications] = useState<TeacherNotification[]>([]);
  const [questions, setQuestions] = useState<QuestionRecord[]>([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== "teacher")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "teacher") return;
    Promise.all([
      api.listCourses().catch(() => []),
      api.listTeacherAssignments().catch(() => []),
      api.listTeacherNotifications().catch(() => []),
      api.listTeacherQuestions().catch(() => []),
    ]).then(([courseList, assignmentList, notificationList, questionList]) => {
      setCourses(courseList.filter((item) => !item.owner_user_id || item.owner_user_id === user.id));
      setAssignments(assignmentList);
      setNotifications(notificationList);
      setQuestions(questionList);
    });
  }, [user]);

  const modules = useMemo(() => [
    { href: "/teacher/course", title: "智能课程设计助手", desc: "根据课程主题、授课对象和教学目标生成课程设计建议。" },
    { href: "/teacher/material-update", title: "PPT / 教案更新", desc: "上传旧讲义、旧 PPT 或教案，生成前沿内容更新建议。" },
    { href: "/teacher/ai-config", title: "课程专属 AI 助教配置", desc: "限定学生端 AI 助教知识边界、回答风格与答疑范围。" },
    { href: "/teacher/assignments", title: "作业任务管理", desc: "发布作业、查看接收确认、未提交名单和 AI 初步反馈。" },
    { href: "/teacher/questions", title: "学生提问反馈中心", desc: "接收学生提交给教师的问题，查看附件并进行回复。" },
    { href: "/teacher/feedback", title: "匿名问卷分析", desc: "查看参与率、评分分布和匿名文本建议。" },
  ], []);

  if (!user || user.role !== "teacher") {
    return <main className="section-card rounded-[28px] p-8 text-center text-slate-500">正在进入教师工作台...</main>;
  }

  return (
    <main className="space-y-5">
      <section className="glass-panel rounded-[32px] px-6 py-8 md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-sm font-semibold text-slate-500">教师工作台</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">以教师为核心的教学设计、实施、反馈与优化闭环</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">当前工作台仅展示教师职责相关功能。学生提问、作业完成、匿名问卷与课程资料更新都会在这里形成汇总，AI 只提供辅助建议，不替代教师的专业判断。</p>
          </div>
          <div className="rounded-[24px] bg-white/70 px-5 py-4 text-sm leading-7 text-slate-600">
            <p><span className="font-semibold text-slate-900">当前教师：</span>{user.display_name}</p>
            <p><span className="font-semibold text-slate-900">待处理提问：</span>{questions.filter((item) => item.teacher_reply_status === "pending").length}</p>
            <p><span className="font-semibold text-slate-900">已发布作业：</span>{assignments.length}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-4">
          <div className="section-card rounded-[28px] p-6"><p className="text-sm text-slate-500">我的课程</p><p className="mt-3 text-4xl font-black text-slate-900">{courses.length}</p></div>
          <div className="section-card rounded-[28px] p-6"><p className="text-sm text-slate-500">作业任务</p><p className="mt-3 text-4xl font-black text-slate-900">{assignments.length}</p></div>
          <div className="section-card rounded-[28px] p-6"><p className="text-sm text-slate-500">学生提问提醒</p><p className="mt-3 text-4xl font-black text-slate-900">{notifications.filter((item) => !item.is_read).length}</p></div>
          <div className="section-card rounded-[28px] p-6"><p className="text-sm text-slate-500">待教师回复问题</p><p className="mt-3 text-4xl font-black text-slate-900">{questions.filter((item) => item.teacher_reply_status === "pending").length}</p></div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {modules.map((module) => (
          <Link key={module.href} href={module.href} className="section-card rounded-[28px] p-6 transition hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(20,33,61,0.12)]">
            <h3 className="text-2xl font-bold text-slate-900">{module.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{module.desc}</p>
            <p className="mt-6 text-sm font-semibold text-[var(--accent)]">点击进入</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
