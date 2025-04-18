export default function TermsPage() {
  return (
    <div className="container max-w-4xl py-12">
      <h1 className="text-4xl font-bold text-purple-600 mb-8">Terms and Conditions</h1>
      
      <div className="prose dark:prose-invert max-w-none">
        {/* Section 1 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <div className="space-y-4">
            {/* Add your paragraphs here */}
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. User Responsibilities</h2>
          <div className="space-y-4">
            {/* Add your paragraphs here */}
          </div>
        </section>

        {/* Section 3 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Content Guidelines</h2>
          <div className="space-y-4">
            {/* Add your paragraphs here */}
          </div>
        </section>

        {/* Section 4 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>
          <div className="space-y-4">
            {/* Add your paragraphs here */}
          </div>
        </section>

        {/* Section 5 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Privacy and Data Protection</h2>
          <div className="space-y-4">
            {/* Add your paragraphs here */}
          </div>
        </section>

        {/* Section 6 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
          <div className="space-y-4">
            {/* Add your paragraphs here */}
          </div>
        </section>

        {/* Section 7 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Changes to Terms</h2>
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