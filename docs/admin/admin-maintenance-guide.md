# 管理员维护说明

## 1. 后端启动
```powershell
.\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir .\backend --host 127.0.0.1 --port 8000
```

## 2. 前端启动
```powershell
cd .\frontend
npm install
npm run dev
```

## 3. 模型配置
### 默认模型
- `LLM_BASE_URL`
- `LLM_API_KEY`
- `LLM_MODEL_FAST`
- `LLM_MODEL_SMART`

### 千问
- `DASHSCOPE_API_KEY`
- `DASHSCOPE_BASE_URL`
- `DASHSCOPE_MODEL_TEXT`
- `DASHSCOPE_MODEL_VISION`

### 豆包
- `ARK_API_KEY` 或 `DOUBAO_API_KEY`
- `ARK_BASE_URL`
- `ARK_MODEL_TEXT`
- `ARK_MODEL_VISION`

## 4. 数据初始化
后端启动时会执行 `init_db()`，自动创建表并写入演示账号。

## 5. 维护提醒
- 当前附件解析能力与外部模型能力相关
- 若更换模型供应商，需确认其是否兼容 OpenAI 风格接口
- 若新增自动提醒或定时问卷触发，建议引入调度器而不是直接阻塞 Web 进程
