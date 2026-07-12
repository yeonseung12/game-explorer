import { Route, Routes } from "react-router-dom";
import ExplorerPage from "./routes/ExplorerPage";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<ExplorerPage />} />
    </Routes>
  );
};

export default App;
