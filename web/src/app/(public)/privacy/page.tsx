import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "LeetLLM privacy policy covering account data, usage data, cookies, retention, and contact information.",
    alternates: {
        canonical: "/privacy",
    },
}

export default function PrivacyPage() {
    return (
        <div className="container mx-auto max-w-3xl px-4 py-16 sm:py-24">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground mb-10">Last updated: July 2026</p>

            <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground/80 text-sm leading-relaxed">
                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
                    <p>
                        When you create an account, we collect your email address and, optionally, your display
                        name. If you sign in through Google or Apple, we receive identity information that provider shares, which may include your email and public profile details.
                    </p>
                    <p className="mt-2">
                        When you use account learning tools, we store lesson and practice completion, learning
                        plan choices, bookmarks, lesson notes, and quiz results so they can sync across devices.
                        We also collect usage data such as pages visited and feature interactions to improve the Service.
                    </p>
                    <p className="mt-2">
                        If you enable lesson personalization, we store your teaching-style preferences, context
                        you enter about your experience, resume-derived learning context, and generated lesson
                        versions. Resume upload is optional.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
                    <p>We use your information to:</p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                        <li>Provide and maintain the Service</li>
                        <li>Manage your account and saved progress</li>
                        <li>Send you service-related communications</li>
                        <li>Improve and personalize your experience</li>
                        <li>Analyze usage patterns and optimize performance</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">3. Data Storage & Security</h2>
                    <p>
                        Account data is stored using Supabase with row-level security policies that restrict
                        each learner&apos;s saved study data to that account. Local study state may also be stored
                        in your browser until it syncs or you clear site data.
                    </p>
                    <p className="mt-2">
                        When you upload a resume for personalization, LeetLLM sends file bytes to Google&apos;s Gemini
                        API to extract teaching-relevant experience. LeetLLM doesn&apos;t store original resume bytes.
                        It stores only filename and derived learning context, which you can review and clear in
                        personalization settings.
                    </p>
                    <p className="mt-2">
                        When you personalize a lesson, LeetLLM sends lesson content and saved learner preferences
                        to OpenAI Codex first, with Google Gemini as fallback. Generated lessons remain private to
                        your account and can be reset from lesson controls.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">4. Third-Party Services</h2>
                    <p>We use the following third-party services:</p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                        <li><strong className="text-foreground">Supabase</strong>: Authentication and database</li>
                        <li><strong className="text-foreground">Google Cloud</strong>: Application hosting</li>
                        <li><strong className="text-foreground">Google</strong>: OAuth authentication, site analytics, and optional Gemini-powered resume and lesson personalization</li>
                        <li><strong className="text-foreground">OpenAI</strong>: Optional Codex-powered lesson personalization</li>
                        <li><strong className="text-foreground">Apple</strong>: OAuth authentication</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">5. Cookies</h2>
                    <p>
                        We use httpOnly cookies for session management. These are essential for authentication
                        and cannot be used to track you across other websites.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">6. Your Rights</h2>
                    <p>You have the right to:</p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                        <li>Access your personal data</li>
                        <li>Request correction of inaccurate data</li>
                        <li>Request deletion of your account and data</li>
                        <li>Export your data in a portable format</li>
                        <li>Clear resume-derived context and personalized lessons from personalization controls</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">7. Data Retention</h2>
                    <p>
                        We retain your data for as long as your account is active. If you delete your account,
                        we will remove your personal data within 30 days, except where required by law.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">8. Contact</h2>
                    <p>
                        For privacy-related questions, please contact us at{" "}
                        <span className="text-primary">privacy@leetllm.com</span>.
                    </p>
                </section>
            </div>
        </div>
    )
}
