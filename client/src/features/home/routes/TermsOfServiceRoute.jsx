import React from "react";
import { Helmet } from "@dr.pogodin/react-helmet";
import TermsOfService from "../components/TermsOfService";

const TermsOfServiceRoute = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service | RetainLearn</title>
        <meta
          name="description"
          content="Terms of Service for RetainLearn. Understand our platform rules and user responsibilities."
        />
      </Helmet>
      <TermsOfService />
    </>
  );
};

export default TermsOfServiceRoute;
