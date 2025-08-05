import { Route, Routes } from "react-router-dom";
import SidebarLayout from "./components/layouts/SidebarLayout";
import { navLinks } from "./constants/Navlinks";
import FullPageLayout from "./components/layouts/FullPageLayout";
import BillingPage from "./components/features/billing/BillingPage";

const App = () => {
  return (
    <>
      <Routes>
        <Route element={<SidebarLayout />}>
          {navLinks.map((item, idx) => (
            <Route key={idx} path={item.href} element={item.element} />
          ))}
        </Route>
        <Route element={<FullPageLayout />}>
          <Route path="/billing/new" element={<BillingPage />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
