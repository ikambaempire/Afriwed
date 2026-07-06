import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import Index from "./pages/Index";
import Vendors from "./pages/Vendors";
import VendorProfile from "./pages/VendorProfile";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import VendorDashboard from "./pages/VendorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Planning from "./pages/Planning";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";
import Stories from "./pages/Stories";
import StoryDetail from "./pages/StoryDetail";
import RealWeddings from "./pages/RealWeddings";
import RealWeddingDetail from "./pages/RealWeddingDetail";
import Submit from "./pages/Submit";
import AuthorApply from "./pages/AuthorApply";
import AuthorProfile from "./pages/AuthorProfile";
import AuthorDashboard from "./pages/AuthorDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/vendor/:id" element={<VendorProfile />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/vendor-dashboard" element={<VendorDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/planning" element={<Planning />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/install" element={<Install />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/stories/:slug" element={<StoryDetail />} />
            <Route path="/real-weddings" element={<RealWeddings />} />
            <Route path="/real-weddings/:slug" element={<RealWeddingDetail />} />
            <Route path="/submit" element={<Submit />} />
            <Route path="/author-apply" element={<AuthorApply />} />
            <Route path="/author-dashboard" element={<AuthorDashboard />} />
            <Route path="/authors/:slug" element={<AuthorProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
