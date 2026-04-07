"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { API_BASE, api, type ChatSessionDetail, type ChatSessionSummary, type Course, type LessonPack, type ModelOption, type UploadedAttachment } from "@/lib/api";

const answerModes = [
  { value: "ai", label: "由 AI 回答", desc: "系统优先结合课程资料和大模型即时回答。" },
  { value: "teacher", label: "由教师回答", desc: "问题进入教师待处理列表，教师看到后尽快回复。" },
  { value: "both", label: "同时发送给 AI 和教师", desc: "AI 先给出即时回答，教师后续可补充说明。" },
] as const;

function getModelBadge(model: ModelOption) {
  if (model.supports_vision) return "适合图文理解";
  if (model.provider === "openai") return model.key.includes("fast") ? "适合快速问答" : "适合高质量生成";
  if (model.provider === "qwen") return "适合快速问答";
  if (model.provider === "doubao") return "适合高质量生成";
  return "适合综合解释";
}

export default function StudentQAPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [packs, setPacks] = useState<LessonPack[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedPackId, setSelectedPackId] = useState("");
  const [selectedModel, setSelectedModel] = useState("default");
  const [selectedMode, setSelectedMode] = useState<"ai" | "teacher" | "both">("both");
  const [anonymous, setAnonymous] = useState(false);
  const [question, setQuestion] = useState("");
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [activeSession, setActiveSession] = useState<ChatSessionDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [modelMenuOpen, setModelMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "student")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "student") return;
    Promise.all([
      api.listCourses().catch(() => []),
      api.listLessonPacks().catch(() => []),
      api.listModels().catch(() => []),
      api.listChatSessions().catch(() => []),
    ]).then(([courseList, packList, modelList, sessionList]) => {
      setCourses(courseList);
      setPacks(packList.filter((item) => item.status === "published"));
      setModels(modelList);
      setSessions(sessionList);
      const firstCourse = courseList[0]?.id || "";
      const firstPack = packList.find((item) => item.status === "published" && (!firstCourse || item.course_id === firstCourse))?.id || packList.find((item) => item.status === "published")?.id || "";
      setSelectedCourseId((prev) => prev || firstCourse);
      setSelectedPackId((prev) => prev || firstPack);
      const defaultModel = modelList.find((item) => item.is_default)?.key || modelList[0]?.key || "";
      setSelectedModel(defaultModel);
      if (sessionList[0]) setActiveSessionId(sessionList[0].id);
    });
  }, [user]);

  useEffect(() => {
    if (!activeSessionId) {
      setActiveSession(null);
      return;
    }
    api.getChatSession(activeSessionId).then(setActiveSession).catch(() => setActiveSession(null));
  }, [activeSessionId]);

  const filteredPacks = useMemo(() => packs.filter((item) => !selectedCourseId || item.course_id === selectedCourseId), [packs, selectedCourseId]);
  const selectedModelInfo = useMemo(() => models.find((item) => item.key === selectedModel) || null, [models, selectedModel]);

  const ensureSession = async () => {
    if (activeSessionId) return activeSessionId;
    const selectedCourse = selectedCourseId || courses[0]?.id;
    if (!selectedCourse) throw new Error("当前没有可用课程，请先联系教师创建课程。");
    const created = await api.createChatSession({
      course_id: selectedCourse,
      lesson_pack_id: selectedPackId || undefined,
      title: question.trim() ? `${question.trim().slice(0, 16)}...` : "新的学习问答",
      selected_model: selectedModel,
    });
    setSessions((prev) => [created, ...prev]);
    setActiveSessionId(created.id);
    return created.id;
  };

  const refreshSessions = async (targetSessionId?: string) => {
    const [sessionList, detail] = await Promise.all([
      api.listChatSessions(selectedCourseId || undefined),
      targetSessionId ? api.getChatSession(targetSessionId) : Promise.resolve(null),
    ]);
    setSessions(sessionList);
    if (detail) setActiveSession(detail);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setMessage("");
    try {
      const result = await api.uploadQuestionAttachments(Array.from(files));
      setAttachments((prev) => [...prev, ...result]);
      setMessage("附件上传完成。建议同时补充文字说明，便于系统更准确理解你的问题。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "附件上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim() && attachments.length === 0) {
      setMessage("请至少输入问题文字或上传附件。");
      return;
    }
    if (!selectedModel && selectedMode !== "teacher") {
      setMessage("当前没有可用模型，请先在后端配置模型服务。");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      const sessionId = await ensureSession();
      const result = await api.askQuestion({
        session_id: sessionId,
        course_id: selectedCourseId || courses[0]?.id || "",
        lesson_pack_id: selectedPackId || undefined,
        question: question.trim(),
        answer_target_type: selectedMode,
        anonymous,
        selected_model: selectedModel,
        attachment_ids: attachments.map((item) => item.id),
      });
      setQuestion("");
      setAttachments([]);
      setActiveSession((prev) => prev ? { ...prev, questions: [...prev.questions, result], updated_at: result.updated_at } : null);
      await refreshSessions(sessionId);
      setMessage(selectedMode === "teacher" ? "问题已发送给教师，教师端会收到提醒。" : selectedMode === "both" ? "AI 已即时回答，同时教师端已收到补充回复提醒。" : "问题已提交，AI 已给出回答。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提问失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== "student") {
    return <main className="section-card rounded-[28px] p-8 text-center text-slate-500">正在加载课程问答...</main>;
  }

  return (
    <main className="grid gap-5 xl:grid-cols-[0.9fr_1.6fr]">
      <section className="glass-panel rounded-[32px] px-5 py-6 md:px-6">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">学习问答控制台</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">课程专属 AI 助教</h2>
          </div>
          <button onClick={() => { setActiveSessionId(""); setActiveSession(null); setQuestion(""); setAttachments([]); }} className="ui-pill rounded-full px-4 py-2 text-sm font-semibold">新建会话</button>
        </div>

        <div className="mt-5 space-y-4 text-sm text-slate-700">
          <label className="space-y-2">
            <span className="font-semibold">所属课程</span>
            <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3">
              {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
            </select>
          </label>

          <label className="space-y-2">
            <span className="font-semibold">关联课程包</span>
            <select value={selectedPackId} onChange={(e) => setSelectedPackId(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3">
              <option value="">未指定课程包</option>
              {filteredPacks.map((pack) => <option key={pack.id} value={pack.id}>{pack.id} · 第 {pack.version} 版</option>)}
            </select>
          </label>

          <div>
            <p className="mb-2 font-semibold">回答对象</p>
            <div className="space-y-3">
              {answerModes.map((item) => (
                <button key={item.value} onClick={() => setSelectedMode(item.value)} className={`w-full rounded-[22px] px-4 py-4 text-left transition ${selectedMode === item.value ? "ui-card-active" : "section-card"}`}>
                  <p className="font-semibold text-slate-900">{item.label}</p>
                  <p className="mt-1 text-xs leading-6 text-slate-500">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-[22px] border border-slate-200 bg-white/70 px-4 py-4">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="mt-1" />
            <span className="text-sm leading-7 text-slate-600">匿名发言仅对教师和其他学生隐藏公开身份，平台内部仍保留与本人账号的关联关系，用于记录查询和权限控制。</span>
          </label>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">历史会话</p>
              <span className="text-xs text-slate-500">支持继续追问</span>
            </div>
            <div className="space-y-2">
              {sessions.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-center text-slate-500">还没有历史会话</div> : sessions.map((session) => (
                <button key={session.id} onClick={() => setActiveSessionId(session.id)} className={`w-full rounded-2xl px-4 py-3 text-left transition ${activeSessionId === session.id ? "ui-tab-active" : "ui-pill"}`}>
                  <p className="font-semibold">{session.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{session.updated_at}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-[32px] px-5 py-6 md:px-6">
        <div className="sticky-toolbar rounded-[24px] border border-slate-200 px-4 py-4">
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-[220px] flex-1">
              <p className="text-sm font-semibold text-slate-500">当前模型</p>
              <div className="relative mt-2">
                <button onClick={() => setModelMenuOpen((prev) => !prev)} className="ui-pill flex w-full items-center justify-between rounded-[20px] px-4 py-3 text-left">
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{selectedModelInfo?.label || (selectedMode === "teacher" ? "当前仅走教师回复" : "暂无可用模型")}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{selectedModelInfo?.description || (selectedMode === "teacher" ? "此模式下不要求即时 AI 推理。" : "请先在后端配置可用模型。")}</span>
                  </span>
                  <span className="text-xs text-slate-500">切换</span>
                </button>
                {modelMenuOpen ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-40 max-h-80 overflow-y-auto rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_20px_45px_rgba(20,33,61,0.16)]">
                    {models.length === 0 ? <div className="rounded-[18px] border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">当前没有已接入模型。请在后端配置 API Key、Base URL 和模型名称。</div> : models.map((model) => (
                      <button key={model.key} onClick={() => { setSelectedModel(model.key); setModelMenuOpen(false); }} className={`mb-2 w-full rounded-[20px] px-4 py-4 text-left transition last:mb-0 ${selectedModel === model.key ? "ui-card-active" : "ui-pill"}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900">{model.label}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {model.is_default ? <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 font-semibold text-[var(--accent-contrast)]">默认</span> : null}
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">{getModelBadge(model)}</span>
                          </div>
                        </div>
                        <p className="mt-2 text-xs leading-6 text-slate-500">{model.description}</p>
                        <p className="mt-1 text-xs text-slate-400">实际模型：{model.model_name} · {model.availability_note || "已接入"}</p>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="min-w-[220px] flex-1 rounded-[20px] border border-slate-200 bg-white/70 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">当前问答策略</p>
              <p className="mt-2 text-xs leading-6 text-slate-500">系统会先做课程资料检索，再把课程上下文、历史会话和附件内容一起组织为 Prompt，最后调用你当前选择的大模型。</p>
              {selectedMode !== "teacher" && selectedModelInfo ? <p className="mt-2 text-xs font-semibold text-[var(--accent-contrast)]">当前可见使用模型：{selectedModelInfo.label}</p> : null}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[28px] border border-slate-200 bg-white/70 p-4">
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-500">多模态提问</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">支持文本、图片、文档与压缩包附件</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">系统会结合问题文字、可解析附件、课程资料和会话上下文组织真实模型调用。若选择教师回答或双通道回答，教师端会同时看到附件。</p>
          </div>

          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={5} placeholder="例如：QUIC 协议是什么？请结合我上传的 PPT 截图和课程资料，解释它与传统 TCP 的差异。" className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-4 text-sm leading-7 text-slate-900" />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="ui-pill rounded-full px-4 py-2 text-sm font-semibold">
              上传图片 / 文档 / 压缩包
              <input type="file" multiple accept=".jpg,.jpeg,.png,.webp,.txt,.md,.pdf,.doc,.docx,.ppt,.pptx,.zip,.rar" className="hidden" onChange={(e) => void handleUpload(e.target.files)} />
            </label>
            <span className="text-xs text-slate-500">优先解析 txt、md、docx、pptx、zip 文件索引；pdf、doc、ppt、rar 可能仅保存供教师查看。</span>
          </div>

          <div className="mt-4 space-y-2">
            {attachments.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500">当前还没有附件。可以上传题目截图、PPT 截图、作业文档或资料压缩包辅助提问。</div> : attachments.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <div>
                  <p className="font-semibold text-slate-900">{item.file_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.file_type || "未知类型"} · {(item.file_size / 1024).toFixed(1)} KB · {item.parse_status}</p>
                </div>
                <button onClick={() => setAttachments((prev) => prev.filter((attachment) => attachment.id !== item.id))} className="ui-pill rounded-full px-3 py-1.5 text-xs font-semibold">删除</button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className={`text-sm ${message.includes("失败") || message.includes("不可用") ? "text-rose-700" : "text-slate-500"}`}>{message || (selectedMode === "teacher" ? "教师会在看到问题后尽快回复。" : selectedMode === "both" ? "AI 会先即时回答，教师可后续补充说明。" : "系统会优先检索课程资料，不足时自动调用当前所选模型补充解释。")}</p>
            <button onClick={() => void handleAsk()} disabled={uploading || submitting} className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">{uploading ? "附件上传中..." : submitting ? "发送中..." : "提交问题"}</button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {activeSession?.questions.length ? activeSession.questions.map((item) => (
            <div key={item.id} className="section-card rounded-[26px] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">提问时间：{item.created_at}</p>
                  <h3 className="mt-2 text-lg font-bold text-slate-900">{item.question_text || "附件提问"}</h3>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{item.answer_target_type === "ai" ? "仅 AI" : item.answer_target_type === "teacher" ? "仅教师" : "AI + 教师"}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{item.anonymous ? "匿名发言" : "实名发言"}</span>
                  {item.has_attachments ? <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">附件 {item.attachment_count} 个</span> : null}
                </div>
              </div>

              {item.attachment_items.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.attachment_items.map((attachment) => (
                    <a key={attachment.id} href={`${API_BASE}${attachment.download_url}`} target="_blank" className="ui-pill rounded-full px-4 py-2 text-xs font-semibold">
                      附件：{attachment.file_name}
                    </a>
                  ))}
                </div>
              ) : null}

              {item.ai_answer_content ? (
                <div className="mt-4 rounded-[22px] border border-[var(--active-border)] bg-[var(--active-surface)] px-5 py-4 text-sm leading-7 text-slate-800">
                  <p className="text-xs font-semibold text-[var(--accent-contrast)]">AI 回答 · {item.ai_answer_time}</p>
                  <p className="mt-2 whitespace-pre-wrap">{item.ai_answer_content}</p>
                  {item.ai_answer_sources.length > 0 ? <p className="mt-3 text-xs text-slate-600">依据来源：{item.ai_answer_sources.join("；")}</p> : null}
                </div>
              ) : null}

              <div className="mt-4 rounded-[22px] border border-slate-200 bg-white px-5 py-4 text-sm leading-7 text-slate-700">
                <p className="text-xs font-semibold text-slate-500">教师回复状态：{item.teacher_reply_status === "pending" ? "待回复" : item.teacher_reply_status === "replied" ? "已回复" : item.teacher_reply_status === "closed" ? "已关闭" : "未请求"}</p>
                <p className="mt-2 whitespace-pre-wrap">{item.teacher_answer_content || (item.answer_target_type === "teacher" || item.answer_target_type === "both" ? "教师回复尚未到达，请稍后查看。" : "当前问题未请求教师回复。")}</p>
                {item.teacher_answer_time ? <p className="mt-2 text-xs text-slate-500">教师回复时间：{item.teacher_answer_time}</p> : null}
              </div>
            </div>
          )) : <div className="section-card rounded-[26px] p-8 text-center text-slate-500">当前还没有问答记录。可以从课程重点、概念理解、作业疑难点或上传资料开始提问。</div>}
        </div>
      </section>
    </main>
  );
}

