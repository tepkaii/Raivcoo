// terms-of-service-realistic.tsx

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

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex justify-center bg-background">
      <main className="pb-12 md:pb-16 space-y-16 mt-32 container">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-normal tracking-tighter lg:text-5xl text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
            Terms of Service
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-2 px-4">
            Please read these terms carefully before using the Raivcoo platform
          </p>
          <div className="mt-4 text-sm text-muted-foreground">
            Last updated: 2025-07-18
          </div>
        </div>

        <Card className="mx-auto border-0 bg-transparent relative z-20 ">
          <CardContent className="p-4 sm:p-8 md:p-12">
            <div className="space-y-6 sm:space-y-8">
              <Section title="Acceptance of Terms" index={0}>
                <p className="text-muted-foreground">
                  By accessing and using Raivcoo, you agree to be bound by these
                  Terms of Service. If you do not agree with any part of these
                  terms, you may not use the platform. These terms constitute a
                  legally binding agreement between you and Raivcoo.
                </p>
              </Section>

              <Section title="Platform Overview" index={1}>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    Raivcoo provides a comprehensive media review system for
                    editors and clients to collaborate effectively. Our platform
                    features include:
                  </p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li>Timestamped commenting on videos and media</li>
                    <li>Live step tracking and project rounds</li>
                    <li>Pin and draw annotations for precise feedback</li>
                    <li>Secure media hosting on our cloud infrastructure</li>
                    <li>Project organization and team collaboration tools</li>
                  </ul>
                  <p>
                    All media files are hosted on secure cloud infrastructure,
                    ensuring reliable access and protection of your content.
                  </p>
                </div>
              </Section>

              <Section title="User Requirements" index={2}>
                <ul className="space-y-2 pl-6 list-disc text-muted-foreground">
                  <li>Users must be 13 years of age or older</li>
                  <li>You are responsible for maintaining account security</li>
                  <li>
                    Impersonation or unauthorized account sharing is prohibited
                  </li>
                  <li>You must provide accurate registration information</li>
                  <li>
                    One account per user unless authorized for business use
                  </li>
                </ul>
              </Section>

              <Section title="Media Hosting & Content Responsibility" index={3}>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    <strong>Our Hosting Service:</strong> All media files are
                    stored securely on our cloud infrastructure with
                    industry-standard security measures.
                  </p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li>
                      All videos, images, and documents must be legally owned or
                      licensed by you
                    </li>
                    <li>
                      We host and secure your media files on our cloud
                      infrastructure
                    </li>
                    <li>
                      Files are stored with industry-standard security practices
                    </li>
                    <li>You retain full ownership of your uploaded content</li>
                    <li>We do not claim rights to your media files</li>
                  </ul>
                  <p>
                    <strong>Content Standards:</strong> All uploaded content
                    must comply with applicable laws and our community
                    guidelines.
                  </p>
                </div>
              </Section>

              <Section title="Subscription & Billing" index={4}>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    <strong>Current Billing System:</strong> We currently
                    operate on a manual renewal system with no automatic
                    recurring charges.
                  </p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li>
                      All subscriptions currently require manual renewal before
                      expiration
                    </li>
                    <li>
                      No automatic billing or recurring payments at this time
                    </li>
                    <li>You control when and how to renew your subscription</li>
                    <li>We'll notify you before your subscription expires</li>
                    <li>Expired subscriptions can be renewed at any time</li>
                  </ul>
                  <p>
                    <strong>Future Updates:</strong> We may introduce automatic
                    renewal options in the future, which would be opt-in and
                    fully cancellable. Any changes to our billing system will be
                    communicated in advance.
                  </p>
                  <p>
                    <strong>Billing Periods:</strong> Choose monthly or yearly
                    billing with significant savings on yearly plans.
                  </p>
                </div>
              </Section>

              <Section title="Storage & Upload Limits" index={5}>
                <div className="text-muted-foreground space-y-3">
                  <p>Storage and upload limits vary by plan:</p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li>
                      <strong>Free Plan:</strong> 500MB storage, 200MB max
                      upload
                    </li>
                    <li>
                      <strong>Lite Plan:</strong> Flexible storage up to 150GB,
                      2GB max upload
                    </li>
                    <li>
                      <strong>Pro Plan:</strong> Flexible storage up to 2TB, 5GB
                      max upload
                    </li>
                  </ul>
                  <p>
                    Storage can be customized on paid plans, and you only pay
                    for what you need.
                  </p>
                </div>
              </Section>

              <Section title="Notifications & Communication" index={6}>
                <ul className="space-y-2 pl-6 list-disc text-muted-foreground">
                  <li>
                    Users receive email updates for project activity and reviews
                  </li>
                  <li>
                    Most project-based notifications can be customized or
                    disabled
                  </li>
                  <li>
                    Essential emails (login, security, billing) cannot be
                    disabled
                  </li>
                  <li>Email address changes require support verification</li>
                  <li>
                    We may send service announcements and platform updates
                  </li>
                </ul>
              </Section>

              <Section title="Adobe Extension Integration" index={7}>
                <p className="text-muted-foreground">
                  Our Adobe extension allows seamless integration with After
                  Effects and Premiere Pro. The extension uses the same
                  authentication system as our web platform and respects all
                  user permissions. No additional data is collected or stored
                  locally by the extension.
                </p>
              </Section>

              <Section title="Data Security & Protection" index={8}>
                <div className="text-muted-foreground space-y-3">
                  <p>We implement security measures to protect your data:</p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li>All data is encrypted in transit and at rest</li>
                    <li>Cloud storage with built-in redundancy</li>
                    <li>Access controls and authentication security</li>
                    <li>Regular security updates and maintenance</li>
                    <li>Best-effort data protection measures</li>
                  </ul>
                  <p>
                    <strong>Data Backup:</strong> While we implement best
                    practices for data protection, we recommend maintaining your
                    own backups of important files.
                  </p>
                </div>
              </Section>

              <Section title="Support & Response Times" index={9}>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    <strong>Support Availability:</strong> We provide support
                    via email and Discord.
                  </p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li>Support response time: 1-2 business days</li>
                    <li>
                      Available 7 days a week (response times may vary on
                      weekends)
                    </li>
                    <li>Priority support for Pro plan subscribers</li>
                    <li>Complex issues may require additional response time</li>
                  </ul>
                </div>
              </Section>

              <Section title="Account Management" index={10}>
                <ul className="space-y-2 pl-6 list-disc text-muted-foreground">
                  <li>Users may request account deletion at any time</li>
                  <li>Deleted accounts and data cannot be recovered</li>
                  <li>We recommend exporting your data before deletion</li>
                  <li>
                    Account termination for violations may result in permanent
                    bans
                  </li>
                  <li>Data export options available through support</li>
                </ul>
              </Section>

              <Section title="Refund Policy" index={11}>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    <strong>Refund Considerations:</strong> We evaluate refund
                    requests on a case-by-case basis.
                  </p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li>
                      Refunds considered for technical issues preventing service
                      use
                    </li>
                    <li>Billing errors will be corrected and refunded</li>
                    <li>
                      Unused subscription periods may be eligible for partial
                      refunds
                    </li>
                    <li>Refund requests must be submitted within 30 days</li>
                    <li>
                      Processing time for approved refunds: 5-10 business days
                    </li>
                  </ul>
                </div>
              </Section>

              <Section title="Limitation of Liability" index={12}>
                <p className="text-muted-foreground">
                  Raivcoo is provided "as is" without warranties of any kind.
                  Our liability is limited to the subscription amount paid in
                  the last 90 days. We are not liable for indirect, incidental,
                  or consequential damages. This includes but is not limited to
                  loss of data, business interruption, or loss of profits.
                </p>
              </Section>

              <Section title="Intellectual Property" index={13}>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    <strong>Your Content:</strong> You retain all rights to your
                    uploaded content.
                  </p>
                  <ul className="space-y-2 pl-6 list-disc">
                    <li>
                      You grant us only the technical rights necessary to
                      provide our service
                    </li>
                    <li>We do not claim ownership of your media files</li>
                    <li>
                      Our platform and software remain our intellectual property
                    </li>
                    <li>
                      Unauthorized use of our platform features is prohibited
                    </li>
                  </ul>
                </div>
              </Section>

              <Section title="Changes to Terms" index={14}>
                <p className="text-muted-foreground">
                  These terms may be updated as our platform evolves. Users will
                  be notified of significant changes via email and platform
                  announcements. Continued use of the platform after changes
                  constitutes acceptance of updated terms. Major changes will
                  include a notice period before taking effect.
                </p>
              </Section>

              <Section title="Contact Information" index={15}>
                <div className="text-muted-foreground">
                  <p>For questions, support, or legal matters:</p>
                  <ul className="space-y-2 pl-6 list-disc mt-3">
                    <li>Email: support@raivcoo.com</li>
                    <li>Team inquiries: team@raivcoo.com</li>
                  </ul>
                </div>
              </Section>
            </div>

            <div className="mt-12 text-center space-y-6">
              <p className="text-muted-foreground">
                Need help understanding our terms?
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

export default TermsOfService;
