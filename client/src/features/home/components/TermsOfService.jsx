import LegalLayout from "./LegalLayout";

const TermsOfService = () => {
  return (
    <LegalLayout title="Terms of Service" eyebrow="Legal · Terms" lastUpdated="April 23, 2026">
      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using RetainLearn, you agree to be bound by these Terms of Service and all applicable laws and regulations. RetainLearn is a service provided and maintained by Kush Surti ("the Developer"). If you do not agree with any of these terms, please do not use the service.
        </p>
      </section>

      <section>
        <h2>2. Eligibility</h2>
        <p>
          You must be at least 13 years of age to use the service. By agreeing to these Terms, you represent and warrant that you are at least 13 years of age and that your use of the service complies with all applicable laws and regulations.
        </p>
      </section>

      <section>
        <h2>3. Description of Service</h2>
        <p>
          RetainLearn is an open-source spaced repetition and flashcard platform. The service is provided on an "as is" and "as available" basis. The Developer reserves the right to modify, suspend, or discontinue the service at any time without prior notice.
        </p>
      </section>

      <section>
        <h2>4. A Free, Community-Maintained Project</h2>
        <p>
          RetainLearn is a free service offered to the learning community at no cost. There are no paid tiers, subscriptions, or premium features — every feature is available to every account. The platform is built and maintained by an individual developer in their own time, and the source code is released under the Unlicense (public domain) so anyone can run, modify, or self-host it.
        </p>
        <p>
          Because the service is operated as a personal project, it does not come with formal service-level guarantees, dedicated support staff, or commitments around uptime, response times, or feature availability. We will do our best to keep the service running smoothly, fix issues that are reported, and respond to questions, but you should treat the service accordingly when deciding what content to store on it. We strongly recommend keeping your own backups of any content that matters to you.
        </p>
      </section>

      <section>
        <h2>5. User Accounts</h2>
        <p>
          To access certain features, you must register for an account using either an email and password or Google sign-in. You agree that the information you provide is accurate and that you will keep it up-to-date. You are solely responsible for maintaining the confidentiality of your account and for all activities that occur under it.
        </p>
      </section>

      <section>
        <h2>6. User-Generated Content</h2>
        <p>
          You retain all rights to the content you create on RetainLearn — flashcards, categories, quizzes, descriptions, and other study material. By submitting content to the service, you grant the Developer a non-exclusive, royalty-free license to host, store, and display that content solely for the purpose of operating the service for you.
        </p>
      </section>

      <section>
        <h2>7. Prohibited Conduct</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the service for any illegal purpose or in violation of applicable laws.</li>
          <li>Infringe or misappropriate any third-party intellectual property right through content you create or share.</li>
          <li>Interfere with or disrupt the service, including by uploading malicious code or attempting to circumvent security or authentication mechanisms.</li>
          <li>Perform automated scraping or bulk data collection without prior written authorization.</li>
        </ul>
      </section>

      <section>
        <h2>8. Intellectual Property</h2>
        <p>
          The project's source code is publicly available on GitHub and released under the Unlicense (public domain). However, the name "RetainLearn", its logo, and brand assets remain the property of the Developer and may not be used in a manner that suggests endorsement or affiliation without permission.
        </p>
      </section>

      <section>
        <h2>9. Disclaimer of Warranties</h2>
        <p className="legal-callout">
          The service and all materials available through it are provided "as is" and "as available". The Developer disclaims all warranties of any kind, whether express or implied, including warranties of merchantability, fitness for a particular purpose, title, and non-infringement.
        </p>
      </section>

      <section>
        <h2>10. Limitation of Liability</h2>
        <p className="legal-callout">
          In no event will the Developer be liable for any indirect, incidental, special, consequential, or punitive damages — including loss of profits, data, or goodwill — arising out of or relating to your use of, or inability to use, the service.
        </p>
      </section>

      <section>
        <h2>11. Termination</h2>
        <p>
          The Developer may suspend or terminate access to the service at any time, with or without notice, for conduct that violates these Terms or that may harm other users or the operation of the service.
        </p>
      </section>

      <section>
        <h2>12. Governing Law</h2>
        <p>
          These Terms are governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts located in India.
        </p>
      </section>

      <section>
        <h2>13. Changes to These Terms</h2>
        <p>
          These Terms may be updated from time to time. The "Last updated" date at the top of this page reflects the most recent revision. Continued use of the service after changes are posted constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section>
        <h2>14. Contact</h2>
        <p>
          For questions about these Terms, reach out at{" "}
          <a href="mailto:hello@retainlearn.com">hello@retainlearn.com</a>.
        </p>
      </section>
    </LegalLayout>
  );
};

export default TermsOfService;
