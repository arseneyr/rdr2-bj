import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";

import Worker from "./bj.worker";

function App() {
  const [prob, setProb] = useState(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const worker = new Worker();
    worker.onmessage = ({ data }) => setProgress(data.progress);
  }, []);
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        {progress}
        <br />
        {prob}
      </header>
    </div>
  );
}

export default App;
