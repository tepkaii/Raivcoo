// components/emails/InvitationDeclinedEmail.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface InvitationDeclinedEmailProps {
  ownerName: string;
  memberEmail: string;
  projectName: string;
  role: "viewer" | "reviewer" | "collaborator";
  declinedAt: string;
}

const roleDescriptions = {
  viewer: "view content",
  reviewer: "view content and add comments",
  collaborator: "full project access except member management",
};

export const InvitationDeclinedEmail = ({
  ownerName,
  memberEmail,
  projectName,
  role,
  declinedAt,
}: InvitationDeclinedEmailProps) => {
  const previewText = `Invitation to ${projectName} was declined`;

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
              Invitation to <strong>{projectName}</strong> was declined
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello {ownerName},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              We wanted to let you know that <strong>{memberEmail}</strong> has
              declined your invitation to join the project{" "}
              <strong>{projectName}</strong> as a <strong>{role}</strong>.
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Don't worry - you can always invite them again later or invite
              someone else to collaborate on your project.
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This notification was sent because you invited {memberEmail} to
              join your project.
            </Text>
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Declined on: {new Date(declinedAt).toLocaleString()}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
