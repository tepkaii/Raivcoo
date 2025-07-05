// components/emails/InvitationAcceptedEmail.tsx
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

interface InvitationAcceptedEmailProps {
  ownerName: string;
  memberName: string;
  memberEmail: string;
  projectName: string;
  role: "viewer" | "reviewer" | "collaborator";
  projectUrl: string;
  acceptedAt: string;
}

const roleDescriptions = {
  viewer: "view content",
  reviewer: "view content and add comments",
  collaborator: "full project access except member management",
};

export const InvitationAcceptedEmail = ({
  ownerName,
  memberName,
  memberEmail,
  projectName,
  role,
  projectUrl,
  acceptedAt,
}: InvitationAcceptedEmailProps) => {
  const previewText = `${memberName} accepted your invitation to ${projectName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Img
                src="https://i.ibb.co/nN3yWjtR/sfe-Comp-1-2025-06-26-01-33-39.png"
                width="40"
                height="40"
                alt="Your App Logo"
                className="my-0 mx-auto"
              />
            </Section>
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              🎉 <strong>{memberName}</strong> accepted your invitation!
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello {ownerName},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Great news! <strong>{memberName}</strong> ({memberEmail}) has
              accepted your invitation to join the project{" "}
              <strong>{projectName}</strong> as a <strong>{role}</strong>.
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              As a {role}, they'll be able to{" "}
              <strong>{roleDescriptions[role]}</strong>.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#0070F3] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={projectUrl}
              >
                View Project
              </Button>
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              You can now collaborate with {memberName} on your project. Visit
              the project to see them in your team.
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This notification was sent because you invited {memberEmail} to
              join your project.
            </Text>
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Accepted on: {new Date(acceptedAt).toLocaleString()}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
