import { Link } from "react-router-dom";
import RetainLearnLogo from "../../svg/RetainLearnLogo";

const HeaderLogo = ({ isTransparent }) => {
  return (
    <Link to="/" className="shrink-0 flex items-center gap-0.5 group">
      <RetainLearnLogo className="h-10 w-auto" />
      <span
        className={`text-base font-bold transition-colors duration-300 ${
          isTransparent
            ? "text-white group-hover:text-brand-accent"
            : "text-gray-900 dark:text-white group-hover:text-brand-primary dark:group-hover:text-brand-accent"
        }`}
      >
        RetainLearn
      </span>
    </Link>
  );
};

export default HeaderLogo;
