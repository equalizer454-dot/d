import { SocProvider, useSoc } from "./context/SocContext";
import { LoginPage } from "./pages/LoginPage";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AlertsPage } from "./pages/AlertsPage";
import { AlertDetailPage } from "./pages/AlertDetailPage";
import { IncidentsPage } from "./pages/IncidentsPage";
import { IncidentDetailPage } from "./pages/IncidentDetailPage";
import { ReportsPage } from "./pages/ReportsPage";
import { ThreatHunting } from "./pages/ThreatHunting";
import { InvestigationPage } from "./pages/InvestigationPage";
const AppContent = () => {
  const { currentRoute, isAuthenticated } = useSoc();
  if (!isAuthenticated && currentRoute === "/") {
    return <LandingPage />;
  }
  if (!isAuthenticated || currentRoute === "/login") {
    return <LoginPage />;
  }
  switch (currentRoute) {
    case "/":
    case "/dashboard":
      return <DashboardPage />;
    case "/alerts":
      return <AlertsPage />;
    case "/alerts/:id":
      return <AlertDetailPage />;
    case "/incidents":
      return <IncidentsPage />;
    case "/incidents/:id":
      return <IncidentDetailPage />;
    case "/reports":
      return <ReportsPage />;
    case "/hunting":
    case "/hunting/:id":
      return <ThreatHunting />;
    case "/investigation":
      return <InvestigationPage />;
    default:
      return <DashboardPage />;
  }
};
export default function App() {
  return <SocProvider>
      <AppContent />
    </SocProvider>;
}
