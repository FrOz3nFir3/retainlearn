import React from 'react';

const ContactHelpMessage = () => {
  return (
    <div className="mt-3 p-3 bg-brand-surface dark:bg-white/5 rounded-lg border border-amber-200 dark:border-white/10 animate-fade-in">
      <div className="flex flex-col items-center justify-center text-center">
        <p className="text-sm text-gray-900 dark:text-white font-medium">
          Having difficulties?
        </p>
        <p className="text-xs text-gray-600 dark:text-white/60 mt-1">
          We're here to help. Email us at{' '}
          <a
            href="mailto:hello@retainlearn.com"
            className="font-semibold underline decoration-brand-accent/50 hover:decoration-brand-accent transition-all text-brand-primary dark:text-brand-accent hover:text-indigo-700 dark:hover:text-white"
          >
            hello@retainlearn.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default ContactHelpMessage;
