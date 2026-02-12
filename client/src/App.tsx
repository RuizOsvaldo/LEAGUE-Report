import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import AppHome from "@/pages/AppHome";

import InstructorDashboard from "@/pages/instructor/InstructorDashboard";
import InstructorReviews from "@/pages/instructor/InstructorReviews";
import ReviewEditor from "@/pages/instructor/ReviewEditor";

import TemplatesPage from "@/pages/templates/TemplatesPage";

import AdminOverview from "@/pages/admin/AdminOverview";
import AdminInstructors from "@/pages/admin/AdminInstructors";
import AdminCompliance from "@/pages/admin/AdminCompliance";

import FeedbackPage from "@/pages/feedback/FeedbackPage";
import { useAuth } from "@/hooks/use-auth";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public feedback page */}
      <Route path="/feedback/:reviewId" component={FeedbackPage} />

      {/* Root: show Landing when logged out; AppHome when logged in */}
      <Route path="/">
        {isLoading ? <Landing /> : isAuthenticated ? <AppHome /> : <Landing />}
      </Route>

      {/* Instructor */}
      <Route path="/instructor" component={InstructorDashboard} />
      <Route path="/instructor/reviews" component={InstructorReviews} />
      <Route path="/instructor/reviews/:reviewId" component={ReviewEditor} />

      {/* Templates */}
      <Route path="/templates" component={TemplatesPage} />

      {/* Admin */}
      <Route path="/admin" component={AdminOverview} />
      <Route path="/admin/instructors" component={AdminInstructors} />
      <Route path="/admin/compliance" component={AdminCompliance} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
