import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import "./App.css";

import Login from "./components/login/Login";
import Home from "./components/home/Home";
import ProtectedRoute from "./components/login/ProtectedRoute";

function App() {
  return (
    <>
      <div className="app">
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/home" element={<Home />} />
            </Route>
          </Routes>
        </Router>
      </div>
    </>
  );
}

export default App;