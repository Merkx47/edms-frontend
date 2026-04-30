import { lazy, Suspense } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { ErrorBoundary } from "@/components/error-boundary";
import { useDataStore } from "@/lib/data-store";

const Login = lazy(() => import("@/pages/login"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Documents = lazy(() => import("@/pages/documents"));
const DocumentDetail = lazy(() => import("@/pages/document-detail"));
const Workflows = lazy(() => import("@/pages/workflows"));
const AuditTrail = lazy(() => import("@/pages/audit"));
const Reports = lazy(() => import("@/pages/reports"));
const Notifications = lazy(() => import("@/pages/notifications"));
const Settings = lazy(() => import("@/pages/settings"));
const WorkflowDetail = lazy(() => import("@/pages/workflow-detail"));
const WorkflowCreate = lazy(() => import("@/pages/workflow-create"));
const Members = lazy(() => import("@/pages/members"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/documents" component={Documents} />
        <Route path="/documents/:id" component={DocumentDetail} />
        <Route path="/workflows" component={Workflows} />
        <Route path="/workflows/create" component={WorkflowCreate} />
        <Route path="/workflows/:id" component={WorkflowDetail} />
        <Route path="/audit" component={AuditTrail} />
        <Route path="/reports" component={Reports} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/settings" component={Settings} />
        <Route path="/members" component={Members} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AuthenticatedApp() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-4rem)] overflow-hidden">
          <ErrorBoundary>
            <Router />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

function App() {
  const isAuthenticated = useDataStore((s) => s.isAuthenticated);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {isAuthenticated ? (
          <Switch>
            <Route path="/login">
              <Redirect to="/" />
            </Route>
            <Route>
              <AuthenticatedApp />
            </Route>
          </Switch>
        ) : (
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/login" component={Login} />
              <Route>
                <Login />
              </Route>
            </Switch>
          </Suspense>
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
