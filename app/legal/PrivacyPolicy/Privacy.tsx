// privacy-policy-realistic.tsx

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SectionProps {
  title: string;
  children: React.ReactNode;
  index: number;
}

const Section = ({ title, children, index }: SectionProps) => (
  <div className="rounded-lg p-4 sm:p-6 md:p-8 duration-300 bg-card/50 backdrop-blur-lg border border-border ">
    <div className="flex items-center gap-3 mb-4 sm:mb-6">
      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-primary font-semibold text-base sm:text-lg">
          {index + 1}
        </span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-semibold text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
        {title}
      </h2>
    </div>
    <div className="prose prose-gray dark:prose-invert max-w-none prose-base sm:prose-lg">
      {children}
    </div>
  </div>
);

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex justify-center bg-background">
      <main className="pb-12 md:pb-16 space-y-16 mt-32 container relative z-20">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-normal tracking-tighter lg:text-5xl text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
            Privacy Policy
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-2 px-4">
            How we collect, use, and protect your information
          </p>
          <div className="mt-4 text-sm text-muted-foreground">
            Last updated: 2025-07-18
          </div>
        </div>

        <Card className="mx-auto border-0 bg-transparent ">
          <CardContent className="p-4 sm:p-8 md:p-12">
            <div className="space-y-6 sm:space-y-8">
              <Section title="Information We Collect" index={0}>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    We collect information to provide and improve our media
                    review services:
                  </p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li>
                      <strong>Account Information:</strong> Name, email address,
                      and profile details
                    </li>
                    <li>
                      <strong>Authentication Data:</strong> OAuth tokens or
                      email verification records
                    </li>
                    <li>
                      <strong>Project Data:</strong> Media files, comments,
                      annotations, and project metadata
                    </li>
                    <li>
                      <strong>Usage Analytics:</strong> Platform usage patterns
                      to improve performance
                    </li>
                    <li>
                      <strong>Technical Data:</strong> IP addresses, browser
                      information, and device details
                    </li>
                    <li>
                      <strong>Communication Records:</strong> Support tickets
                      and user correspondence
                    </li>
                  </ul>
                </div>
              </Section>

              <Section title="Media Storage & Handling" index={1}>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    <strong>Our Storage System:</strong> All media files are
                    stored securely on our cloud infrastructure.
                  </p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li>
                      Files are hosted on secure cloud storage with encryption
                    </li>
                    <li>Access is restricted to authorized users only</li>
                    <li>We implement industry-standard security practices</li>
                    <li>Files are stored for the duration of your account</li>
                    <li>Backup systems help protect against data loss</li>
                  </ul>
                  <p>
                    <strong>Media Deletion Policy:</strong> When you delete
                    media files, folders, or projects, they are permanently
                    removed immediately. In the future, we may implement a
                    temporary backup system with standard retention periods
                    before final deletion.
                  </p>
                </div>
              </Section>

              <Section title="How We Use Your Information" index={2}>
                <div className="text-muted-foreground space-y-3">
                  <p>We use your information to:</p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li>Provide and maintain our media review services</li>
                    <li>Process and store your uploaded media files</li>
                    <li>Send project notifications and platform updates</li>
                    <li>Provide customer support and technical assistance</li>
                    <li>Improve our platform features and user experience</li>
                    <li>Ensure platform security and prevent abuse</li>
                    <li>Process payments and manage subscriptions</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </div>
              </Section>

              <Section title="Email Communications" index={3}>
                <div className="text-muted-foreground space-y-3">
                  <p>We send several types of emails:</p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li>
                      <strong>Project Notifications:</strong> Comments, file
                      uploads, and review updates
                    </li>
                    <li>
                      <strong>Account Security:</strong> Login alerts and
                      security notifications
                    </li>
                    <li>
                      <strong>Billing Updates:</strong> Subscription renewals
                      and payment confirmations
                    </li>
                    <li>
                      <strong>Platform Announcements:</strong> New features and
                      important updates
                    </li>
                    <li>
                      <strong>Support Communications:</strong> Responses to your
                      inquiries
                    </li>
                    <li>
                      <strong>Inactivity Notifications:</strong> Warnings about
                      potential media file deletion due to account inactivity
                    </li>
                  </ul>
                  <p>
                    <strong>Email Preferences:</strong> You can customize most
                    notification settings in your account dashboard. Essential
                    security, billing, and account-related emails cannot be
                    disabled for security reasons.
                  </p>
                </div>
              </Section>

              <Section title="Data Sharing & Third Parties" index={4}>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    We do not sell your personal information. We may share data
                    with:
                  </p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li>
                      <strong>Service Providers:</strong> Cloud hosting, payment
                      processing, and email services
                    </li>
                    <li>
                      <strong>Legal Requirements:</strong> When required by law
                      or to protect our rights
                    </li>
                    <li>
                      <strong>With Your Consent:</strong> When you explicitly
                      authorize sharing
                    </li>
                  </ul>
                  <p>
                    <strong>Third-Party Services:</strong> We use reputable
                    third-party services for hosting, payments, and analytics.
                    These services have their own privacy policies and security
                    measures.
                  </p>
                </div>
              </Section>

              <Section title="Adobe Extension Privacy" index={5}>
                <div className="text-muted-foreground space-y-3">
                  <p>Our Adobe extension integration:</p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li>Uses the same authentication as our web platform</li>
                    <li>Does not collect additional personal data</li>
                    <li>Respects all existing privacy settings</li>
                    <li>Syncs only project data you explicitly access</li>

                    <li>
                      Subject to Adobe's own privacy policies for extension
                      distribution
                    </li>
                  </ul>
                </div>
              </Section>

              <Section title="Your Privacy Rights" index={6}>
                <div className="text-muted-foreground space-y-3">
                  <p>You have the right to:</p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li>
                      <strong>Access:</strong> Request information about data we
                      collect
                    </li>
                    <li>
                      <strong>Correct:</strong> Update inaccurate information in
                      your profile
                    </li>
                    <li>
                      <strong>Delete:</strong> Request account and data deletion
                    </li>
                    <li>
                      <strong>Export:</strong> Contact support to request copies
                      of your project data (manual process)
                    </li>
                    <li>
                      <strong>Restrict:</strong> Limit certain types of data
                      processing
                    </li>
                    <li>
                      <strong>Object:</strong> Opt out of non-essential data
                      processing
                    </li>
                  </ul>
                  <p>
                    <strong>Exercising Your Rights:</strong> Contact us at
                    support@raivcoo.com to exercise any of these rights. We'll
                    respond within 1-2 business days and fulfill requests within
                    30 days when possible.
                  </p>
                </div>
              </Section>

              <Section title="Data Security" index={7}>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    We implement reasonable security measures to protect your
                    data:
                  </p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li>Encryption of data in transit and at rest</li>
                    <li>Secure authentication systems</li>
                    <li>Regular security updates and maintenance</li>
                    <li>Access controls and permission systems</li>
                    <li>Monitoring for suspicious activities</li>
                  </ul>
                  <p>
                    <strong>Important:</strong> While we implement security best
                    practices, no system is 100% secure. We recommend using
                    strong passwords and keeping your account information
                    confidential.
                  </p>
                </div>
              </Section>

              <Section
                title="Media File Retention & Inactive Account Policy"
                index={8}
              >
                <div className="text-muted-foreground space-y-3">
                  <p>We retain your data as follows:</p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li>
                      <strong>Active Accounts:</strong> All data retained while
                      your account is active
                    </li>
                    <li>
                      <strong>Deleted Accounts:</strong> All account data and
                      media files removed within 30 days
                    </li>
                    <li>
                      <strong>Legal Requirements:</strong> Some data may be
                      retained longer if required by law
                    </li>
                    <li>
                      <strong>Analytics Data:</strong> Anonymized usage data may
                      be retained for longer periods
                    </li>
                  </ul>

                  <p>
                    <strong>
                      Media File Deletion Policy for Inactive Accounts:
                    </strong>
                  </p>
                  <p>
                    <em>
                      Note: This policy affects only media files (videos,
                      images, documents, audio files). Your account information
                      and project metadata remain intact.
                    </em>
                  </p>

                  <div className="bg-muted/50 p-4 rounded-lg mt-4">
                    <p className="font-medium mb-2">Free Plan Users:</p>
                    <ul className="space-y-1 pl-4 list-disc text-sm">
                      <li>
                        Media deletion process begins after extended periods of
                        account inactivity
                      </li>
                      <li>
                        Multiple email notifications will be sent before any
                        deletion occurs
                      </li>
                      <li>
                        Each email clearly states your current status and
                        timeline
                      </li>
                      <li>
                        You can prevent deletion by simply logging into your
                        account
                      </li>
                    </ul>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg mt-4">
                    <p className="font-medium mb-2">Paid Plan Users:</p>
                    <ul className="space-y-1 pl-4 list-disc text-sm">
                      <li>
                        Media deletion process begins only after subscription
                        expires
                      </li>
                      <li>
                        Additional grace period provided after subscription end
                        date
                      </li>
                      <li>
                        Multiple email notifications sent throughout the process
                      </li>
                      <li>Extended warning period before final deletion</li>
                      <li>
                        Can prevent deletion by renewing subscription or logging
                        in
                      </li>
                    </ul>
                  </div>

                  <p className="mt-4">
                    <strong>Email Notification Process:</strong> All users
                    receive:
                  </p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li>Initial warning emails about account inactivity</li>
                    <li>
                      Regular status updates showing current stage in the
                      process
                    </li>
                    <li>Clear timelines and deadlines for each stage</li>
                    <li>Instructions on how to prevent media deletion</li>
                    <li>Final warning emails before permanent deletion</li>
                  </ul>

                  <p className="mt-4">
                    <strong>Important:</strong> Media files deleted due to
                    inactivity cannot be recovered. You can prevent deletion at
                    any time by logging into your account. Account information
                    and project structure remain intact even if media files are
                    deleted.
                  </p>
                </div>
              </Section>

              <Section title="Cookies & Tracking" index={9}>
                <div className="text-muted-foreground space-y-3">
                  <p>We use cookies and similar technologies for:</p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li>Authentication and session management</li>
                    <li>User preferences and settings</li>
                    <li>Analytics and performance monitoring</li>
                    <li>Security and fraud prevention</li>
                  </ul>
                  <p>
                    You can control cookies through your browser settings, but
                    some features may not work properly if cookies are disabled.
                  </p>
                </div>
              </Section>

              <Section title="International Data Transfers" index={10}>
                <p className="text-muted-foreground">
                  Our services may involve transferring your data to servers in
                  different countries. We ensure appropriate safeguards are in
                  place for international transfers, including using reputable
                  cloud providers with strong security practices and compliance
                  certifications.
                </p>
              </Section>

              <Section title="Children's Privacy" index={11}>
                <p className="text-muted-foreground">
                  Our platform is not intended for children under 13 years of
                  age. We do not knowingly collect personal information from
                  children under 13. If we learn that we have collected
                  information from a child under 13, we will delete that
                  information immediately. Parents who believe their child has
                  provided us with personal information should contact us at
                  support@raivcoo.com.
                </p>
              </Section>

              <Section title="Changes to Privacy Policy" index={12}>
                <p className="text-muted-foreground">
                  We may update this privacy policy from time to time to reflect
                  changes in our practices, technology, or legal requirements.
                  Significant changes will be communicated via email and
                  platform notifications. Your continued use of our platform
                  after changes constitutes acceptance of the updated policy. We
                  encourage you to review this policy periodically.
                </p>
              </Section>

              <Section title="Contact Us" index={13}>
                <div className="text-muted-foreground">
                  <p>For privacy-related questions, concerns, or requests:</p>
                  <ul className="space-y-2 pl-6 list-disc mt-3">
                    <li>Email: support@raivcoo.com</li>
                    <li>Team inquiries: team@raivcoo.com</li>
                  </ul>
                  <p className="mt-3">
                    <strong>Response Time:</strong> We aim to respond to privacy
                    inquiries within 1-2 business days and fulfill requests
                    within 30 days when possible.
                  </p>
                </div>
              </Section>
            </div>

            <div className="mt-12 text-center space-y-6">
              <p className="text-muted-foreground">
                Questions about your privacy?
              </p>
              <div className="flex flex-col items-center gap-4">
                <Link href="/support">
                  <Button variant="default" size="lg">
                    Contact Support
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <AnimatedGridPattern
        numSquares={60}
        maxOpacity={0.1}
        duration={3}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(1200px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-14%] h-[120%] skew-y-12"
        )}
      />
    </div>
  );
};

export default PrivacyPolicy;
