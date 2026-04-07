# 数据结构总览

## 统一账号相关
### `users`
- `id`
- `role`
- `account`
- `password_hash`
- `display_name`
- `status`
- `created_at`

### `user_profiles`
- `user_id`
- `real_name`
- `gender`
- `college`
- `major`
- `grade`
- `class_name`
- `student_no`
- `teacher_no`
- `department`
- `teaching_group`
- `role_title`
- `birth_date`
- `avatar_path`
- `bio`
- `research_direction`
- `interests`
- `common_courses_json`
- `linked_classes_json`
- `updated_at`

### `session_tokens`
保存 Bearer Token 会话。

## 外观设置
### `appearance_settings`
- `user_role`
- `user_id`
- `mode`
- `accent`
- `font`
- `skin`
- `updated_at`

## 课程问答
### `chat_sessions`
- `id`
- `user_id`
- `course_id`
- `lesson_pack_id`
- `title`
- `selected_model`
- `created_at`
- `updated_at`

### `questions`
- `id`
- `session_id`
- `user_id`
- `course_id`
- `lesson_pack_id`
- `question_text`
- `answer_target_type`
- `selected_model`
- `is_anonymous`
- `status`
- `teacher_reply_status`
- `ai_answer_content`
- `ai_answer_time`
- `ai_answer_sources`
- `teacher_answer_content`
- `teacher_answer_time`
- `has_attachments`
- `attachment_count`
- `input_mode`
- `collected`
- `created_at`
- `updated_at`

### `question_attachments`
- `id`
- `question_id`
- `uploader_user_id`
- `file_name`
- `file_type`
- `file_size`
- `file_path`
- `parse_status`
- `parse_summary`
- `created_at`

### `teacher_notifications`
- `id`
- `teacher_id`
- `message_type`
- `related_question_id`
- `title`
- `content`
- `is_read`
- `created_at`

### `weakness_analyses`
- `id`
- `user_id`
- `course_id`
- `summary`
- `weak_points_json`
- `suggestions_json`
- `updated_at`

## 作业流程
### `assignments`
### `assignment_receipts`
### `assignment_submissions`
### `assignment_feedback`

## 匿名反馈
### `survey_templates`
### `survey_instances`
### `survey_responses`

## 材料更新
### `material_update_jobs`
保存教师发起的材料更新生成结果。
