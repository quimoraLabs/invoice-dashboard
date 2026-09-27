import { BrowserRouter, Navigate, useLocation, useRoutes } from "react-router-dom";
import Login from "./auth/Login";
import { AuthProvider } from "./contexts/authContext";
import Header from "./header";
import Register from "./auth/Register";
import Home from "./pages/Home";
import Invoice from "./pages/invoice";
import AddInvoice from "./pages/invoice/AddInvoice";
import Products from "./pages/product";
import Customer from "./pages/customer";
import { Toaster } from "react-hot-toast";
import InvoiceDetailPage from "./pages/invoice/ViewInvoice";
import InvoiceEditPage from "./pages/invoice/UpdateInvoice";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute";

function AppRoutes() {
  const routesArray = [
    { path: "/", element: <Navigate to="/home" replace /> },
    {
      path: "/login/*",
      element: (
        <PublicOnlyRoute>
          <Login />
        </PublicOnlyRoute>
      ),
    },
    {
      path: "/register/*",
      element: (
        <PublicOnlyRoute>
          <Register />
        </PublicOnlyRoute>
      ),
    },
    {
      path: "/home",
      element: (
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      ),
    },
    {
      path: "/invoice",
      element: (
        <ProtectedRoute>
          <Invoice />
        </ProtectedRoute>
      ),
    },
    {
      path: "/invoice/view/:invoiceId",
      element: (
        <ProtectedRoute>
          <InvoiceDetailPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/invoice/update/:invoiceId",
      element: (
        <ProtectedRoute>
          <InvoiceEditPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/invoice/create",
      element: (
        <ProtectedRoute>
          <AddInvoice />
        </ProtectedRoute>
      ),
    },
    {
      path: "/customers",
      element: (
        <ProtectedRoute>
          <Customer />
        </ProtectedRoute>
      ),
    },
    {
      path: "/products",
      element: (
        <ProtectedRoute>
          <Products />
        </ProtectedRoute>
      ),
    },
    { path: "*", element: <Navigate to="/login" replace /> },
  ];
  return useRoutes(routesArray);
}

function AppShell() {
  const location = useLocation();
  const isAuthPage =
    location.pathname === "/" ||
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/register");

  return (
    <>
      {!isAuthPage && <Header />}
      <Toaster position="top-right" />
      <main className={isAuthPage ? "min-h-screen" : "pt-14 min-h-screen"}>
        <AppRoutes />
      </main>
    </>
  );
}


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

