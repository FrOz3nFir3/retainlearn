import {
  PencilSquareIcon,
  TrashIcon,
  PlusCircleIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";

const LogItemChange = ({ change }) => {
  const getIcon = () => {
    if (change.field.includes("Deleted")) {
      return <TrashIcon className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />;
    }
    if (change.field.includes("New")) {
      return <PlusCircleIcon className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />;
    }
    if (change.field.includes("Order")) {
      return <ArrowsUpDownIcon className="w-3.5 h-3.5 text-brand-primary dark:text-brand-accent" />;
    }
    return <PencilSquareIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />;
  };

  const getBgColor = () => {
    if (change.field.includes("Deleted")) return "bg-red-50 dark:bg-red-500/10";
    if (change.field.includes("New")) return "bg-emerald-50 dark:bg-emerald-500/10";
    if (change.field.includes("Order")) return "bg-brand-surface dark:bg-white/8";
    return "bg-amber-50 dark:bg-amber-500/10";
  };

  return (
    <li className="bg-white dark:bg-white/5 rounded-lg p-3 border border-gray-100 dark:border-white/6">
      <div className="flex items-start gap-2.5">
        <div className="shrink-0 mt-0.5">
          <div className={`w-7 h-7 rounded-lg ${getBgColor()} flex items-center justify-center`}>
            {getIcon()}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <strong className="font-medium text-gray-800 dark:text-white/80 text-sm block">
            {change.field}
          </strong>
          {change.preview && (
            <p className="text-gray-500 dark:text-white/40 text-xs leading-relaxed wrap-break-word mt-0.5">
              {change.preview}
            </p>
          )}
        </div>
      </div>
    </li>
  );
};

export default LogItemChange;
