import React from "react";
import { Helmet } from "@dr.pogodin/react-helmet";
import PrivacyPolicy from "../components/PrivacyPolicy";

const PrivacyPolicyRoute = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | RetainLearn</title>
        <meta
          name="description"
          content="Privacy Policy for RetainLearn. Learn how we handle your data."
        />
      </Helmet>
      <PrivacyPolicy />
    </>
  );
};

export default PrivacyPolicyRoute;
