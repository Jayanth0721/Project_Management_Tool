from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.workspaces import router as workspaces_router
from app.api.v1.members import router as members_router
from app.api.v1.invitations import router as invitations_router
from app.api.v1.projects import router as projects_router
from app.api.v1.issues import router as issues_router
from app.api.v1.boards import router as boards_router
from app.api.v1.sprints import router as sprints_router
from app.api.v1.spaces import router as spaces_router
from app.api.v1.pages import router as pages_router
from app.api.v1.comments import router as comments_router
from app.api.v1.attachments import router as attachments_router
from app.api.v1.search import router as search_router
from app.api.v1.activity import router as activity_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.files import router as files_router
from app.api.v1.ws import router as ws_router
from app.api.v1.backlog import router as backlog_router
from app.api.v1.velocity import router as velocity_router
from app.api.v1.gantt import router as gantt_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(workspaces_router, prefix="/workspaces", tags=["workspaces"])
api_router.include_router(members_router, prefix="/workspaces", tags=["members"])
api_router.include_router(invitations_router, prefix="/workspaces", tags=["invitations"])
api_router.include_router(invitations_router, prefix="/invitations", tags=["invitations"])
api_router.include_router(projects_router, prefix="/workspaces", tags=["projects"])
api_router.include_router(issues_router, prefix="/projects", tags=["issues"])
api_router.include_router(backlog_router, prefix="/projects", tags=["backlog"])
api_router.include_router(gantt_router, prefix="/projects", tags=["gantt"])
api_router.include_router(velocity_router, prefix="/workspaces", tags=["velocity"])
api_router.include_router(boards_router, prefix="/projects", tags=["boards"])
api_router.include_router(sprints_router, prefix="/projects", tags=["sprints"])
api_router.include_router(spaces_router, prefix="/workspaces", tags=["spaces"])
api_router.include_router(pages_router, prefix="/spaces", tags=["pages"])
api_router.include_router(comments_router, tags=["comments"])
api_router.include_router(attachments_router, tags=["attachments"])
api_router.include_router(search_router, prefix="/search", tags=["search"])
api_router.include_router(activity_router, prefix="/activity", tags=["activity"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["notifications"])
api_router.include_router(files_router, prefix="/files", tags=["files"])