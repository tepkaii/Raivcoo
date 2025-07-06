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

interface MemberRemovedEmailProps {
  memberName: string;
  memberEmail: string;
  projectName: string;
  ownerName: string;
  removedAt: string;
  role: "viewer" | "reviewer" | "collaborator";
}

const roleDescriptions = {
  viewer: "view content",
  reviewer: "view content and add comments",
  collaborator: "full project access except member management",
};

export const MemberRemovedEmail = ({
  memberName,
  memberEmail,
  projectName,
  ownerName,
  removedAt,
  role,
}: MemberRemovedEmailProps) => {
  const previewText = `You have been removed from ${projectName}`;

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
              You have been removed from <strong>{projectName}</strong>
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello {memberName},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              We wanted to let you know that <strong>{ownerName}</strong> has
              removed you from the project <strong>{projectName}</strong>.
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              You previously had <strong>{role}</strong> access to this project,
              which allowed you to {roleDescriptions[role]}.
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              You will no longer have access to this project's content, files,
              or any related materials. If you believe this was done in error,
              please contact the project owner directly.
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This notification was sent because you were removed from the
              project by the project owner.
            </Text>
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Removed on: {new Date(removedAt).toLocaleString()}
            </Text>
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Project: {projectName}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
