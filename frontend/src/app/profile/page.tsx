"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AvatarBadge } from "@/components/avatar-badge";
import { useAuth } from "@/components/auth-provider";
import { api, type UserProfile } from "@/lib/api";

const EMPTY_PROFILE: Omit<UserProfile, "updated_at"> = {
  real_name: "",
  gender: "",
  college: "",
  major: "",
  grade: "",
  class_name: "",
  student_no: "",
  teacher_no: "",
  department: "",
  teaching_group: "",
  role_title: "",
  birth_date: "",
  email: "",
  phone: "",
  avatar_path: "",
  bio: "",
  research_direction: "",
  interests: "",
  common_courses: [],
  linked_classes: [],
};

const PRESET_AVATARS = [
  { label: "默认蓝", value: "" },
  { label: "晨曦橙", value: "preset:sunrise" },
  { label: "森林绿", value: "preset:forest" },
  { label: "星云紫", value: "preset:nebula" },
];

function listToText(items: string[]) {
  return items.join("，");
}

function textToList(value: string) {
  return value.split(/[，,；;\n]/).map((item) => item.trim()).filter(Boolean);
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, updateUser } = useAuth();
  const [form, setForm] = useState<Omit<UserProfile, "updated_at">>(EMPTY_PROFILE);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    setForm({
      real_name: user.profile.real_name,
      gender: user.profile.gender,
      college: user.profile.college,
      major: user.profile.major,
      grade: user.profile.grade,
      class_name: user.profile.class_name,
      student_no: user.profile.student_no,
      teacher_no: user.profile.teacher_no,
      department: user.profile.department,
      teaching_group: user.profile.teaching_group,
      role_title: user.profile.role_title,
      birth_date: user.profile.birth_date,
      email: user.profile.email,
      phone: user.profile.phone,
      avatar_path: user.profile.avatar_path,
      bio: user.profile.bio,
      research_direction: user.profile.research_direction,
      interests: user.profile.interests,
      common_courses: user.profile.common_courses,
      linked_classes: user.profile.linked_classes,
    });
  }, [user]);

  const grouped = useMemo(() => {
    if (!user) return [];
    return user.role === "teacher"
      ? [
          { title: "基本信息", fields: ["real_name", "gender", "college", "major", "teacher_no", "role_title"] },
          { title: "教学信息", fields: ["department", "teaching_group", "common_courses", "linked_classes", "research_direction"] },
          { title: "联系信息", fields: ["birth_date", "email", "phone", "bio"] },
        ]
      : [
          { title: "基本信息", fields: ["real_name", "gender", "college", "major", "student_no"] },
          { title: "学籍信息", fields: ["grade", "class_name", "linked_classes", "research_direction", "interests"] },
          { title: "联系信息", fields: ["birth_date", "email", "phone", "bio"] },
        ];
  }, [user]);

  if (!user) {
    return <main className="section-card rounded-[28px] p-8 text-center text-slate-500">正在加载个人中心...</main>;
  }

  const setValue = (key: keyof typeof form, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const renderField = (field: string) => {
    const map: Record<string, { label: string; value: string; onChange: (value: string) => void; type?: string; multiline?: boolean; hidden?: boolean }> = {
      real_name: { label: "姓名", value: form.real_name, onChange: (value) => setValue("real_name", value) },
      gender: { label: "性别", value: form.gender, onChange: (value) => setValue("gender", value) },
      college: { label: "学院", value: form.college, onChange: (value) => setValue("college", value) },
      major: { label: user.role === "teacher" ? "专业方向" : "专业", value: form.major, onChange: (value) => setValue("major", value) },
      grade: { label: "年级", value: form.grade, onChange: (value) => setValue("grade", value), hidden: user.role !== "student" },
      class_name: { label: "班级", value: form.class_name, onChange: (value) => setValue("class_name", value), hidden: user.role !== "student" },
      student_no: { label: "学号", value: form.student_no, onChange: (value) => setValue("student_no", value), hidden: user.role !== "student" },
      teacher_no: { label: "工号", value: form.teacher_no, onChange: (value) => setValue("teacher_no", value), hidden: user.role !== "teacher" },
      department: { label: "所属教研室", value: form.department, onChange: (value) => setValue("department", value), hidden: user.role !== "teacher" },
      teaching_group: { label: "教学组", value: form.teaching_group, onChange: (value) => setValue("teaching_group", value), hidden: user.role !== "teacher" },
      role_title: { label: "岗位称谓", value: form.role_title, onChange: (value) => setValue("role_title", value), hidden: user.role !== "teacher" },
      birth_date: { label: "出生日期", value: form.birth_date, onChange: (value) => setValue("birth_date", value), type: "date" },
      email: { label: "邮箱", value: form.email, onChange: (value) => setValue("email", value) },
      phone: { label: "手机号", value: form.phone, onChange: (value) => setValue("phone", value) },
      bio: { label: "个人简介", value: form.bio, onChange: (value) => setValue("bio", value), multiline: true },
      research_direction: { label: user.role === "teacher" ? "研究方向" : "建议加强方向", value: form.research_direction, onChange: (value) => setValue("research_direction", value) },
      interests: { label: "兴趣方向", value: form.interests, onChange: (value) => setValue("interests", value), hidden: user.role !== "student" },
      common_courses: { label: "常用课程", value: listToText(form.common_courses), onChange: (value) => setValue("common_courses", textToList(value)), hidden: user.role !== "teacher" },
      linked_classes: { label: user.role === "teacher" ? "关联班级" : "所在班级关联信息", value: listToText(form.linked_classes), onChange: (value) => setValue("linked_classes", textToList(value)) },
    };
    const config = map[field];
    if (!config || config.hidden) return null;
    return (
      <label key={field} className={`space-y-2 text-sm text-slate-700 ${config.multiline ? "md:col-span-2" : ""}`}>
        <span className="font-semibold">{config.label}</span>
        {config.multiline ? (
          <textarea value={config.value} onChange={(e) => config.onChange(e.target.value)} rows={3} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3" />
        ) : (
          <input type={config.type || "text"} value={config.value} onChange={(e) => config.onChange(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3" />
        )}
      </label>
    );
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) return;
    setUploadingAvatar(true);
    setMessage("");
    try {
      const result = await api.uploadAvatar(file);
      const nextProfile = { ...form, avatar_path: result.avatar_path };
      setForm(nextProfile);
      updateUser({ ...user, profile: { ...user.profile, avatar_path: result.avatar_path }, display_name: nextProfile.real_name || user.account });
      setMessage("头像已更新。你也可以继续选择默认头像样式。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "头像上传失败");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const profile = await api.updateProfile(form);
      updateUser({ ...user, display_name: profile.real_name || user.account, profile });
      setMessage("个人资料已保存，头像、简介和角色信息都会同步到右上角菜单。");
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
            <p className="text-sm font-semibold text-slate-500">个人中心</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">{user.role === "teacher" ? "教师资料维护" : "学生资料维护"}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">当前身份为“{user.role === "teacher" ? "教师" : "学生"}”。平台中的问答记录、作业记录、反馈记录与账号绑定，匿名发言仅隐藏展示身份，不脱离账号体系。</p>
          </div>
          <div className="rounded-[24px] bg-white/75 px-5 py-4 text-sm leading-7 text-slate-600">
            <p><span className="font-semibold text-slate-900">账号：</span>{user.account}</p>
            <p><span className="font-semibold text-slate-900">当前显示名：</span>{user.display_name}</p>
            <p><span className="font-semibold text-slate-900">角色视图：</span>{user.role === "teacher" ? "教师教学视图" : "学生学习视图"}</p>
          </div>
        </div>

        <section className="mt-6 section-card rounded-[28px] p-6">
          <h3 className="text-xl font-bold text-slate-900">头像与公开展示</h3>
          <div className="mt-5 flex flex-wrap items-start gap-6">
            <AvatarBadge name={form.real_name || user.display_name || user.account} avatarPath={form.avatar_path} size="lg" />
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">选择默认头像风格</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {PRESET_AVATARS.map((item) => (
                    <button key={item.label} onClick={() => setValue("avatar_path", item.value)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${form.avatar_path === item.value ? "ui-pill-active" : "ui-pill"}`}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">上传自定义头像</p>
                <label className="mt-3 inline-flex cursor-pointer rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">
                  {uploadingAvatar ? "上传中..." : "上传图片"}
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => void handleAvatarUpload(e.target.files?.[0] || null)} />
                </label>
                <p className="mt-2 text-xs leading-6 text-slate-500">支持 jpg、png、webp。上传后右上角会立即显示新头像。</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 space-y-6">
          {grouped.map((group) => (
            <section key={group.title} className="section-card rounded-[28px] p-6">
              <h3 className="text-xl font-bold text-slate-900">{group.title}</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {group.fields.map(renderField)}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className={`text-sm ${message.includes("已") ? "text-emerald-700" : "text-slate-500"}`}>{message || "建议完善资料，便于教师进行班级管理与教学统计。"}</p>
          <button onClick={() => void handleSave()} disabled={saving} className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">{saving ? "保存中..." : "保存个人资料"}</button>
        </div>
      </section>
    </main>
  );
}
