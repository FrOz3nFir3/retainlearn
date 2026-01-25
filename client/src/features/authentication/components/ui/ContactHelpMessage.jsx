import React from 'react';

const ContactHelpMessage = () => {
  return (
    <div className="mt-3 p-3 bg-indigo-50/80 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/50 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col items-center justify-center text-center">
        <p className="text-sm text-indigo-900 dark:text-indigo-100 font-medium">
          Having difficulties?
        </p>
        <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
          We're here to help. Email us at{' '}
          <a
            href="mailto:hello@retainlearn.com"
            className="font-semibold underline decoration-indigo-400/50 hover:decoration-indigo-500 transition-all hover:text-indigo-900 dark:hover:text-white"
          >
            hello@retainlearn.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default ContactHelpMessage;
