import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Terms of Service",
    description: "LeetLLM terms of service covering account use, educational content, intellectual property, liability, and contact information.",
    alternates: {
        canonical: "/terms",
    },
}

export default function TermsPage() {
    return (
        <div className="container mx-auto max-w-3xl px-4 py-16 sm:py-24">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Terms of Service</h1>
            <p className="text-muted-foreground mb-10">Last updated: February 2026</p>

            <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground/80 text-sm leading-relaxed">
                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using LeetLLM (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
                        If you do not agree to these terms, please do not use the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">2. Description of Service</h2>
                    <p>
                        LeetLLM provides educational content and interview preparation materials for artificial
                        intelligence and large language model engineering roles. The Service currently provides
                        open educational content, with optional accounts for progress tracking.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">3. User Accounts</h2>
                    <p>
                        You are responsible for maintaining the confidentiality of your account credentials and
                        for all activities that occur under your account. You agree to notify us immediately of
                        any unauthorized access or use of your account.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">4. Accounts and Access</h2>
                    <p>
                        Lessons are currently available to everyone. Creating an account is optional and is used for
                        saved progress, comments, and account-specific features.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">5. Intellectual Property</h2>
                    <p>
                        All content on LeetLLM, including questions, explanations, diagrams, and model answers,
                        is protected by copyright. You may not reproduce, distribute, or create derivative works
                        from our content without written permission.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">6. Limitation of Liability</h2>
                    <p>
                        LeetLLM provides educational content &quot;as is&quot; without warranties of any kind. We are not
                        responsible for interview outcomes, hiring decisions, or any reliance you place on the
                        content provided.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">7. Changes to Terms</h2>
                    <p>
                        We reserve the right to modify these terms at any time. Continued use of the Service
                        after changes constitutes acceptance of the new terms.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">8. Contact</h2>
                    <p>
                        For questions about these terms, please contact us at{" "}
                        <span className="text-primary">support@leetllm.com</span>.
                    </p>
                </section>
            </div>
        </div>
    )
}
