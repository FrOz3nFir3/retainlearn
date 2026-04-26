const FieldCard = ({ icon: Icon, title, children }) => {
  return (
    <div className="group/field">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-7 h-7 rounded-lg bg-brand-surface dark:bg-brand-accent/10 flex items-center justify-center shrink-0">
          <Icon className="h-3.5 w-3.5 text-brand-primary dark:text-brand-accent" />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-white/35">
          {title}
        </p>
      </div>
      <div>{children}</div>
    </div>
  );
};

export default FieldCard;
