"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthModal } from "@/components/auth-modal";
import { useAuth } from "@/components/auth-provider";
import { applyAppearance, persistAppearance } from "@/lib/appearance";
import { api } from "@/lib/api";

const TEACHER_NAV = [
  { href: "/teacher", label: "教师工作台" },
  { href: "/teacher/course", label: "智能课程设计" },
  { href: "/teacher/ai-config", label: "AI 助教配置" },
  { href: "/teacher/assignments", label: "作业任务管理" },
  { href: "/teacher/questions", label: "学生提问反馈中心" },
  { href: "/teacher/material-update", label: "PPT / 教案更新" },
  { href: "/teacher/feedback", label: "匿名问卷分析" },
];

const STUDENT_NAV = [
  { href: "/student", label: "学生学习台" },
  { href: "/student/qa", label: "课程专属 AI 助教" },
  { href: "/student/questions", label: "学习问答记录" },
  { href: "/student/weakness", label: "薄弱点分析" },
  { href: "/student/assignments", label: "作业任务中心" },
  { href: "/student/feedback", label: "匿名课堂反馈" },
];

const THEME_PRESETS = [
  { mode: "day", accent: "blue", font: "default", skin: "clean", label: "白天蓝色" },
  { mode: "night", accent: "gray", font: "rounded", skin: "tech", label: "夜间科技" },
  { mode: "eye-care", accent: "green", font: "default", skin: "gentle", label: "护眼温和" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickSkinOpen, setQuickSkinOpen] = useState(false);
  const [teacherUnread, setTeacherUnread] = useState(0);

  const navItems = useMemo(() => {
    if (!user) return [];
    return user.role === "teacher" ? TEACHER_NAV : STUDENT_NAV;
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== "teacher") return;
    let alive = true;
    const loadNotifications = async () => {
      try {
        const items = await api.listTeacherNotifications();
        if (alive) setTeacherUnread(items.filter((item) => !item.is_read).length);
      } catch {
        if (alive) setTeacherUnread(0);
      }
    };
    void loadNotifications();
    return () => {
      alive = false;
    };
  }, [user, pathname]);

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    router.push("/");
  };

  const applyPreset = async (preset: { mode: string; accent: string; font: string; skin: string }) => {
    applyAppearance(preset);
    persistAppearance(preset);
    setQuickSkinOpen(false);
    if (isAuthenticated) {
      try {
        await api.updateMyAppearance(preset);
      } catch {
        // ignore persistence failures in quick switch mode
      }
    }
  };

  const unreadCount = user?.role === "teacher" ? teacherUnread : 0;

  return (
    <>
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-8 pt-5 md:px-6">
        <header className="glass-panel rounded-[28px] px-5 py-4 md:px-7">
          <div className="flex flex-wrap items-center gap-4">
            <Link href={isAuthenticated ? (user?.role === "teacher" ? "/teacher" : "/student") : "/"} className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">教师教学全流程智能伙伴</p>
              <h1 className="mt-1 truncate text-2xl font-black tracking-tight text-slate-900">面向前沿学科的智能教学平台</h1>
            </Link>

            {isAuthenticated && navItems.length > 0 ? (
              <nav className="hidden flex-wrap items-center gap-2 xl:flex">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "ui-pill-active" : "ui-pill"}`}>
                      {item.label}
                      {item.href === "/teacher/questions" && unreadCount > 0 ? `（${unreadCount}）` : ""}
                    </Link>
                  );
                })}
              </nav>
            ) : null}

            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => setQuickSkinOpen((prev) => !prev)} className="ui-pill rounded-full px-4 py-2 text-sm font-semibold">外观</button>
              {!loading && !isAuthenticated ? (
                <>
                  <button onClick={() => openAuth("login")} className="ui-pill rounded-full px-4 py-2 text-sm font-semibold">登录</button>
                  <button onClick={() => openAuth("register")} className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">注册</button>
                </>
              ) : null}
              {!loading && isAuthenticated && user ? (
                <div className="relative">
                  <button onClick={() => setMenuOpen((prev) => !prev)} className="ui-pill rounded-full px-4 py-2 text-sm font-semibold">
                    {user.display_name || user.account} · {user.role === "teacher" ? "教师" : "学生"}
                  </button>
                  {menuOpen ? (
                    <div className="absolute right-0 top-14 z-30 w-64 rounded-[24px] border border-slate-200 bg-white/95 p-3 shadow-[0_18px_40px_rgba(20,33,61,0.16)]">
                      <div className="rounded-[20px] bg-slate-50 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{user.display_name}</p>
                        <p className="mt-1 text-xs leading-6 text-slate-500">{user.role === "teacher" ? "教师身份已启用教学功能视图" : "学生身份已启用学习功能视图"}</p>
                      </div>
                      <div className="mt-3 space-y-2 text-sm">
                        <Link href="/profile" onClick={() => setMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-slate-700 transition hover:bg-slate-50">个人中心</Link>
                        <Link href="/settings" onClick={() => setMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-slate-700 transition hover:bg-slate-50">设置中心</Link>
                        <button onClick={handleLogout} className="block w-full rounded-2xl px-4 py-3 text-left text-rose-600 transition hover:bg-rose-50">退出登录</button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {isAuthenticated && navItems.length > 0 ? (
            <nav className="mt-4 flex flex-wrap gap-2 xl:hidden">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "ui-pill-active" : "ui-pill"}`}>
                    {item.label}
                    {item.href === "/teacher/questions" && unreadCount > 0 ? `（${unreadCount}）` : ""}
                  </Link>
                );
              })}
            </nav>
          ) : null}

          {quickSkinOpen ? (
            <div className="mt-4 rounded-[24px] border border-slate-200 bg-white/75 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">快速外观切换</p>
                  <p className="mt-1 text-xs leading-6 text-slate-500">设置入口统一收纳在右上角，不占首页主功能模块。登录后会自动同步到当前账号。</p>
                </div>
                <Link href="/settings" className="ui-pill rounded-full px-4 py-2 text-sm font-semibold">进入设置中心</Link>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {THEME_PRESETS.map((preset) => (
                  <button key={preset.label} onClick={() => void applyPreset(preset)} className="ui-pill rounded-full px-4 py-2 text-sm font-semibold">
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </header>

        <div className="flex-1 pt-5">{children}</div>
      </div>

      <AuthModal open={authOpen} initialMode={authMode} onClose={() => setAuthOpen(false)} />
    </>
  );
}
