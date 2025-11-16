import { BrowserRouter, Route, Routes } from "react-router-dom";
import Index from "./pages/Index";
import Break from "./pages/Break";
import NotFound from "./pages/NotFound";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/break" element={<Break />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
