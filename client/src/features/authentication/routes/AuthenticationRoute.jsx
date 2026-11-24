import React, { Suspense, lazy } from "react";
import AuthenticationPageSkeleton from "../../../components/ui/skeletons/AuthenticationPageSkeleton";

const AuthenticationPage = lazy(() => import("./AuthenticationPage"));

// mode: "sign-in" or "sign-up", from the address (/sign-in, /sign-up), so each form has its own link (D-18).
const AuthenticationRoute = ({ mode }) => (
  <Suspense fallback={<AuthenticationPageSkeleton />}>
    <AuthenticationPage mode={mode} />
  </Suspense>
);

export default AuthenticationRoute;
