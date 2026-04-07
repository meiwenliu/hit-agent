"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RichAnswer } from "@/components/rich-answer";
import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import { API_BASE, api, type ChatSessionDetail, type ChatSessionSummary, type Course, type LessonPack, type ModelOption, type UploadedAttachment } from "@/lib/api";
import { pick } from "@/lib/i18n";

function getModelBadge(model: ModelOption, language: string) {
  if (model.supports_vision) return pick(language, "适合图文理解", "Good for vision tasks");
  if (model.provider === "openai") return model.key.includes("fast") ? pick(language, "适合快速问答", "Good for fast Q&A") : pick(language, "适合高质量生成", "Good for high-quality generation");
  if (model.provider === "qwen") return pick(language, "适合快速问答", "Good for fast Q&A");
  if (model.provider === "doubao") return pick(language, "适合高质量生成", "Good for high-quality generation");
  return pick(language, "适合综合解释", "Good for balanced explanation");
}

export default function StudentQAPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { language } = useLanguage();
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
  const [requestingMaterials, setRequestingMaterials] = useState(false);

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
  const answerModes = useMemo(() => [
    { value: "ai", label: pick(language, "由 AI 回答", "Answered by AI"), desc: pick(language, "系统优先结合课程资料和大模型即时回答。", "The system first uses course materials and the selected model for an immediate answer.") },
    { value: "teacher", label: pick(language, "由教师回答", "Answered by Teacher"), desc: pick(language, "问题进入教师待处理列表，教师看到后尽快回复。", "The question enters the teacher queue and will be answered as soon as possible.") },
    { value: "both", label: pick(language, "同时发送给 AI 和教师", "Send to AI and Teacher"), desc: pick(language, "AI 先给出即时回答，教师后续可补充说明。", "AI answers first, and the teacher can follow up later.") },
  ] as const, [language]);

  const ensureSession = async () => {
    if (activeSessionId) return activeSessionId;
    const selectedCourse = selectedCourseId || courses[0]?.id;
    if (!selectedCourse) throw new Error(pick(language, "当前没有可用课程，请先联系教师创建课程。", "No course is available yet. Please contact the teacher to create one first."));
    const created = await api.createChatSession({
      course_id: selectedCourse,
      lesson_pack_id: selectedPackId || undefined,
      title: question.trim() ? `${question.trim().slice(0, 16)}...` : pick(language, "新的学习问答", "New Learning Chat"),
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
      setMessage(pick(language, "附件上传完成。建议同时补充文字说明，便于系统更准确理解你的问题。", "Attachments uploaded. Adding a short text description will help the system understand your question better."));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : pick(language, "附件上传失败", "Attachment upload failed."));
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim() && attachments.length === 0) {
      setMessage(pick(language, "请至少输入问题文字或上传附件。", "Please enter a question or upload at least one attachment."));
      return;
    }
    if (!selectedModel && selectedMode !== "teacher") {
      setMessage(pick(language, "当前没有可用模型，请先在后端配置模型服务。", "No model is available right now. Please configure a model service in the backend first."));
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
      setMessage(
        selectedMode === "teacher"
          ? pick(language, "问题已发送给教师，教师端会收到提醒。", "Your question has been sent to the teacher and a notification has been created.")
          : selectedMode === "both"
            ? pick(language, "AI 已即时回答，同时教师端已收到补充回复提醒。", "AI has answered immediately, and the teacher has also been notified for follow-up.")
            : pick(language, "问题已提交，AI 已给出回答。", "Your question has been submitted and answered by AI."),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : pick(language, "提问失败，请稍后重试", "Question submission failed. Please try again later."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestMaterials = async () => {
    const courseId = selectedCourseId || courses[0]?.id || "";
    if (!courseId) {
      setMessage(pick(language, "当前没有可用课程，暂时无法向教师发起资料请求。", "No course is available, so a material request cannot be sent right now."));
      return;
    }
    setRequestingMaterials(true);
    try {
      await api.requestCourseMaterial({
        course_id: courseId,
        request_text: question.trim() || pick(language, "希望教师上传本节课相关的 PPT、讲义、图片或视频资料，方便课上课后学习。", "Please share PPTs, lecture notes, images or videos related to this class for both in-class and after-class learning."),
      });
      setMessage(pick(language, "资料请求已发送给教师，教师端会收到提醒。", "The material request has been sent to the teacher and a notification has been created."));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : pick(language, "资料请求发送失败", "Material request failed."));
    } finally {
      setRequestingMaterials(false);
    }
  };

  if (!user || user.role !== "student") {
    return <main className="section-card rounded-[28px] p-8 text-center text-slate-500">{pick(language, "正在加载课程问答...", "Loading course Q&A...")}</main>;
  }

  return (
    <main className="grid gap-5 xl:grid-cols-[0.9fr_1.6fr]">
      <section className="glass-panel rounded-[32px] px-5 py-6 md:px-6">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">{pick(language, "学习问答控制台", "Learning Q&A Console")}</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">{pick(language, "课程专属 AI 助教", "Course AI Assistant")}</h2>
          </div>
          <button onClick={() => { setActiveSessionId(""); setActiveSession(null); setQuestion(""); setAttachments([]); }} className="ui-pill rounded-full px-4 py-2 text-sm font-semibold">{pick(language, "新建会话", "New Chat")}</button>
        </div>

        <div className="mt-5 space-y-4 text-sm text-slate-700">
          <label className="space-y-2">
            <span className="font-semibold">{pick(language, "所属课程", "Course")}</span>
            <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3">
              {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
            </select>
          </label>

          <label className="space-y-2">
            <span className="font-semibold">{pick(language, "关联课程包", "Lesson Pack")}</span>
            <select value={selectedPackId} onChange={(e) => setSelectedPackId(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3">
              <option value="">{pick(language, "未指定课程包", "No lesson pack")}</option>
              {filteredPacks.map((pack) => <option key={pack.id} value={pack.id}>{pack.id} · {pick(language, `第 ${pack.version} 版`, `Version ${pack.version}`)}</option>)}
            </select>
          </label>

          <div>
            <p className="mb-2 font-semibold">{pick(language, "回答对象", "Answer Route")}</p>
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
            <span className="text-sm leading-7 text-slate-600">{pick(language, "匿名发言仅对教师和其他学生隐藏公开身份，平台内部仍保留与本人账号的关联关系，用于记录查询和权限控制。", "Anonymous posting only hides your public identity from teachers and other students. The platform still keeps your account binding for records, permissions and auditing.")}</span>
          </label>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">{pick(language, "历史会话", "Chat History")}</p>
              <span className="text-xs text-slate-500">{pick(language, "支持继续追问", "Supports follow-up questions")}</span>
            </div>
            <div className="space-y-2">
              {sessions.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-center text-slate-500">{pick(language, "还没有历史会话", "No chat history yet")}</div> : sessions.map((session) => (
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
              <p className="text-sm font-semibold text-slate-500">{pick(language, "当前模型", "Current Model")}</p>
              <div className="relative mt-2">
                <button onClick={() => setModelMenuOpen((prev) => !prev)} className="ui-pill flex w-full items-center justify-between rounded-[20px] px-4 py-3 text-left">
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{selectedModelInfo?.label || (selectedMode === "teacher" ? pick(language, "当前仅走教师回复", "Teacher-only mode") : pick(language, "暂无可用模型", "No available model"))}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{selectedModelInfo?.description || (selectedMode === "teacher" ? pick(language, "此模式下不要求即时 AI 推理。", "This mode does not require immediate AI inference.") : pick(language, "请先在后端配置可用模型。", "Please configure an available model in the backend first."))}</span>
                  </span>
                  <span className="text-xs text-slate-500">{pick(language, "切换", "Switch")}</span>
                </button>
                {modelMenuOpen ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-40 max-h-80 overflow-y-auto rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_20px_45px_rgba(20,33,61,0.16)]">
                    {models.length === 0 ? <div className="rounded-[18px] border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">{pick(language, "当前没有已接入模型。请在后端配置 API Key、Base URL 和模型名称。", "No model is connected yet. Please configure the API key, base URL and model name in the backend.")}</div> : models.map((model) => (
                      <button key={model.key} onClick={() => { setSelectedModel(model.key); setModelMenuOpen(false); }} className={`mb-2 w-full rounded-[20px] px-4 py-4 text-left transition last:mb-0 ${selectedModel === model.key ? "ui-card-active" : "ui-pill"}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900">{model.label}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {model.is_default ? <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 font-semibold text-[var(--accent-contrast)]">{pick(language, "默认", "Default")}</span> : null}
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">{getModelBadge(model, language)}</span>
                          </div>
                        </div>
                        <p className="mt-2 text-xs leading-6 text-slate-500">{model.description}</p>
                        <p className="mt-1 text-xs text-slate-400">{pick(language, "实际模型：", "Actual model: ")}{model.model_name} · {model.availability_note || pick(language, "已接入", "Connected")}</p>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="min-w-[220px] flex-1 rounded-[20px] border border-slate-200 bg-white/70 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">{pick(language, "当前问答策略", "Current Q&A Strategy")}</p>
              <p className="mt-2 text-xs leading-6 text-slate-500">{pick(language, "系统会先做课程资料检索，再把课程上下文、历史会话和附件内容一起组织为 Prompt，最后调用你当前选择的大模型。", "The system first retrieves course materials, then combines course context, conversation history and attachments into a prompt before calling your selected model.")}</p>
              {selectedMode !== "teacher" && selectedModelInfo ? <p className="mt-2 text-xs font-semibold text-[var(--accent-contrast)]">{pick(language, "当前可见使用模型：", "Visible model in use: ")}{selectedModelInfo.label}</p> : null}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[28px] border border-slate-200 bg-white/70 p-4">
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-500">{pick(language, "多模态提问", "Multimodal Questioning")}</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">{pick(language, "支持文本、图片、文档与压缩包附件", "Supports text, images, documents and archive attachments")}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{pick(language, "系统会结合问题文字、可解析附件、课程资料和会话上下文组织真实模型调用。若选择教师回答或双通道回答，教师端会同时看到附件。", "The system combines your text question, parsed attachments, course materials and session context into a real model call. If you choose teacher or dual-channel answering, the teacher will also see the attachments.")}</p>
          </div>

          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={5} placeholder={pick(language, "例如：QUIC 协议是什么？请结合我上传的 PPT 截图和课程资料，解释它与传统 TCP 的差异。", "Example: What is QUIC? Please explain its difference from traditional TCP based on my uploaded PPT screenshot and the course materials.")} className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-4 text-sm leading-7 text-slate-900" />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="ui-pill rounded-full px-4 py-2 text-sm font-semibold">
              {pick(language, "上传图片 / 文档 / 压缩包", "Upload Images / Docs / Archives")}
              <input type="file" multiple accept=".jpg,.jpeg,.png,.webp,.txt,.md,.pdf,.doc,.docx,.ppt,.pptx,.zip,.rar" className="hidden" onChange={(e) => void handleUpload(e.target.files)} />
            </label>
            <span className="text-xs text-slate-500">{pick(language, "优先解析 txt、md、docx、pptx、zip 文件索引；pdf、doc、ppt、rar 可能仅保存供教师查看。", "The system prioritizes txt, md, docx, pptx and zip indexing. PDF, doc, ppt and rar files may only be stored for teacher review.")}</span>
          </div>

          <div className="mt-4 space-y-2">
            {attachments.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500">{pick(language, "当前还没有附件。可以上传题目截图、PPT 截图、作业文档或资料压缩包辅助提问。", "No attachments yet. You can upload question screenshots, PPT screenshots, assignment documents or compressed material packages to support your question.")}</div> : attachments.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <div>
                  <p className="font-semibold text-slate-900">{item.file_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.file_type || pick(language, "未知类型", "Unknown type")} · {(item.file_size / 1024).toFixed(1)} KB · {item.parse_status}</p>
                </div>
                <button onClick={() => setAttachments((prev) => prev.filter((attachment) => attachment.id !== item.id))} className="ui-pill rounded-full px-3 py-1.5 text-xs font-semibold">{pick(language, "删除", "Remove")}</button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className={`text-sm ${message.includes("失败") || message.includes("不可用") || message.toLowerCase().includes("failed") ? "text-rose-700" : "text-slate-500"}`}>{message || (selectedMode === "teacher" ? pick(language, "教师会在看到问题后尽快回复。", "The teacher will reply after seeing the question.") : selectedMode === "both" ? pick(language, "AI 会先即时回答，教师可后续补充说明。", "AI will answer first, and the teacher may follow up later.") : pick(language, "系统会优先检索课程资料，不足时自动调用当前所选模型补充解释。", "The system first retrieves course materials and then uses your selected model to fill any gaps."))}</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => void handleRequestMaterials()} disabled={requestingMaterials} className="ui-pill rounded-full px-5 py-3 text-sm font-semibold">
                {requestingMaterials ? pick(language, "发送中...", "Sending...") : pick(language, "请求教师共享讲义资料", "Request Teacher Materials")}
              </button>
              <button onClick={() => void handleAsk()} disabled={uploading || submitting} className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">{uploading ? pick(language, "附件上传中...", "Uploading...") : submitting ? pick(language, "发送中...", "Submitting...") : pick(language, "提交问题", "Submit Question")}</button>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {activeSession?.questions.length ? activeSession.questions.map((item) => (
            <div key={item.id} className="section-card rounded-[26px] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">{pick(language, "提问时间：", "Asked at: ")}{item.created_at}</p>
                  <h3 className="mt-2 text-lg font-bold text-slate-900">{item.question_text || pick(language, "附件提问", "Attachment-based question")}</h3>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{item.answer_target_type === "ai" ? pick(language, "仅 AI", "AI only") : item.answer_target_type === "teacher" ? pick(language, "仅教师", "Teacher only") : "AI + Teacher"}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{item.anonymous ? pick(language, "匿名发言", "Anonymous") : pick(language, "实名发言", "Identified")}</span>
                  {item.has_attachments ? <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{pick(language, `附件 ${item.attachment_count} 个`, `${item.attachment_count} attachments`)}</span> : null}
                </div>
              </div>

              {item.attachment_items.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.attachment_items.map((attachment) => (
                    <a key={attachment.id} href={`${API_BASE}${attachment.download_url}`} target="_blank" className="ui-pill rounded-full px-4 py-2 text-xs font-semibold">
                      {pick(language, "附件：", "Attachment: ")}{attachment.file_name}
                    </a>
                  ))}
                </div>
              ) : null}

              {item.ai_answer_content ? (
                <div className="mt-4 rounded-[22px] border border-[var(--active-border)] bg-[var(--active-surface)] px-5 py-4 text-sm leading-7 text-slate-800">
                  <p className="text-xs font-semibold text-[var(--accent-contrast)]">{pick(language, "AI 回答 · ", "AI Answer · ")}{item.ai_answer_time}</p>
                  <RichAnswer content={item.ai_answer_content} className="mt-2" />
                </div>
              ) : null}

              <div className="mt-4 rounded-[22px] border border-slate-200 bg-white px-5 py-4 text-sm leading-7 text-slate-700">
                <p className="text-xs font-semibold text-slate-500">{pick(language, "教师回复状态：", "Teacher status: ")}{item.teacher_reply_status === "pending" ? pick(language, "待回复", "Pending") : item.teacher_reply_status === "replied" ? pick(language, "已回复", "Replied") : item.teacher_reply_status === "closed" ? pick(language, "已关闭", "Closed") : pick(language, "未请求", "Not requested")}</p>
                <RichAnswer content={item.teacher_answer_content || (item.answer_target_type === "teacher" || item.answer_target_type === "both" ? pick(language, "教师回复尚未到达，请稍后查看。", "Teacher reply has not arrived yet. Please check back later.") : pick(language, "当前问题未请求教师回复。", "Teacher follow-up was not requested for this question."))} className="mt-2" />
                {item.teacher_answer_time ? <p className="mt-2 text-xs text-slate-500">{pick(language, "教师回复时间：", "Teacher replied at: ")}{item.teacher_answer_time}</p> : null}
              </div>
            </div>
          )) : <div className="section-card rounded-[26px] p-8 text-center text-slate-500">{pick(language, "当前还没有问答记录。可以从课程重点、概念理解、作业疑难点或上传资料开始提问。", "No Q&A records yet. Start by asking about key concepts, difficult assignments or uploaded materials.")}</div>}
        </div>
      </section>
    </main>
  );
}

