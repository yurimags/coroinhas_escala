import { Suspense } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/home";
import routes from "tempo-routes";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/servers" element={<Home defaultTab="servers" />} />
          <Route path="/schedule" element={<Home defaultTab="schedule" />} />
          <Route path="/history" element={<Home defaultTab="history" />} />
          <Route path="/settings" element={<Home defaultTab="settings" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    </Suspense>
  );
}

export default App;
