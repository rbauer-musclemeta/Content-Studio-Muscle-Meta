import { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import Newsletter from "./components/Newsletter";
import HIITNewsletter from "./components/HIITNewsletter";
import NewsletterHub from "./components/NewsletterHub";
import CoursesPage from "./components/CoursesPage";
import SleepCourse from "./components/SleepCourse";
import PickleballCourse from "./components/PickleballCourse";
import PickleballCourseStyled from "./components/PickleballCourseStyled";
import CourseSuccess from "./components/CourseSuccess";
import AdminDashboard from "./components/AdminDashboard";
import CourseEditor from "./components/CourseEditor";
import AdminTest from "./components/AdminTest";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import UserProfile from "./components/UserProfile";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const helloWorldApi = async () => {
    try {
      const response = await axios.get(`${API}/`);
      console.log(response.data.message);
    } catch (e) {
      console.error(e, `errored out requesting / api`);
    }
  };

  useEffect(() => {
    helloWorldApi();
  }, []);

  return <NewsletterHub />;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/muscle-metabolic-health" element={<Newsletter />} />
            <Route path="/hiit-longevity" element={<HIITNewsletter />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/sleep-optimization" element={<SleepCourse />} />
            <Route path="/courses/pickleball-3p-system" element={<PickleballCourse />} />
            <Route path="/courses/sleep-optimization/success" element={<CourseSuccess />} />
            <Route path="/courses/pickleball-3p-system/success" element={<CourseSuccess />} />

            {/* Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<UserProfile />} />

            {/* Admin Routes */}
            <Route path="/admin-test" element={<AdminTest />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/courses/create" element={<CourseEditor />} />
            <Route path="/admin/courses/edit/:courseId" element={<CourseEditor />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;