export default function GDPRPage() {
  return (
    <div className="container max-w-4xl py-12">
      <h1 className="text-4xl font-bold text-purple-600 mb-8">GDPR Policy</h1>
      
      <div className="prose dark:prose-invert max-w-none">
        {/* Section 1 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Data Collection and Processing</h2>
          <div className="space-y-4">
            {/* Add your paragraphs here */}
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Your Rights Under GDPR</h2>
          <div className="space-y-4">
            <ul className="list-disc pl-6 space-y-2">
              <li>Right to access your personal data</li>
              <li>Right to rectification</li>
              <li>Right to erasure ("right to be forgotten")</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object</li>
              <li>Rights related to automated decision making</li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Data Security</h2>
          <div className="space-y-4">
            {/* Add your paragraphs here */}
          </div>
        </section>

        {/* Section 4 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Data Retention</h2>
          <div className="space-y-4">
            {/* Add your paragraphs here */}
          </div>
        </section>

        {/* Section 5 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
          <div className="space-y-4">
            {/* Add your paragraphs here */}
          </div>
        </section>

        {/* Section 6 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Contact Information</h2>
          <div className="space-y-4">
            <p>
              For any GDPR-related inquiries or to exercise your rights, please contact our Data Protection Officer at:
            </p>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <p>Email: [Your DPO Email]</p>
              <p>Address: [Your Company Address]</p>
            </div>
          </div>
        </section>

        {/* Section 7 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Updates to This Policy</h2>
          <div className="space-y-4">
            {/* Add your paragraphs here */}
          </div>
        </section>

        {/* Last Updated */}
        <p className="text-sm text-muted-foreground mt-12">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  )
} 