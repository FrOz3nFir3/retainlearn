import { Link } from "react-router-dom";

const AuthAgreementNotice = () => {
  return (
    <p className="text-center text-xs text-gray-500 dark:text-white/40 leading-relaxed">
      By continuing, you agree to our{" "}
      <Link
        to="/terms"
        className="font-medium text-brand-primary dark:text-brand-accent hover:underline"
      >
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link
        to="/privacy"
        className="font-medium text-brand-primary dark:text-brand-accent hover:underline"
      >
        Privacy Policy
      </Link>
      .
    </p>
  );
};

export default AuthAgreementNotice;
