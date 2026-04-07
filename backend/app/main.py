"""FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .routes import admin, agent_config, analytics, assignment_review, assignments, auth, courses, discussion, feedback, lesson_packs, material_update, materials, profile, qa, settings, student, users

app = FastAPI(
    title="面向前沿学科的智能教学平台",
    version="0.8.0",
    description="面向前沿学科教学场景的教师教学全流程智能伙伴平台。",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    init_db()


app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(settings.router)
app.include_router(courses.router)
app.include_router(discussion.router)
app.include_router(lesson_packs.router)
app.include_router(materials.router)
app.include_router(agent_config.router)
app.include_router(qa.router)
app.include_router(assignments.router)
app.include_router(material_update.router)
app.include_router(feedback.router)
app.include_router(analytics.router)
app.include_router(student.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(assignment_review.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": "0.8.0"}
