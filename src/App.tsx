import { Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import PublicLayout from "@/components/layout/PublicLayout";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Teachers from "@/pages/Teachers";
import Semesters from "@/pages/Semesters";
import SemesterDetail from "@/pages/SemesterDetail";
import Register from "@/pages/Register";
import RegistrationPayment from "@/pages/RegistrationPayment";
import Assessment from "@/pages/Assessment";
import Shop from "@/pages/Shop";
import ShopDetail from "@/pages/ShopDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import OrderSuccess from "@/pages/OrderSuccess";
import Contact from "@/pages/Contact";
import PaymentResult from "@/pages/PaymentResult";
import NotFound from "@/pages/NotFound";
import AdminLogin from "@/pages/admin/Login";
import AdminLayout from "@/components/admin/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import BooksAdmin from "@/pages/admin/BooksAdmin";
import SemestersAdmin from "@/pages/admin/SemestersAdmin";
import TeachersAdmin from "@/pages/admin/TeachersAdmin";
import EmployeesAdmin from "@/pages/admin/EmployeesAdmin";
import OrdersAdmin from "@/pages/admin/OrdersAdmin";
import RegistrationsAdmin from "@/pages/admin/RegistrationsAdmin";
import PromoAdmin from "@/pages/admin/PromoAdmin";

export default function App() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/semesters" element={<Semesters />} />
        <Route path="/semesters/:id" element={<SemesterDetail />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/pay" element={<RegistrationPayment />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:id" element={<ShopDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order/:ref" element={<OrderSuccess />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/payment/result" element={<PaymentResult />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="books" element={<BooksAdmin />} />
        <Route path="semesters" element={<SemestersAdmin />} />
        <Route path="teachers" element={<TeachersAdmin />} />
        <Route path="employees" element={<EmployeesAdmin />} />
        <Route path="orders" element={<OrdersAdmin />} />
        <Route path="registrations" element={<RegistrationsAdmin />} />
        <Route path="promo" element={<PromoAdmin />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
}
