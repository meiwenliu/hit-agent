# 面向前沿学科的智能教学平台

## 项目定位
本项目面向高校前沿学科课程场景，定位为“教师教学全流程智能伙伴”平台。系统以教师端为核心，围绕课程设计、前沿内容融入、PPT / 教案更新、学生提问反馈、作业任务管理、匿名课堂反馈和教学分析形成闭环；学生端在教师配置范围内使用课程专属 AI 助教、提交作业、查看反馈与维护个人学习记录。

平台强调以下原则：
- 教师为核心，学生为辅助
- AI 用于教学提效，不替代教师判断
- 所有记录与账号绑定，匿名仅隐藏展示身份
- 功能与文档必须与当前实现一致，不夸大未上线能力

## 目标用户
- 教师：课程负责人、主讲教师、教研团队成员
- 学生：选课学生、课后自学学生、课堂互动参与者
- 维护人员：项目开发成员、比赛展示人员、运维与演示支持人员

## 当前核心功能
### 教师端
- 智能课程设计助手：创建课程画像、生成课程包、辅助教案结构设计
- 前沿内容融入：围绕课程主题补充新技术、新案例、新热点
- PPT / 教案更新：上传旧材料或粘贴正文，选择实际模型后生成更新建议、PPT 草稿和配图建议
- 课程专属 AI 助教配置：设置学生端 AI 助教知识边界、回答风格与答疑范围
- 作业任务管理：发布作业、设置补交与提醒天数、查看已提交与未提交名单
- 作业辅助批改：学生提交后可生成结构、逻辑、规范性反馈参考
- 学生提问反馈中心：接收学生选择“教师回答”或“双通道回答”的问题并回复
- 匿名课堂反馈分析：手动触发课后问卷并查看参与率、评分分布与文本建议

### 学生端
- 课程专属 AI 助教：支持课时资料检索 + 大模型生成 + 多轮连续问答
- 提问分发机制：支持“仅 AI”“仅教师”“AI + 教师”三种提问模式
- 多模态提问：支持文本、图片、文档、压缩包附件上传
- 学习问答记录：查看历史提问、AI 回答、教师回答与附件信息
- 薄弱点分析：基于历史提问生成温和的学习诊断和复习建议
- 作业任务中心：确认收到、上传提交、查看状态与 AI 初步反馈
- 匿名课堂反馈：课程结束后自愿填写，也可选择跳过
- 个性化主题设置：白天、夜间、护眼模式 + 主色、字体、皮肤切换
- 个人中心：维护账号资料与角色信息

## 统一账号与角色逻辑
- 登录 / 注册入口统一放在页面右上角
- 点击后先选角色，再进入登录或注册流程
- 登录成功后按教师 / 学生角色自动进入对应视图
- 首页不再展示分散的教师注册页、学生注册页和独立设置卡片
- 学生必须使用本人账号登录，匿名发言仅隐藏展示层身份

## 技术架构
### 前端
- Next.js 16 + React 19 + TypeScript
- App Router 结构
- 全局主题变量 + 右上角设置中心
- 统一 API 客户端，使用 Bearer Token 访问后端
- 柔和浅色选中态样式系统，兼容白天 / 夜间 / 护眼模式

### 后端
- FastAPI
- SQLAlchemy + SQLite
- 基于统一 `users` / `user_profiles` 的账号体系
- Token 会话表保存登录态
- 问答、作业、问卷、材料更新等模块拆分为独立路由

### 大模型接入
平台已支持真实模型接入，不再只是前端摆设：
- 智谱 / GLM：通过 `LLM_*` 或 `ZHIPU_API_KEY` 配置，可在前端直接显示为 `GLM-5.1`、`GLM-5.1-Air` 等选项
- OpenAI / GPT：通过 `LLM_*` 或 `OPENAI_API_KEY` 配置，可在前端直接显示为 `GPT-4.1`、`GPT-4.1 mini` 等选项
- 千问：通过 `DASHSCOPE_*` 环境变量配置
- 豆包：通过 `ARK_*` 或 `DOUBAO_*` 环境变量配置

