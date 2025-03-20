import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Chat from "./components/Chat";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" index element={<Chat />} />
      </Routes>
    </Router>
  );
}

export default App;
