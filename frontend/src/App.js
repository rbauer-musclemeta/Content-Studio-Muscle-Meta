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
import KnowledgeBase from "./components/KnowledgeBase";
import KnowledgeBaseEditor from "./components/KnowledgeBaseEditor";
import KnowledgeBaseChat from "./components/KnowledgeBaseChat";
import KnowledgeTelos from "./components/KnowledgeTelos";
import { Toaster } from "./components/ui/toaster";

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
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/sleep-optimization" element={<SleepCourse />} />
          <Route path="/courses/pickleball-3p-system" element={<PickleballCourse />} />
          <Route path="/courses/sleep-optimization/success" element={<CourseSuccess />} />
          <Route path="/courses/pickleball-3p-system/success" element={<CourseSuccess />} />
          
          {/* Admin Routes */}
          <Route path="/admin-test" element={<AdminTest />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/courses/create" element={<CourseEditor />} />
          <Route path="/admin/courses/edit/:courseId" element={<CourseEditor />} />

          {/* Knowledge Base Routes */}
          <Route path="/admin/kb" element={<KnowledgeBase />} />
          <Route path="/admin/kb/create" element={<KnowledgeBaseEditor />} />
          <Route path="/admin/kb/upload" element={<KnowledgeBaseEditor uploadMode={true} />} />
          <Route path="/admin/kb/edit/:articleId" element={<KnowledgeBaseEditor />} />
          <Route path="/admin/kb/ask" element={<KnowledgeBaseChat />} />
          <Route path="/admin/kb/telos" element={<KnowledgeTelos />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;