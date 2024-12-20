import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ProfilePage from "./pages/ProfilePage";
import FormsPage from "./pages/FormsPage";
import MembersPage from "./pages/MembersPage";
import { Toaster } from "sonner";
import FormDetailsPage from "./pages/form/FormDetailsPage";
import FormSubmissionPage from "./pages/form/FormSubmissionPage";

function App() {
  return (
    <>
      <Toaster position="bottom-right" richColors closeButton />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="forms" replace />} />
            <Route path="forms" element={<FormsPage />} />
            <Route path="forms/:formId" element={<FormDetailsPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route
            path="/form-submission/:linkId"
            element={<FormSubmissionPage />}
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
