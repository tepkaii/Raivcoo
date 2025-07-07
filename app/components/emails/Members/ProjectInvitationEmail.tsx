// emails/ProjectInvitationEmail.tsx
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

interface ProjectInvitationEmailProps {
  inviterName: string;
  inviterEmail: string;
  projectName: string;
  role: "viewer" | "reviewer" | "collaborator";
  inviteUrl: string;
  recipientEmail: string;
}

const roleDescriptions = {
  viewer: "view content",
  reviewer: "view content and add comments",
  collaborator: "full project access except member management",
};

export const ProjectInvitationEmail = ({
  inviterName,
  inviterEmail,
  projectName,
  role,
  inviteUrl,
  recipientEmail,
}: ProjectInvitationEmailProps) => {
  const previewText = `You've been invited to collaborate on ${projectName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Img
                src="https://i.ibb.co/nN3yWjtR/sfe-Comp-1-2025-06-26-01-33-39.png" // Replace with your logo
                width="40"
                height="40"
                alt="Your App Logo"
                className="my-0 mx-auto"
              />
            </Section>
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              You're invited to collaborate on <strong>{projectName}</strong>
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello,
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              <strong>{inviterName}</strong> ({inviterEmail}) has invited you to
              join the project <strong>{projectName}</strong> as a{" "}
              <strong>{role}</strong>.
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              As a {role}, you'll be able to{" "}
              <strong>{roleDescriptions[role]}</strong>.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#0070F3] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={inviteUrl}
              >
                Accept Invitation
              </Button>
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              Or copy and paste this URL into your browser:{" "}
              <Link href={inviteUrl} className="text-blue-600 no-underline">
                {inviteUrl}
              </Link>
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This invitation was intended for{" "}
              <span className="text-black">{recipientEmail}</span>. If you were
              not expecting this invitation, you can ignore this email. If you
              are concerned about your account's safety, please contact support.
            </Text>
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This invitation will expire in 7 days.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ProjectInvitationEmail;
