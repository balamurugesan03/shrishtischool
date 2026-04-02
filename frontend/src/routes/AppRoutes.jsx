import { Routes, Route, Navigate } from 'react-router-dom';

import Login         from '../pages/auth/Login';
import ProtectedRoute from '../components/ProtectedRoute';

import Dashboard     from '../pages/Dashboard';
import StudentList   from '../pages/students/StudentList';
import StudentForm   from '../pages/students/StudentForm';
import StudentProfile from '../pages/students/StudentProfile';

import ProductList   from '../pages/inventory/ProductList';
import Categories    from '../pages/inventory/Categories';
import PurchaseEntry from '../pages/inventory/PurchaseEntry';
import IssueInventory from '../pages/inventory/IssueInventory';
import IssueHistory  from '../pages/inventory/IssueHistory';
import StockReport   from '../pages/inventory/StockReport';

import InvoiceList   from '../pages/billing/InvoiceList';
import CreateInvoice from '../pages/billing/CreateInvoice';
import InvoiceDetail from '../pages/billing/InvoiceDetail';
import FeeManagement from '../pages/billing/FeeManagement';

import StaffList     from '../pages/staff/StaffList';
import StaffForm     from '../pages/staff/StaffForm';

import Ledger        from '../pages/accounting/Ledger';
import DayBook       from '../pages/accounting/DayBook';
import CashBook      from '../pages/accounting/CashBook';
import Payments      from '../pages/accounting/Payments';

const P = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Dashboard */}
      <Route path="/"  element={<P><Dashboard /></P>} />

      {/* Students */}
      <Route path="/students"            element={<P><StudentList /></P>} />
      <Route path="/students/add"        element={<P><StudentForm /></P>} />
      <Route path="/students/edit/:id"   element={<P><StudentForm /></P>} />
      <Route path="/students/:id"        element={<P><StudentProfile /></P>} />

      {/* Inventory */}
      <Route path="/inventory/products"      element={<P><ProductList /></P>} />
      <Route path="/inventory/categories"    element={<P><Categories /></P>} />
      <Route path="/inventory/purchases"     element={<P><PurchaseEntry /></P>} />
      <Route path="/inventory/issue"         element={<P><IssueInventory /></P>} />
      <Route path="/inventory/issue-history" element={<P><IssueHistory /></P>} />
      <Route path="/inventory/stock"         element={<P><StockReport /></P>} />

      {/* Billing */}
      <Route path="/billing/invoices"         element={<P><InvoiceList /></P>} />
      <Route path="/billing/invoices/create"  element={<P><CreateInvoice /></P>} />
      <Route path="/billing/invoices/:id"     element={<P><InvoiceDetail /></P>} />
      <Route path="/billing/fees"             element={<P><FeeManagement /></P>} />

      {/* Staff */}
      <Route path="/staff"           element={<P><StaffList /></P>} />
      <Route path="/staff/add"       element={<P><StaffForm /></P>} />
      <Route path="/staff/edit/:id"  element={<P><StaffForm /></P>} />

      {/* Accounting */}
      <Route path="/accounting/ledger"   element={<P><Ledger /></P>} />
      <Route path="/accounting/daybook"  element={<P><DayBook /></P>} />
      <Route path="/accounting/cashbook" element={<P><CashBook /></P>} />
      <Route path="/accounting/payments" element={<P><Payments /></P>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
