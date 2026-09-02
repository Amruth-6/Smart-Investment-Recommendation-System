import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { DashboardLayout } from "./components/common/DashboardLayout";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import FinancialProfile from "./pages/FinancialProfile";
import RiskAssessment from "./pages/RiskAssessment";
import FinancialHealth from "./pages/FinancialHealth";
import Goals from "./pages/Goals";
import GoalDetails from "./pages/GoalDetails";
import Recommendations from "./pages/Recommendations";
import RecommendationDetails from "./pages/RecommendationDetails";
import Portfolio from "./pages/Portfolio";
import PortfolioAnalysis from "./pages/PortfolioAnalysis";
import InvestmentExplorer from "./pages/InvestmentExplorer";
import InvestmentComparison from "./pages/InvestmentComparison";
import WealthSimulator from "./pages/WealthSimulator";
import WhatIf from "./pages/WhatIf";
import AIAssistant from "./pages/AIAssistant";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <div className="App grain">
      <AuthProvider>
        <BrowserRouter>
          <Toaster theme="dark" position="top-right" richColors />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/financial-profile" element={<FinancialProfile />} />
              <Route path="/risk-assessment" element={<RiskAssessment />} />
              <Route path="/financial-health" element={<FinancialHealth />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/goals/:id" element={<GoalDetails />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/recommendations/:id" element={<RecommendationDetails />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/portfolio-analysis" element={<PortfolioAnalysis />} />
              <Route path="/investments" element={<InvestmentExplorer />} />
              <Route path="/investments/compare" element={<InvestmentComparison />} />
              <Route path="/simulator" element={<WealthSimulator />} />
              <Route path="/what-if" element={<WhatIf />} />
              <Route path="/assistant" element={<AIAssistant />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route
              element={
                <ProtectedRoute adminOnly>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
