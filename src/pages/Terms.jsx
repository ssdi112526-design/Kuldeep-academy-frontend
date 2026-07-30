import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { companyInfo } from '../data/akhada';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing or using the website or services of ${companyInfo.name} ("we", "us", "our"), you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, please do not use our website or services.`,
  },
  {
    title: '2. Our Services',
    body: 'We provide legally compliant vehicle and asset repossession, debt collection, and secure parking/yard services on behalf of banks, NBFCs, and financial institutions across India, in accordance with applicable RBI guidelines and lender agreements.',
  },
  {
    title: '3. Client & Lender Obligations',
    body: 'Any bank, NBFC, or financial institution engaging our services is responsible for providing accurate loan account details, valid seizure/repossession authorization, and all supporting documentation required for us to carry out recovery operations lawfully.',
  },
  {
    title: '4. Legal Compliance',
    body: 'All repossession and recovery operations are carried out in accordance with applicable Indian laws, RBI Fair Practices Code, and the terms of the underlying loan agreement. We maintain seizure memos, inventory records, and other documentation at every stage of the recovery process.',
  },
  {
    title: '5. Limitation of Liability',
    body: 'While we take reasonable care in every recovery operation, we are not liable for pre-existing damage, disputes arising from incomplete or inaccurate case documentation provided by the client, or circumstances beyond our reasonable control.',
  },
  {
    title: '6. Website Use',
    body: 'The content on this website is provided for general informational purposes only. We reserve the right to update or modify any content, including service descriptions and coverage areas, without prior notice.',
  },
  {
    title: '7. Contact Form Submissions',
    body: 'Information submitted through our website contact form is used solely to respond to your inquiry and, where relevant, to get in touch regarding our recovery and collection services. See our Privacy Policy for details on how we handle your data.',
  },
  {
    title: '8. Changes to These Terms',
    body: 'We may revise these Terms & Conditions from time to time. Continued use of our website after changes are posted constitutes acceptance of the revised terms.',
  },
  {
    title: '9. Contact Us',
    body: `For any questions about these Terms & Conditions, please contact us at ${companyInfo.email} or call ${companyInfo.phones.join(' / ')}.`,
  },
];

export default function Terms() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-ink">Terms &amp; Conditions</h1>
        <p className="mt-2 text-sm text-muted">Last updated: 23 July 2026</p>

        <div className="mt-8 space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-ink">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{section.body}</p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
