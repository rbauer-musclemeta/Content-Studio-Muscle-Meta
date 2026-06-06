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
import ResearchAdmin from "./components/ResearchAdmin";
import AssetLibrary from "./components/AssetLibrary";
import { Toaster } from "./components/ui/toaster";
import { CatabolicRiskAssessment } from "./components/assessment";

// New unified admin layout
import AdminLayout from "./components/admin/AdminLayout";
import AdminHome from "./components/admin/AdminHome";

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
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/muscle-metabolic-health" element={<Newsletter />} />
          <Route path="/hiit-longevity" element={<HIITNewsletter />} />

          {/* Assessment Routes */}
          <Route path="/assessment/catabolic-risk" element={<CatabolicRiskAssessment />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/sleep-optimization" element={<SleepCourse />} />
          <Route path="/courses/pickleball-3p-system" element={<PickleballCourse />} />
          <Route path="/courses/sleep-optimization/success" element={<CourseSuccess />} />
          <Route path="/courses/pickleball-3p-system/success" element={<CourseSuccess />} />

          {/* Admin Routes — Unified Layout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminHome />} />
            <Route path="research" element={<ResearchAdmin embedded />} />
            <Route path="assets" element={<AssetLibrary embedded />} />
            <Route path="courses/create" element={<CourseEditor />} />
            <Route path="courses/edit/:courseId" element={<CourseEditor />} />
          </Route>

          {/* Legacy routes (keep for backwards compat) */}
          <Route path="/admin-test" element={<AdminTest />} />
          <Route path="/admin-old" element={<AdminDashboard />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;