import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import BlogDetail from "./pages/BlogDetail.jsx";
import CreateBlog from "./pages/CreateBlog.jsx";
import EditBlog from "./pages/EditBlog.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import MyBlogs from "./pages/MyBlogs.jsx";
import NotFound from "./pages/NotFound.jsx";
import Signup from "./pages/Signup.jsx";

function AuthRedirectListener() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleUnauthorized = (event) => {
      if (
        event.detail?.shouldRedirect &&
        location.pathname !== "/login" &&
        location.pathname !== "/signup"
      ) {
        navigate("/login", { replace: true });
      }
    };

    window.addEventListener("blogify:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("blogify:unauthorized", handleUnauthorized);
    };
  }, [navigate, location.pathname]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuthRedirectListener />
        <div className="min-h-screen bg-[#FAFAFA] text-[#111827]">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/blogs/:id" element={<BlogDetail />} />
            <Route
              path="/write"
              element={
                <ProtectedRoute>
                  <CreateBlog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit/:id"
              element={
                <ProtectedRoute>
                  <EditBlog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-blogs"
              element={
                <ProtectedRoute>
                  <MyBlogs />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
