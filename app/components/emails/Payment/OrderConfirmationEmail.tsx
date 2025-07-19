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
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";

interface OrderConfirmationEmailProps {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  planName: string;
  planId: string;
  amount: number;
  storageGb?: number;
  billingPeriod: string;
  paymentMethod: string;
  transactionId: string;
  orderDate: string;
  action?: string;
}

export const OrderConfirmationEmail = ({
  customerName,
  customerEmail,
  orderNumber,
  planName,
  planId,
  amount,
  storageGb,
  billingPeriod,
  paymentMethod,
  transactionId,
  orderDate,
  action,
}: OrderConfirmationEmailProps) => {
  const previewText = `Order confirmation for ${planName} Plan - $${amount.toFixed(2)}`;

  const formatUploadSize = (planId: string) => {
    const uploadSizes = {
      free: "200MB",
      lite: "2GB",
      pro: "5GB",
    };
    return uploadSizes[planId as keyof typeof uploadSizes] || "Unknown";
  };

  const formatStorage = (storage?: number) => {
    if (!storage) return "N/A";
    if (storage < 1) return `${Math.round(storage * 1000)}MB`;
    return `${storage}GB`;
  };

  const getActionMessage = () => {
    switch (action) {
      case "upgrade":
        return "Your plan has been upgraded successfully!";
      case "downgrade":
        return "Your plan has been changed successfully!";
      case "renew":
        return "Your plan has been renewed successfully!";
      default:
        return "Welcome to Raivcoo! Your subscription is now active.";
    }
  };

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
              Payment Confirmed! 🎉
            </Heading>

            <Text className="text-black text-[16px] leading-[24px]">
              Hi {customerName || customerEmail.split("@")[0]},
            </Text>

            <Text className="text-black text-[14px] leading-[24px]">
              {getActionMessage()}
            </Text>

            {/* Order Summary */}
            <Section className="bg-[#f6f9fc] rounded-lg p-[24px] my-[24px]">
              <Heading className="text-[18px] font-semibold text-black m-0 mb-[16px]">
                Order Summary
              </Heading>

              <Row>
                <Column>
                  <Text className="text-[14px] text-[#666] m-0">
                    Order Number:
                  </Text>
                  <Text className="text-[14px] font-semibold text-black m-0 mb-[8px]">
                    #{orderNumber}
                  </Text>
                </Column>
                <Column>
                  <Text className="text-[14px] text-[#666] m-0">Date:</Text>
                  <Text className="text-[14px] font-semibold text-black m-0 mb-[8px]">
                    {orderDate}
                  </Text>
                </Column>
              </Row>

              <Hr className="border border-solid border-[#e6e6e6] my-[16px] mx-0 w-full" />

              <Row>
                <Column>
                  <Text className="text-[16px] font-semibold text-black m-0">
                    {planName} Plan -{" "}
                    {billingPeriod === "yearly" ? "1 Year" : "1 Month"}
                  </Text>
                  <Text className="text-[14px] text-[#666] m-0">
                    {formatStorage(storageGb)} storage •{" "}
                    {formatUploadSize(planId)} max upload
                  </Text>
                  {billingPeriod === "yearly" && (
                    <Text className="text-[12px] text-green-600 m-0 font-semibold">
                      30% yearly savings applied!
                    </Text>
                  )}
                </Column>
                <Column align="right">
                  <Text className="text-[18px] font-bold text-black m-0">
                    ${amount.toFixed(2)}
                  </Text>
                </Column>
              </Row>

              <Hr className="border border-solid border-[#e6e6e6] my-[16px] mx-0 w-full" />

              <Row>
                <Column>
                  <Text className="text-[14px] text-[#666] m-0">
                    Payment Method:
                  </Text>
                  <Text className="text-[14px] text-black m-0">
                    {paymentMethod}
                  </Text>
                </Column>
                <Column>
                  <Text className="text-[14px] text-[#666] m-0">
                    Transaction ID:
                  </Text>
                  <Text className="text-[12px] text-black m-0 font-mono">
                    {transactionId}
                  </Text>
                </Column>
              </Row>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#0070F3] rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3"
                href={`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`}
              >
                Go to Dashboard
              </Button>
            </Section>

            <Text className="text-black text-[14px] leading-[24px]">
              Your subscription is now active and you can start using all the
              features of your {planName} plan.
            </Text>

            <Text className="text-black text-[14px] leading-[24px]">
              Need help? Reply to this email or visit our{" "}
              <Link
                href={`${process.env.NEXT_PUBLIC_SITE_URL}/support`}
                className="text-blue-600 no-underline"
              >
                support center
              </Link>
              .
            </Text>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This email was sent to {customerEmail}. If you have any questions
              about this order, please contact us at support@raivcoo.com with
              your order number #{orderNumber}.
            </Text>

            <Text className="text-[#666666] text-[12px] leading-[24px]">
              © 2025 raivcoo. All rights reserved.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OrderConfirmationEmail;
