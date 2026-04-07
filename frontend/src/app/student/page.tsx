"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { api, type AssignmentStudentView, type Course, type SurveyPendingItem } from "@/lib/api";

export default function StudentDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<AssignmentStudentView[]>([]);
  const [pendingSurveys, setPendingSurveys] = useState<SurveyPendingItem[]>([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== "student")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "student") return;
    Promise.all([
      api.listCourses().catch(() => []),
      api.listStudentAssignments().catch(() => []),
      api.listPendingSurveys().catch(() => []),
    ]).then(([courseList, assignmentList, surveyList]) => {
      setCourses(courseList);
      setAssignments(assignmentList);
      setPendingSurveys(surveyList);
    });
  }, [user]);

  const cards = useMemo(() => [
    { href: "/student/qa", title: "课程专属 AI 助教", desc: "支持 AI / 教师 / 双通道提问，多轮连续追问，图片和文档辅助提问。" },
    { href: "/student/questions", title: "学习问答记录", desc: "查看历史提问、AI 回答、教师补充回复和收藏内容。" },
    { href: "/student/weakness", title: "薄弱点分析", desc: "根据连续提问记录，生成温和的学习诊断和复习建议。" },
    { href: "/student/assignments", title: "作业任务中心", desc: "查看任务、确认收到、上传作业并查看 AI 初步反馈。" },
    { href: "/student/feedback", title: "匿名课堂反馈", desc: "课后自愿填写匿名问卷，可稍后忽略，不反复强制打扰。" },
  ], []);

  if (!user || user.role !== "student") {
    return <main className="section-card rounded-[28px] p-8 text-center text-slate-500">正在进入学生学习台...</main>;
  }

  return (
    <main className="space-y-5">
      <section className="glass-panel rounded-[32px] px-6 py-8 md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-sm font-semibold text-slate-500">学生学习台</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">围绕课程学习、作业提交与课后反馈的一站式入口</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">你当前使用本人账号登录。若不希望教师在问题展示中看到公开身份，可在提问时勾选匿名发言；匿名发言不会影响作业、记录和权限绑定。</p>
          </div>
          <div className="rounded-[24px] bg-white/70 px-5 py-4 text-sm leading-7 text-slate-600">
            <p><span className="font-semibold text-slate-900">当前用户：</span>{user.display_name}</p>
            <p><span className="font-semibold text-slate-900">待完成作业：</span>{assignments.filter((item) => !item.submission).length}</p>
            <p><span className="font-semibold text-slate-900">待填写反馈：</span>{pendingSurveys.length}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <div className="section-card rounded-[28px] p-6"><p className="text-sm text-slate-500">已开放课程</p><p className="mt-3 text-4xl font-black text-slate-900">{courses.length}</p></div>
          <div className="section-card rounded-[28px] p-6"><p className="text-sm text-slate-500">进行中作业</p><p className="mt-3 text-4xl font-black text-slate-900">{assignments.length}</p></div>
          <div className="section-card rounded-[28px] p-6"><p className="text-sm text-slate-500">匿名反馈提醒</p><p className="mt-3 text-4xl font-black text-slate-900">{pendingSurveys.length}</p></div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="section-card rounded-[28px] p-6 transition hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(20,33,61,0.12)]">
            <h3 className="text-2xl font-bold text-slate-900">{card.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{card.desc}</p>
            <p className="mt-6 text-sm font-semibold text-[var(--accent)]">点击进入</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
