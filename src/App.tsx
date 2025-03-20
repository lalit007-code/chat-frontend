import { useEffect, useRef, useState } from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import Chat from "./components/Chat";

function App() {
  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<Home />} /> */}
        <Route path="/" index element={<Chat />} />
      </Routes>
    </Router>
  );
}

export default App;
