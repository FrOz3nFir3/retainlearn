import LegalLayout from "./LegalLayout";

const PrivacyPolicy = () => {
  return (
    <LegalLayout title="Privacy Policy" eyebrow="Legal · Privacy" lastUpdated="April 23, 2026">
      <section>
        <h2>1. Introduction</h2>
        <p>
          RetainLearn is a spaced repetition and flashcard service operated and maintained by Kush Surti ("the Developer"). We respect your privacy and take a deliberate, minimal approach to handling your data. This policy describes what we collect, how we use it, and the rights you have over it.
        </p>
      </section>

      <section>
        <h2>2. Data We Collect</h2>
        <ul>
          <li><strong>Identity data:</strong> your name and username.</li>
          <li><strong>Contact data:</strong> your email address, provided either at registration or via Google OAuth.</li>
          <li><strong>Authentication data:</strong> for password-based accounts, a salted hash of your password (we never store the password itself); for Google sign-in, a reference to your Google account ID. Sessions are maintained via signed, HTTP-only cookies.</li>
          <li><strong>Usage data:</strong> the flashcards, decks, quizzes, and review history you create on the platform, plus aggregated learning progress used to power features like spaced repetition and your profile.</li>
          <li><strong>Technical data:</strong> IP address, browser, and device information processed at the network edge by Cloudflare for security and abuse prevention.</li>
        </ul>
      </section>

      <section>
        <h2>3. How We Use Your Data</h2>
        <ul>
          <li>To create and authenticate your account.</li>
          <li>To provide the core service — saving your decks, computing spaced repetition schedules, and showing your progress.</li>
          <li>To display public profile information (username, public decks, public stats) only where you have made it public.</li>
          <li>To protect the service against abuse, brute-force login attempts, and DDoS via rate limiting and Cloudflare.</li>
        </ul>
        <p>
          We do <strong>not</strong> sell your data. We do not run third-party advertising trackers and we do not use your study content to train external models.
        </p>
      </section>

      <section>
        <h2>4. Cookies</h2>
        <p>
          RetainLearn uses a small number of cookies that are essential to the service:
        </p>
        <ul>
          <li><strong>Session cookies</strong> (signed, HTTP-only) — keep you logged in across requests.</li>
          <li><strong>CSRF token cookie</strong> — paired with a request header to prevent cross-site request forgery on state-changing API calls.</li>
        </ul>
        <p>
          We do not use analytics, advertising, or tracking cookies.
        </p>
      </section>

      <section>
        <h2>5. Data Storage and Security</h2>
        <ul>
          <li><strong>Authentication:</strong> passwords are hashed with bcrypt; Google OAuth users authenticate directly with Google and we never see their password.</li>
          <li><strong>Database:</strong> data is stored in MongoDB, hosted on an Oracle Cloud virtual machine.</li>
          <li><strong>Network:</strong> Cloudflare provides DDoS protection and SSL/TLS encryption for all traffic.</li>
          <li><strong>Access control:</strong> only the Developer has administrative access to the database, and only for service operation, debugging, and support.</li>
        </ul>
      </section>

      <section>
        <h2>6. Third Parties We Rely On</h2>
        <ul>
          <li><strong>Google</strong> — OAuth sign-in (only when you choose Google sign-in).</li>
          <li><strong>Oracle Cloud</strong> — server hosting.</li>
          <li><strong>Cloudflare</strong> — DNS, CDN, DDoS protection, and TLS termination.</li>
        </ul>
        <p>
          We share only the minimum information required for these services to function. We do not transfer or sell your personal data to any other party.
        </p>
      </section>

      <section>
        <h2>7. Your Rights</h2>
        <p>You can request to:</p>
        <ul>
          <li>Access a copy of the personal data we hold about you.</li>
          <li>Correct inaccurate or incomplete information.</li>
          <li>Delete your account and the personal data associated with it.</li>
          <li>Export your decks and study history in a portable format.</li>
        </ul>
        <p>
          To exercise any of these rights, email us using the address in the contact section below. We aim to respond within a reasonable timeframe.
        </p>
      </section>

      <section>
        <h2>8. Children's Privacy</h2>
        <p>
          RetainLearn is not directed to children under the age of 13 and we do not knowingly collect personal data from anyone under 13. If you believe a child under 13 has provided us with personal data, please contact us and we will delete it.
        </p>
      </section>

      <section>
        <h2>9. Changes to This Policy</h2>
        <p>
          This policy may be updated from time to time. The "Last updated" date at the top of this page indicates when the most recent change was made. Material changes will be reflected here, and continued use of the service after such changes constitutes acceptance.
        </p>
      </section>

      <section>
        <h2>10. Contact</h2>
        <p>
          Questions, requests, or concerns? Reach out at{" "}
          <a href="mailto:hello@retainlearn.com">hello@retainlearn.com</a>.
        </p>
      </section>
    </LegalLayout>
  );
};

export default PrivacyPolicy;
