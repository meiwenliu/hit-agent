const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";
const TOKEN_KEY = "hit-agent-token";

export { API_BASE, TOKEN_KEY };

function getToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_KEY) || "";
}

async function request<T>(path: string, options?: RequestInit, auth = true): Promise<T> {
  const headers = new Headers(options?.headers || {});
  if (!(options?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `接口请求失败：${res.status}`);
  }
  return res.json();
}

export interface AppearanceSetting {
  user_role: string;
  user_id: string;
  mode: string;
  accent: string;
  font: string;
  skin: string;
  updated_at: string;
}

export interface UserProfile {
  real_name: string;
  gender: string;
  college: string;
  major: string;
  grade: string;
  class_name: string;
  student_no: string;
  teacher_no: string;
  department: string;
  teaching_group: string;
  role_title: string;
  birth_date: string;
  email: string;
  phone: string;
  avatar_path: string;
  bio: string;
  research_direction: string;
  interests: string;
  common_courses: string[];
  linked_classes: string[];
  updated_at: string;
}

export interface CurrentUser {
  id: string;
  role: "teacher" | "student";
  account: string;
  display_name: string;
  status: string;
  created_at: string;
  profile: UserProfile;
}

export interface AuthLoginResponse {
  token: string;
  user: CurrentUser;
}

export interface Course {
  id: string;
  name: string;
  audience: string;
  student_level: string;
  chapter: string;
  objectives: string;
  duration_minutes: number;
  frontier_direction: string;
  owner_user_id: string;
  created_at: string;
}

export interface LessonPack {
  id: string;
  course_id: string;
  version: number;
  status: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface AgentConfig {
  course_id: string;
  scope_rules: string;
  answer_style: string;
  enable_homework_support: boolean;
  enable_material_qa: boolean;
  enable_frontier_extension: boolean;
  updated_at: string;
}

export interface ModelOption {
  key: string;
  label: string;
  provider: string;
  model_name: string;
  supports_vision: boolean;
  is_default: boolean;
  description: string;
  availability_note: string;
}

export interface UploadedAttachment {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  parse_status: string;
  parse_summary: string;
  created_at: string;
  download_url: string;
}

export interface QuestionRecord {
  id: string;
  session_id: string;
  course_id: string;
  lesson_pack_id: string;
  question_text: string;
  answer_target_type: "ai" | "teacher" | "both";
  selected_model: string;
  anonymous: boolean;
  status: string;
  teacher_reply_status: string;
  ai_answer_content: string;
  ai_answer_time: string;
  ai_answer_sources: string[];
  teacher_answer_content: string;
  teacher_answer_time: string;
  has_attachments: boolean;
  attachment_count: number;
  input_mode: string;
  collected: boolean;
  created_at: string;
  updated_at: string;
  attachment_items: UploadedAttachment[];
  asker_display_name: string;
  asker_class_name: string;
}

export interface ChatSessionSummary {
  id: string;
  course_id: string;
  lesson_pack_id: string;
  title: string;
  selected_model: string;
  created_at: string;
  updated_at: string;
}

export interface ChatSessionDetail extends ChatSessionSummary {
  questions: QuestionRecord[];
}

export interface WeaknessAnalysis {
  summary: string;
  weak_points: string[];
  suggestions: string[];
  updated_at: string;
}

export interface AssignmentSummary {
  id: string;
  teacher_id: string;
  course_id: string;
  title: string;
  description: string;
  target_class: string;
  deadline: string;
  attachment_requirements: string;
  submission_format: string;
  grading_notes: string;
  allow_resubmit: boolean;
  enable_ai_feedback: boolean;
  remind_days: number;
  status: string;
  created_at: string;
}

export interface AssignmentReceiptStatus {
  assignment_id: string;
  confirmed: boolean;
  confirmed_at: string;
}

export interface AssignmentSubmissionItem {
  file_name: string;
  file_type: string;
  file_size: number;
  download_url: string;
}

export interface AssignmentSubmissionSummary {
  id: string;
  assignment_id: string;
  student_id: string;
  status: string;
  submitted_at: string;
  resubmitted_count: number;
  files: AssignmentSubmissionItem[];
}

export interface AssignmentFeedbackSummary {
  summary: string;
  structure_feedback: string[];
  logic_feedback: string[];
  writing_feedback: string[];
  rubric_reference: string[];
  teacher_note: string;
  created_at: string;
}

export interface AssignmentStudentView {
  assignment: AssignmentSummary;
  receipt: AssignmentReceiptStatus;
  submission?: AssignmentSubmissionSummary | null;
  feedback?: AssignmentFeedbackSummary | null;
}

export interface AssignmentTeacherRosterItem {
  user_id: string;
  display_name: string;
  class_name: string;
  confirmed: boolean;
  confirmed_at: string;
  submitted: boolean;
  submitted_at: string;
}

export interface AssignmentTeacherDetail {
  assignment: AssignmentSummary;
  submitted_students: AssignmentTeacherRosterItem[];
  unsubmitted_students: AssignmentTeacherRosterItem[];
  confirmed_but_unsubmitted: AssignmentTeacherRosterItem[];
  unconfirmed_students: AssignmentTeacherRosterItem[];
}

export interface MaterialUpdateResult {
  id: string;
  title: string;
  summary: string;
  update_suggestions: string[];
  draft_pages: string[];
  image_suggestions: string[];
  selected_model: string;
  used_model_name: string;
  model_status: string;
  created_at: string;
}

export interface SurveyPendingItem {
  id: string;
  lesson_pack_id: string;
  course_id: string;
  title: string;
  questions: { id: string; type: string; title: string; options?: string[] }[];
  created_at: string;
}

export interface SurveyAnalytics {
  survey_instance_id: string;
  title: string;
  total_target_students: number;
  participation_count: number;
  participation_rate: number;
  rating_breakdown: Record<string, Record<string, number>>;
  choice_breakdown: Record<string, Record<string, number>>;
  text_feedback: string[];
}

export interface AnalyticsReport {
  lesson_pack_id: string;
  total_questions: number;
  anonymous_questions: number;
  identified_questions: number;
  high_freq_topics: string[];
  confused_concepts: string[];
  knowledge_gaps: string[];
  teaching_suggestions: string[];
  recent_questions: { created_at: string; question: string; in_scope: boolean; anonymous: boolean; student_display_name: string; student_grade: string; student_major: string }[];
}

export interface AssignmentReviewResponse {
  summary: string;
  structure_feedback: string[];
  logic_feedback: string[];
  writing_feedback: string[];
  rubric_reference: string[];
  teacher_note: string;
}

export interface TeacherNotification {
  id: string;
  message_type: string;
  related_question_id: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export const api = {
  register: (payload: { role: "teacher" | "student"; account: string; password: string; confirm_password: string; profile: Omit<UserProfile, "updated_at"> }) => request<AuthLoginResponse>("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }, false),
  login: (payload: { role: "teacher" | "student"; account: string; password: string }) => request<AuthLoginResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }, false),
  me: () => request<CurrentUser>("/api/auth/me"),
  logout: () => request<{ status: string }>("/api/auth/logout", { method: "POST" }),