当前实现特征：
- 学生问答页会从后端读取“当前已接入模型列表”
- 前端会把用户选中的 `model_id` 传给后端
- 后端会按所选模型真正调用对应服务，而不是写死默认值
- 回答结果会附带“本次回答使用模型 / 提供方 / 调用状态 / 耗时”
- 若模型未配置或调用失败，会明确返回错误提示，不再伪装成正常回答
- 教师端 `PPT / 教案更新` 页面也已接入同一套模型选择逻辑

## 主要页面
### 公共页面
- `/`：角色化首页与产品介绍
- `/profile`：个人中心
- `/settings`：设置中心

### 教师端页面
- `/teacher`
- `/teacher/course`
- `/teacher/ai-config`
- `/teacher/assignments`
- `/teacher/questions`
- `/teacher/material-update`
- `/teacher/feedback`

### 学生端页面
- `/student`
- `/student/qa`
- `/student/questions`
- `/student/weakness`
- `/student/assignments`
- `/student/feedback`

## 快速启动
### 1. 后端
在项目根目录执行：
```powershell
.\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir .\backend --host 127.0.0.1 --port 8000
```

启动后可先打开：`http://127.0.0.1:8000/api/health`
如果能看到 `{"status":"ok","version":"0.7.0"}`，说明后端正常。

### 1.1 智谱 GLM-5.1 推荐配置
如果你优先使用智谱官方兼容接口，建议直接设置：
```powershell
$env:LLM_BASE_URL = "https://open.bigmodel.cn/api/coding/paas/v4"
$env:LLM_API_KEY = "你的智谱 API Key"
 $env:LLM_MODEL_FAST = "GLM-5.1-Air"
 $env:LLM_MODEL_SMART = "GLM-5.1"
```
说明：后端已兼容“只填写到 `/v4`”的 Base URL 写法，会自动补全到 `chat/completions`。

### 2. 前端
如果你的系统里 `npm` 命令不可直接识别，先把项目自带 Node 放进当前会话路径：
```powershell
cd .\frontend
$env:Path = "E:\ai_app\hit-agent-master\node-v24.14.1-win-x64;" + $env:Path
$env:NEXT_PUBLIC_API_BASE = "http://127.0.0.1:8000"
npm.cmd run dev
```

默认访问地址：`http://127.0.0.1:3000`

### 3. 演示账号
初始化数据库时会自动写入两个演示账号：
- 教师：`teacher_demo` / `Teacher123!`
- 学生：`student_demo` / `Student123!`

## 环境变量说明
详见 `env.example` 与 `docs/admin/admin-maintenance-guide.md`。重点变量包括：
- `NEXT_PUBLIC_API_BASE`
- `LLM_BASE_URL`
- `LLM_API_KEY`、`OPENAI_API_KEY` 或 `ZHIPU_API_KEY`
- `LLM_MODEL_FAST`
- `LLM_MODEL_SMART`
- `DASHSCOPE_API_KEY`
- `DASHSCOPE_BASE_URL`
- `DASHSCOPE_MODEL_TEXT`
- `DASHSCOPE_MODEL_VISION`
- `ARK_API_KEY`
- `ARK_BASE_URL`
- `ARK_MODEL_TEXT`
- `ARK_MODEL_VISION`

## 文档索引
- 产品总览：`docs/product-overview.md`
- 教师端模块：`docs/teacher-modules.md`
- 学生端模块：`docs/student-modules.md`
- 功能说明：`docs/features/`
- API 文档：`docs/api/`
- 数据结构：`docs/data-model/schema-overview.md`
- 用户手册：`docs/user-guide/`
- 管理员维护：`docs/admin/admin-maintenance-guide.md`
- 更新记录：`docs/changelog/current-updates.md`

## 当前边界说明
以下能力在当前版本中已经接入基础流程，但仍保留扩展空间，文档中也会据实说明：
- 课后问卷自动按时间触发：当前以教师手动触发为主，定时任务为预留能力
- 部分文件解析：优先支持 txt、md、docx、pptx、zip 索引；pdf、doc、ppt、rar 可能仅保存供教师查看
- 教师通知路由：当前按教师账号列表推送，后续可细化到课程归属教师
- 图像理解效果：取决于所选模型是否支持视觉输入


