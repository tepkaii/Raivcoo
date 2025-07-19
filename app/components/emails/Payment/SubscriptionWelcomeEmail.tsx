import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface SubscriptionWelcomeEmailProps {
  customerName: string;
  customerEmail: string;
  planName: string;
  planId: string;
  storageGb?: number;
  billingPeriod: string;
  periodEnd: string;
  isUpgrade?: boolean;
}

export const SubscriptionWelcomeEmail = ({
  customerName,
  customerEmail,
  planName,
  planId,
  storageGb,
  billingPeriod,
  periodEnd,
  isUpgrade = false,
}: SubscriptionWelcomeEmailProps) => {
  const previewText = isUpgrade
    ? `Your ${planName} plan upgrade is now active!`
    : `Welcome to ${planName} plan!`;

  const features = {
    free: [
      "500MB storage",
      "200MB max upload",
      "2 active projects",
      "2 members per project",
      "Pin & Draw Annotations",
      "Email support",
    ],
    lite: [
      "Up to 150GB flexible storage",
      "2GB max upload size",
      "5 active projects",
      "5 members per project",
      "Password protection for links",
      "Custom expiration dates",
      "Download controls",
    ],
    pro: [
      "Up to 2TB flexible storage",
      "5GB max upload size",
      "Unlimited projects",
      "Unlimited members",
      "Password protection for links",
      "Custom expiration dates",
      "Download controls",
      "Priority support",
    ],
  };

  const planFeatures = features[planId as keyof typeof features] || [];

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[600px]">
            <Section className="mt-[32px]">
              <Img
                src="https://i.ibb.co/nN3yWjtR/sfe-Comp-1-2025-06-26-01-33-39.png"
                width="40"
                height="40"
                alt="Raivcoo Logo"
                className="my-0 mx-auto"
              />
            </Section>

            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              {isUpgrade ? `🎉 Plan Upgraded!` : `🎉 Welcome to Raivcoo!`}
            </Heading>

            <Text className="text-black text-[16px] leading-[24px]">
              Hi {customerName || customerEmail.split("@")[0]},
            </Text>

            <Text className="text-black text-[14px] leading-[24px]">
              {isUpgrade
                ? `Your account has been successfully upgraded to the ${planName} plan!`
                : `Welcome to Raivcoo! Your ${planName} plan is now active and ready to use.`}
            </Text>

            {/* Plan Details */}
            <Section className="bg-[#f6f9fc] rounded-lg p-[24px] my-[24px]">
              <Heading className="text-[18px] font-semibold text-black m-0 mb-[16px]">
                Your {planName} Plan
              </Heading>

              <Text className="text-[14px] text-black m-0 mb-[8px]">
                <strong>Storage:</strong>{" "}
                {storageGb ? `${storageGb}GB` : "500MB"}
              </Text>
              <Text className="text-[14px] text-black m-0 mb-[8px]">
                <strong>Billing:</strong>{" "}
                {billingPeriod === "yearly" ? "Annual" : "Monthly"}
              </Text>
              <Text className="text-[14px] text-black m-0 mb-[16px]">
                <strong>Valid until:</strong>{" "}
                {new Date(periodEnd).toLocaleDateString()}
              </Text>

              <Heading className="text-[16px] font-semibold text-black m-0 mb-[12px]">
                What's included:
              </Heading>

              {planFeatures.map((feature, index) => (
                <Text
                  key={index}
                  className="text-[14px] text-black m-0 mb-[4px]"
                >
                  ✓ {feature}
                </Text>
              ))}
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#0070F3] rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3 mr-[16px]"
                href={`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`}
              >
                Start Creating
              </Button>
              <Button
                className="border border-[#0070F3] rounded text-[#0070F3] text-[14px] font-semibold no-underline text-center px-6 py-3"
                href={`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings`}
              >
                Manage Plan
              </Button>
            </Section>

            <Text className="text-black text-[14px] leading-[24px]">
              Ready to get started? Here are some quick tips:
            </Text>

            <Section className="bg-[#fafafa] rounded-lg p-[16px] my-[16px]">
              <Text className="text-[14px] text-black m-0 mb-[8px]">
                📁 <strong>Create your first project</strong> - Upload videos,
                images, or documents
              </Text>
              <Text className="text-[14px] text-black m-0 mb-[8px]">
                👥 <strong>Invite team members</strong> - Collaborate with
                colleagues and clients
              </Text>
              <Text className="text-[14px] text-black m-0 mb-[8px]">
                💬 <strong>Add comments</strong> - Use timestamped feedback and
                annotations
              </Text>
              {(planId === "lite" || planId === "pro") && (
                <Text className="text-[14px] text-black m-0 mb-[8px]">
                  🔒 <strong>Share securely</strong> - Password protect and set
                  expiration dates
                </Text>
              )}
              {planId === "pro" && (
                <Text className="text-[14px] text-black m-0">
                  🏆 <strong>Priority support</strong> - Get faster help when
                  you need it
                </Text>
              )}
            </Section>

            <Text className="text-black text-[14px] leading-[24px]">
              Questions? Our team is here to help at{" "}
              <Link
                href="mailto:support@raivcoo.com"
                className="text-blue-600 no-underline"
              >
                support@raivcoo.com
              </Link>
            </Text>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This email was sent to {customerEmail}. You can manage your
              subscription and billing settings in your{" "}
              <Link
                href={`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings`}
                className="text-blue-600 no-underline"
              >
                account settings
              </Link>
              .
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default SubscriptionWelcomeEmail;