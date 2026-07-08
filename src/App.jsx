// import "./App.css";
import { BrowserRouter, useLocation, useRoutes } from "react-router-dom";
import Login from "./auth/Login";
import { AuthProvider } from "./contexts/authContext";
import Header from "./header";
import Register from "./auth/Register";
import Home from "./pages/Home";
import InVoice from "./pages/invoice";
import AddInvoice from "./pages/invoice/AddInvoice";
import Products from "./pages/product";
import Customer from "./pages/customer";
import { Toaster } from "react-hot-toast";

function AppRoutes() {
  const routesArray = [
    { path: "*", element: <Login /> },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/home", element: <Home /> },
    { path: "/invoice", element: <InVoice /> },
    { path: "/invoice/create", element: <AddInvoice /> },
    { path: "/customers", element: <Customer /> },
    { path: "/products", element: <Products /> },
  ];
  return useRoutes(routesArray);
}

function AppShell() {
  const location = useLocation();
  const isAuthPage = ["/", "/login", "/register"].includes(location.pathname);

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
