import { createRouter, createRootRoute, createRoute, Outlet } from "@tanstack/react-router";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { AcceptInvitationPage } from "@/pages/AcceptInvitationPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardPage } from "@/pages/app/DashboardPage";
import { ProfilePage } from "@/pages/app/ProfilePage";
import { WorkspaceSettingsPage } from "@/pages/app/WorkspaceSettingsPage";
import { ProjectsPage } from "@/pages/app/ProjectsPage";
import { SpacesPage } from "@/pages/app/SpacesPage";
import { SearchPage } from "@/pages/app/SearchPage";
import { AboutPage } from "@/pages/app/AboutPage";
import { NotificationsPage } from "@/pages/app/NotificationsPage";
import { IssueDetailPage } from "@/pages/app/IssueDetailPage";
import { PageDetailPage } from "@/pages/app/PageDetailPage";
import { SpacePage } from "@/pages/app/SpacePage";
import { PageCreatePage } from "@/pages/app/PageCreatePage";
import { ProjectDetailPage } from "@/pages/app/ProjectDetailPage";
import { BoardPage } from "@/pages/app/BoardPage";
import { BacklogPage } from "@/pages/app/BacklogPage";
import { GanttPage } from "@/pages/app/GanttPage";
import { InvitePage } from "@/pages/app/InvitePage";
import { PluginsPage } from "@/pages/app/PluginsPage";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

function LayoutWrapper() {
  return <AppLayout />;
}

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app",
  component: LayoutWrapper,
});

const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/",
  component: DashboardPage,
});

const profileRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/settings/profile",
  component: ProfilePage,
});

const workspaceSettingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/settings/workspace",
  component: WorkspaceSettingsPage,
});

const projectsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/projects",
  component: ProjectsPage,
});

const spacesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/spaces",
  component: SpacesPage,
});

const searchRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/search",
  component: SearchPage,
});

const aboutRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/about",
  component: AboutPage,
});

const notificationsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/notifications",
  component: NotificationsPage,
});

const inviteRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/invite",
  component: InvitePage,
});

const pluginsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/plugins",
  component: PluginsPage,
});

const projectsDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/projects/$projectKey",
  component: ProjectDetailPage,
});

const issueDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/projects/$projectKey/issues/$issueKey",
  component: IssueDetailPage,
});

const boardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/projects/$projectKey/board",
  component: BoardPage,
});

const backlogRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/projects/$projectKey/backlog",
  component: BacklogPage,
});

const ganttRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/projects/$projectKey/gantt",
  component: GanttPage,
});

const spaceRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/spaces/$spaceKey",
  component: SpacePage,
});

const pageCreateRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/spaces/$spaceKey/page/new",
  component: PageCreatePage,
});

const pageDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/spaces/$spaceKey/page/$pageId",
  component: PageDetailPage,
});

const routeTree = rootRoute.addChildren([
  createRoute({ getParentRoute: () => rootRoute, path: "/login", component: LoginPage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/register", component: RegisterPage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/forgot-password", component: ForgotPasswordPage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/accept-invitation/$token", component: AcceptInvitationPage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/onboarding", component: OnboardingPage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/reset-password", component: ResetPasswordPage }),
  appRoute.addChildren([
    dashboardRoute,
    profileRoute,
    workspaceSettingsRoute,
    projectsRoute,
    projectsDetailRoute,
    aboutRoute,
    searchRoute,
    notificationsRoute,
    inviteRoute,
    pluginsRoute,
    issueDetailRoute,
    boardRoute,
    backlogRoute,
    ganttRoute,
    spacesRoute,
    spaceRoute,
    pageCreateRoute,
    pageDetailRoute,
  ]),
  createRoute({ getParentRoute: () => rootRoute, path: "/", component: LoginPage }),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultNotFoundComponent: () => LoginPage,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}