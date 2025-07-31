import { Route, Routes } from "react-router-dom";
import Container from "./components/Container";
import { navLinks } from "./constants/Navlinks";

const App = () => {
  return (
    <Container>
      <Routes>
        {navLinks.map((item, idx) => (
          <Route key={idx} path={item.href} element={item.element} />
        ))}
      </Routes>
    </Container>
  );
};

export default App;
