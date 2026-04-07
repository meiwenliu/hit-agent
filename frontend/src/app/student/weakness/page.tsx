"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { api, type WeaknessAnalysis } from "@/lib/api";

export default function WeaknessPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [result, setResult] = useState<WeaknessAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "student")) router.push("/");
  }, [loading, user, router]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      setResult(await api.getWeaknessAnalysis());
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "student") return;
    void runAnalysis();
  }, [user]);

  if (!user || user.role !== "student") return <main className="section-card rounded-[28px] p-8 text-center text-slate-500">正在加载薄弱点分析...</main>;

  return (
    <main className="space-y-5">
      <section className="glass-panel rounded-[32px] px-6 py-8 md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-sm font-semibold text-slate-500">学习诊断</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">基于提问记录的薄弱点分析</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">系统会参考连续提问、重复提问和常见疑难点，给出温和的学习建议。这里的结论是复习参考，不代表对你能力的绝对判断。</p>
          </div>
          <button onClick={() => void runAnalysis()} disabled={analyzing} className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">{analyzing ? "分析中..." : "重新分析"}</button>
        </div>

        {result ? (
          <div className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <section className="section-card rounded-[28px] p-6">
              <h3 className="text-xl font-bold text-slate-900">诊断摘要</h3>
              <p className="mt-4 text-sm leading-8 text-slate-600">{result.summary}</p>
              <p className="mt-4 text-xs text-slate-500">更新时间：{result.updated_at}</p>
            </section>
            <section className="section-card rounded-[28px] p-6">
              <h3 className="text-xl font-bold text-slate-900">建议加强的知识点</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {result.weak_points.map((item) => <span key={item} className="rounded-full bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-slate-800">{item}</span>)}
              </div>
              <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
                {result.suggestions.map((item, index) => <p key={`${index}-${item}`}>{index + 1}. {item}</p>)}
              </div>
            </section>
          </div>
        ) : <div className="section-card mt-6 rounded-[28px] p-8 text-center text-slate-500">暂时还没有足够的提问记录，建议先进行几轮课程问答后再生成分析结果。</div>}
      </section>
    </main>
  );
}
