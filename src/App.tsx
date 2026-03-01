import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OrderProvider } from "@/contexts/OrderContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { usePrintQueueProcessor } from "@/hooks/usePrintQueue";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import NewOrder from "./pages/NewOrder";
import Cardapio from "./pages/Cardapio";
import Taxas from "./pages/Taxas";
import Mesas from "./pages/Mesas";
import Clientes from "./pages/Clientes";
import Funcionarios from "./pages/Funcionarios";
import Entregas from "./pages/Entregas";
import AppInstall from "./pages/AppInstall";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function PrintQueueRunner() {
  usePrintQueueProcessor(4000);
  return null;
}

function AuthGate() {
  const { user, role } = useAuth();

  if (!user && role !== 'admin') return <Login />;

  if (role === 'admin') return <AdminDashboard />;

  return (
    <OrderProvider>
      <PrintQueueRunner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/novo-pedido" element={<NewOrder />} />
            <Route path="/cardapio" element={<Cardapio />} />
            <Route path="/taxas" element={<Taxas />} />
            <Route path="/mesas" element={<Mesas />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/funcionarios" element={<Funcionarios />} />
            <Route path="/entregas" element={<Entregas />} />
            <Route path="/app" element={<AppInstall />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </OrderProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <AuthGate />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
