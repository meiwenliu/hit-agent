"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE, api, type AnnotationStroke, type LiveShareRecord, type MaterialItem } from "@/lib/api";

const TOOL_OPTIONS = [
  { key: "pen", label: "钢笔", alpha: 1 },
  { key: "pencil", label: "铅笔", alpha: 0.68 },
  { key: "ballpen", label: "圆珠笔", alpha: 0.9 },
  { key: "highlighter", label: "荧光笔", alpha: 0.28 },
  { key: "flash", label: "速消笔", alpha: 0.92 },
];

export function LiveAnnotationBoard({
  share,
  material,
  teacherMode,
}: {
  share: LiveShareRecord;
  material: MaterialItem | null;
  teacherMode: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [page, setPage] = useState(share.current_page || 1);
  const [strokes, setStrokes] = useState<AnnotationStroke[]>([]);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#ef4444");
  const [lineWidth, setLineWidth] = useState(4);
  const [drawing, setDrawing] = useState<{ x: number; y: number }[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setPage(share.current_page || 1);
  }, [share.current_page]);

  useEffect(() => {
    api.listAnnotations(share.id, page).then(setStrokes).catch(() => setStrokes([]));
  }, [share.id, page]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const base = API_BASE.replace(/^http/, protocol);
    const ws = new WebSocket(`${base}/api/materials/live/${share.id}/ws`);
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.event === "annotation_created" && payload.annotation.page_no === page) {
        setStrokes((prev) => [...prev, payload.annotation]);
      }
      if (payload.event === "page_changed") {
        setPage(payload.share.current_page);
      }
      if (payload.event === "share_ended") {
        setMessage("教师已结束共享。");
      }
    };
    const timer = window.setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send("ping");
    }, 15000);
    return () => {
      window.clearInterval(timer);
      ws.close();
    };
  }, [share.id, page]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    const now = Date.now();
    strokes.forEach((stroke) => {
      if (stroke.is_temporary && stroke.expires_at && new Date(stroke.expires_at).getTime() < now) return;
      const meta = TOOL_OPTIONS.find((item) => item.key === stroke.tool_type);
      context.save();
      context.globalAlpha = meta?.alpha ?? 1;
      context.strokeStyle = stroke.color;
      context.lineWidth = stroke.line_width;
      context.lineCap = "round";
      context.lineJoin = "round";
      const points = stroke.points_data || [];
      if (points.length > 0) {
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
        context.stroke();
      }
      context.restore();
    });
  }, [strokes]);

  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const saveStroke = async (points: { x: number; y: number }[]) => {
    if (!teacherMode || points.length < 2) return;
    try {
      const stroke = await api.createAnnotationStroke(share.id, {
        page_no: page,
        tool_type: tool,
        color,
        line_width: lineWidth,
        points_data: points,
        is_temporary: tool === "flash",
        expires_in_seconds: tool === "flash" ? 8 : undefined,
      });
      setStrokes((prev) => [...prev, stroke]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "批注发送失败");
    }
  };

  const materialLabel = useMemo(() => material?.filename || `共享资料 ${share.material_id}`, [material, share.material_id]);

  return (
    <main className="grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
      <section className="glass-panel rounded-[32px] px-6 py-8 md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-sm font-semibold text-slate-500">课堂同步展示</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">{materialLabel}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">当前第 {page} 页。学生端可同步看到页码与批注，不能修改。</p>
          </div>
          {material ? <a href={`${API_BASE}${material.download_url}`} target="_blank" className="ui-pill rounded-full px-4 py-2 text-sm font-semibold">打开原始资料</a> : null}
        </div>

        <div className="mt-5 relative overflow-hidden rounded-[28px] border border-slate-200 bg-white/80">
          <div className="absolute inset-0 soft-grid opacity-40" />
          <div className="relative flex min-h-[34rem] items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_26%),linear-gradient(180deg,#fff,#f8fafc)]">
            <div className="absolute left-6 top-6 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">第 {page} 页</div>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-slate-300">
              <div className="rounded-[24px] border border-dashed border-slate-300 px-8 py-10 text-center">
                <p className="text-sm font-semibold text-slate-500">课堂展示占位画布</p>
                <p className="mt-2 text-xl font-bold text-slate-700">{materialLabel}</p>
                <p className="mt-2 text-sm text-slate-500">当前版本以画布叠加方式演示同步批注与共享逻辑。</p>
              </div>
            </div>
            <canvas
              ref={canvasRef}
              width={1280}
              height={760}
              className="relative z-10 h-full w-full"
              onPointerDown={(e) => teacherMode && setDrawing([pointerPos(e)])}
              onPointerMove={(e) => teacherMode && drawing.length > 0 && setDrawing((prev) => [...prev, pointerPos(e)])}
              onPointerUp={() => {
                void saveStroke(drawing);
                setDrawing([]);
              }}
            />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="glass-panel rounded-[32px] px-6 py-8 md:px-8">
          <p className="text-sm font-semibold text-slate-500">工具栏</p>
          <h3 className="mt-2 text-2xl font-black text-slate-900">{teacherMode ? "教师批注工具" : "学生只读视图"}</h3>
          {teacherMode ? (
            <>
              <div className="mt-5 flex flex-wrap gap-2">
                {TOOL_OPTIONS.map((item) => (
                  <button key={item.key} onClick={() => setTool(item.key)} className={`rounded-full px-3 py-2 text-sm font-semibold ${tool === item.key ? "ui-pill-active" : "ui-pill"}`}>{item.label}</button>
                ))}
              </div>
              <div className="mt-5 space-y-4">
                <label className="block text-sm font-semibold text-slate-700">
                  颜色
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-slate-300 bg-white p-2" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  线条粗细：{lineWidth}
                  <input type="range" min={2} max={18} value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} className="mt-2 w-full" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  切页
                  <input type="number" min={1} value={page} onChange={(e) => setPage(Number(e.target.value) || 1)} className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3" />
                </label>
                <button onClick={() => void api.updateLiveSharePage(share.id, page)} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">同步当前页</button>
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm leading-7 text-slate-600">当前页面为学生同步查看模式，只能看到教师切页与批注，不能编辑。</p>
          )}
          {message ? <p className="mt-4 text-sm text-slate-500">{message}</p> : null}
        </div>
      </section>
    </main>
  );
}
