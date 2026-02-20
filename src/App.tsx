import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OrderProvider } from "@/contexts/OrderContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import NewOrder from "./pages/NewOrder";
import Cardapio from "./pages/Cardapio";
import Taxas from "./pages/Taxas";
import Mesas from "./pages/Mesas";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthGate() {
  const { user } = useAuth();

  if (!user) return <Login />;

  return (
    <OrderProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/novo-pedido" element={<NewOrder />} />
            <Route path="/cardapio" element={<Cardapio />} />
            <Route path="/taxas" element={<Taxas />} />
            <Route path="/mesas" element={<Mesas />} />
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
