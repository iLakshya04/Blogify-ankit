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
        <div className="min-h-screen flex flex-col bg-[#F6F5F2] text-[#111214]">
          <Navbar />
          <div className="flex-1">
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
          <footer className="mt-16 border-t border-stone-200 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
              <span className="font-display font-semibold text-stone-800">Blogify</span>
              <span>Built with React, Express, MongoDB &amp; Cloudinary</span>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
