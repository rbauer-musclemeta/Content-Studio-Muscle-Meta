import { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import Newsletter from "./components/Newsletter";
import HIITNewsletter from "./components/HIITNewsletter";
import NewsletterHub from "./components/NewsletterHub";

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
          <Route path="/" element={<Home />} />
          <Route path="/muscle-metabolic-health" element={<Newsletter />} />
          <Route path="/hiit-longevity" element={<HIITNewsletter />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;