  getProfile: () => request<UserProfile>("/api/profile/me"),
  updateProfile: (payload: Omit<UserProfile, "updated_at">) => request<UserProfile>("/api/profile/me", { method: "PUT", body: JSON.stringify(payload) }),

  getMyAppearance: () => request<AppearanceSetting>("/api/settings/me"),
  updateMyAppearance: (payload: { mode: string; accent: string; font: string; skin: string }) => request<AppearanceSetting>("/api/settings/me", { method: "PUT", body: JSON.stringify(payload) }),

  listCourses: () => request<Course[]>("/api/courses"),
  createCourse: (payload: Omit<Course, "id" | "owner_user_id" | "created_at">) => request<Course>("/api/courses", { method: "POST", body: JSON.stringify(payload) }),
  listLessonPacks: (courseId?: string) => request<LessonPack[]>(`/api/lesson-packs${courseId ? `?course_id=${courseId}` : ""}`),
  generateLessonPack: (courseId: string) => request<LessonPack>(`/api/lesson-packs/generate/${courseId}`, { method: "POST" }),
  getLessonPack: (id: string) => request<LessonPack>(`/api/lesson-packs/${id}`),
  publishLessonPack: (id: string) => request<LessonPack>(`/api/lesson-packs/${id}/publish`, { method: "POST" }),
  uploadMaterial: async (courseId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ id: number; filename: string; file_type: string; size: number; message: string }>(`/api/materials/upload/${courseId}`, { method: "POST", body: form });
  },
  listMaterials: (courseId: string) => request<{ id: number; filename: string; file_type: string; created_at: string }[]>(`/api/materials/${courseId}`),

  getAgentConfig: (courseId: string) => request<AgentConfig>(`/api/agent-config/${courseId}`),
  updateAgentConfig: (courseId: string, payload: Omit<AgentConfig, "course_id" | "updated_at">) => request<AgentConfig>(`/api/agent-config/${courseId}`, { method: "PUT", body: JSON.stringify({ ...payload, course_id: courseId }) }),

