"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { applyAppearance, persistAppearance } from "@/lib/appearance";

const modeOptions = [
  { value: "day", label: "白天模式", desc: "适合常规教学展示与日间办公" },
  { value: "night", label: "夜间模式", desc: "适合低光环境与晚间备课" },
  { value: "eye-care", label: "护眼模式", desc: "降低刺激感，适合长时间阅读" },
];

const accentOptions = [
  { value: "blue", label: "蓝色" },
  { value: "green", label: "绿色" },
  { value: "purple", label: "紫色" },
  { value: "orange", label: "橙色" },
  { value: "gray", label: "灰色" },
];

const fontOptions = [
  { value: "default", label: "雅黑标准" },
  { value: "rounded", label: "圆润风格" },
  { value: "serif", label: "宋体文档风" },
  { value: "mono", label: "等宽学习风" },
];

const skinOptions = [
  { value: "clean", label: "简洁风" },
  { value: "tech", label: "科技风" },
  { value: "gentle", label: "温和风" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [appearance, setAppearance] = useState({ mode: "day", accent: "blue", font: "default", skin: "clean" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    api.getMyAppearance()
      .then((result) => {
        const next = { mode: result.mode, accent: result.accent, font: result.font, skin: result.skin };
        setAppearance(next);
        applyAppearance(next);
        persistAppearance(next);
      })
      .catch(() => undefined);
  }, [user]);

  if (!user) {
    return <main className="section-card rounded-[28px] p-8 text-center text-slate-500">正在加载设置中心...</main>;
  }

  const updateAppearance = (key: "mode" | "accent" | "font" | "skin", value: string) => {
    const next = { ...appearance, [key]: value };
    setAppearance(next);
    applyAppearance(next);
    persistAppearance(next);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await api.updateMyAppearance(appearance);
      setMessage("外观设置已保存，下次登录会自动恢复当前选择。")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-5">
      <section className="glass-panel rounded-[32px] px-6 py-8 md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-sm font-semibold text-slate-500">设置中心</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">账号与外观设置</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">设置入口统一收纳在右上角。首页只保留教学核心模块，个人信息与外观偏好都在这里维护。不同账号之间的主题、字体和皮肤设置互不影响。</p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="section-card rounded-[28px] p-6">
            <h3 className="text-xl font-bold text-slate-900">外观设置</h3>

            <div className="mt-5 space-y-5">
              <div>
                <p className="text-sm font-semibold text-slate-700">主题模式</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {modeOptions.map((item) => (
                    <button key={item.value} onClick={() => updateAppearance("mode", item.value)} className={`rounded-[24px] border px-4 py-4 text-left transition ${appearance.mode === item.value ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-slate-300 bg-white"}`}>
                      <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                      <p className="mt-2 text-xs leading-6 text-slate-500">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700">主题主色</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {accentOptions.map((item) => (
                    <button key={item.value} onClick={() => updateAppearance("accent", item.value)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${appearance.accent === item.value ? "border-[var(--accent)] bg-[var(--accent-soft)] text-slate-900" : "border-slate-300 bg-white text-slate-700"}`}>{item.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700">字体方案</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {fontOptions.map((item) => (
                    <button key={item.value} onClick={() => updateAppearance("font", item.value)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${appearance.font === item.value ? "border-[var(--accent)] bg-[var(--accent-soft)] text-slate-900" : "border-slate-300 bg-white text-slate-700"}`}>{item.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700">皮肤风格</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {skinOptions.map((item) => (
                    <button key={item.value} onClick={() => updateAppearance("skin", item.value)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${appearance.skin === item.value ? "border-[var(--accent)] bg-[var(--accent-soft)] text-slate-900" : "border-slate-300 bg-white text-slate-700"}`}>{item.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="section-card rounded-[28px] p-6">
            <h3 className="text-xl font-bold text-slate-900">账号说明</h3>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
              <p>当前角色：{user.role === "teacher" ? "教师" : "学生"}</p>
              <p>当前账号：{user.account}</p>
              <p>当前显示名：{user.display_name}</p>
              <p>登录后系统会自动切换为对应角色视图。教师只看到教师功能，学生只看到学生功能。</p>
              <p>学生必须使用本人注册账号登录。匿名发言仅在提问展示层隐藏身份，不代表匿名登录。</p>
            </div>
          </section>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className={`text-sm ${message.includes("已保存") ? "text-emerald-700" : "text-slate-500"}`}>{message || "修改后建议点击保存，以便跨设备与下次登录自动恢复。"}</p>
          <button onClick={() => void handleSave()} disabled={saving} className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">{saving ? "保存中..." : "保存设置"}</button>
        </div>
      </section>
    </main>
  );
}