  listModels: () => request<ModelOption[]>("/api/qa/models"),
  uploadQuestionAttachments: async (files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    return request<UploadedAttachment[]>("/api/qa/attachments", { method: "POST", body: form });
  },
  createChatSession: (payload: { course_id: string; lesson_pack_id?: string; title?: string; selected_model?: string }) => request<ChatSessionSummary>("/api/qa/sessions", { method: "POST", body: JSON.stringify(payload) }),
  listChatSessions: (courseId?: string) => request<ChatSessionSummary[]>(`/api/qa/sessions${courseId ? `?course_id=${courseId}` : ""}`),
  getChatSession: (sessionId: string) => request<ChatSessionDetail>(`/api/qa/sessions/${sessionId}`),
  askQuestion: (payload: { session_id: string; course_id: string; lesson_pack_id?: string; question: string; answer_target_type: "ai" | "teacher" | "both"; anonymous: boolean; selected_model: string; attachment_ids: string[] }) => request<QuestionRecord>("/api/qa/ask", { method: "POST", body: JSON.stringify(payload) }),
  listQuestionHistory: (courseId?: string) => request<QuestionRecord[]>(`/api/qa/history${courseId ? `?course_id=${courseId}` : ""}`),
  toggleCollect: (questionId: string) => request<{ status: string; collected: boolean }>(`/api/qa/questions/${questionId}/collect`, { method: "POST" }),
  getWeaknessAnalysis: (courseId?: string) => request<WeaknessAnalysis>(`/api/qa/weakness-analysis${courseId ? `?course_id=${courseId}` : ""}`),
  listTeacherQuestions: (params?: { status?: string; course_id?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.course_id) q.set("course_id", params.course_id);
    return request<QuestionRecord[]>(`/api/qa/teacher/questions${q.toString() ? `?${q.toString()}` : ""}`);
  },
  replyTeacherQuestion: (questionId: string, payload: { reply_content: string; status?: string }) => request<QuestionRecord>(`/api/qa/teacher/questions/${questionId}/reply`, { method: "POST", body: JSON.stringify(payload) }),
  listTeacherNotifications: () => request<TeacherNotification[]>("/api/qa/teacher/notifications"),
  markTeacherNotificationRead: (id: string) => request<{ status: string }>(`/api/qa/teacher/notifications/${id}/read`, { method: "POST" }),

  createAssignment: (payload: { course_id: string; title: string; description: string; target_class: string; deadline: string; attachment_requirements: string; submission_format: string; grading_notes: string; allow_resubmit: boolean; enable_ai_feedback: boolean; remind_days: number }) => request<AssignmentSummary>("/api/assignments", { method: "POST", body: JSON.stringify(payload) }),
  listTeacherAssignments: () => request<AssignmentSummary[]>("/api/assignments/teacher"),
  listStudentAssignments: () => request<AssignmentStudentView[]>("/api/assignments/student"),
  confirmAssignment: (assignmentId: string) => request<AssignmentReceiptStatus>(`/api/assignments/${assignmentId}/confirm`, { method: "POST" }),
  submitAssignment: async (assignmentId: string, files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    return request<AssignmentSubmissionSummary>(`/api/assignments/${assignmentId}/submit`, { method: "POST", body: form });
  },
  getTeacherAssignmentDetail: (assignmentId: string) => request<AssignmentTeacherDetail>(`/api/assignments/teacher/${assignmentId}`),

  previewAssignmentReview: (payload: { course_id?: string; assignment_type: string; title: string; requirements?: string; submission_text: string }) => request<AssignmentReviewResponse>("/api/assignment-review/preview", { method: "POST", body: JSON.stringify(payload) }),

  previewMaterialUpdate: (payload: { course_id?: string; title?: string; instructions?: string; material_text?: string; selected_model?: string }) => request<MaterialUpdateResult>("/api/material-update/preview", { method: "POST", body: JSON.stringify(payload) }),
  uploadMaterialUpdate: async (payload: { course_id?: string; title?: string; instructions?: string; selected_model?: string; file: File }) => {
    const form = new FormData();
    if (payload.course_id) form.append("course_id", payload.course_id);
    if (payload.title) form.append("title", payload.title);
    if (payload.instructions) form.append("instructions", payload.instructions);
    if (payload.selected_model) form.append("selected_model", payload.selected_model);
    form.append("file", payload.file);
    return request<MaterialUpdateResult>("/api/material-update/upload", { method: "POST", body: form });
  },
  listMaterialUpdates: () => request<MaterialUpdateResult[]>("/api/material-update"),

  listPendingSurveys: () => request<SurveyPendingItem[]>("/api/feedback/pending"),
  listSurveyTemplates: () => request<{ id: string; name: string; description: string; questions: { id: string; type: string; title: string; options?: string[] }[]; created_at: string }[]>("/api/feedback/templates"),
  createSurveyInstance: (payload: { lesson_pack_id: string; course_id: string; template_id?: string; title?: string; trigger_mode?: string }) => request<{ id: string; lesson_pack_id: string; course_id: string; template_id: string; title: string; status: string; trigger_mode: string; created_at: string }>("/api/feedback/instances", { method: "POST", body: JSON.stringify(payload) }),
  submitSurvey: (surveyId: string, answers: Record<string, unknown>) => request<{ status: string }>(`/api/feedback/instances/${surveyId}/submit`, { method: "POST", body: JSON.stringify({ answers }) }),
  skipSurvey: (surveyId: string) => request<{ status: string }>(`/api/feedback/instances/${surveyId}/skip`, { method: "POST" }),
  getSurveyAnalytics: (surveyId: string) => request<SurveyAnalytics>(`/api/feedback/analytics/${surveyId}`),

  getAnalytics: (lpId: string) => request<AnalyticsReport>(`/api/analytics/${lpId}`),
};

