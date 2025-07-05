// components/emails/MediaActivityEmail.tsx
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

interface MediaActivityEmailProps {
  recipientName: string;
  actorName: string;
  actorEmail: string;
  projectName: string;
  projectUrl: string;
  activityType: "upload" | "delete";
  mediaCount: number;
  mediaDetails: {
    name: string;
    type: string;
    size?: string;
  }[];
  isOwner: boolean;
  isMyMedia: boolean;
  actedAt: string;
  mediaPreviewUrl?: string;
}

const getActivityTitle = (props: MediaActivityEmailProps) => {
  const { activityType, isOwner, isMyMedia, actorName, mediaCount } = props;

  if (activityType === "upload") {
    if (isMyMedia) {
      return `✅ You uploaded ${mediaCount} ${mediaCount === 1 ? "file" : "files"}`;
    } else if (isOwner) {
      return `📁 ${actorName} uploaded ${mediaCount} ${mediaCount === 1 ? "file" : "files"} to your project`;
    } else {
      return `📁 ${actorName} uploaded ${mediaCount} ${mediaCount === 1 ? "file" : "files"}`;
    }
  } else {
    // delete
    if (isMyMedia) {
      return `🗑️ You deleted ${mediaCount} ${mediaCount === 1 ? "file" : "files"}`;
    } else if (isOwner) {
      return `🗑️ ${actorName} deleted ${mediaCount} ${mediaCount === 1 ? "file" : "files"} from your project`;
    } else {
      return `🗑️ ${actorName} deleted ${mediaCount} ${mediaCount === 1 ? "file" : "files"}`;
    }
  }
};

const getActivityDescription = (props: MediaActivityEmailProps) => {
  const {
    activityType,
    isOwner,
    isMyMedia,
    actorName,
    projectName,
    mediaCount,
  } = props;

  if (activityType === "upload") {
    if (isMyMedia) {
      return `Your ${mediaCount === 1 ? "file has" : "files have"} been successfully uploaded to ${projectName}. ${isOwner ? "Your team can now access the new content." : ""}`;
    } else if (isOwner) {
      return `${actorName} has uploaded ${mediaCount === 1 ? "a new file" : "new files"} to your project ${projectName}. You can review and manage the new content.`;
    } else {
      return `${actorName} has uploaded ${mediaCount === 1 ? "a new file" : "new files"} to ${projectName}. The content is now available for the team.`;
    }
  } else {
    // delete
    if (isMyMedia) {
      return `Your ${mediaCount === 1 ? "file has" : "files have"} been removed from ${projectName}. ${isOwner ? "The content is no longer available to your team." : ""}`;
    } else if (isOwner) {
      return `${actorName} has removed ${mediaCount === 1 ? "a file" : "files"} from your project ${projectName}. The content is no longer available.`;
    } else {
      return `${actorName} has removed ${mediaCount === 1 ? "a file" : "files"} from ${projectName}. The content is no longer available.`;
    }
  }
};

const getActionButtonText = (props: MediaActivityEmailProps) => {
  const { activityType, isOwner } = props;

  if (activityType === "upload") {
    return isOwner ? "Review New Content" : "View Project";
  } else {
    return "View Project";
  }
};

export const MediaActivityEmail = (props: MediaActivityEmailProps) => {
  const {
    recipientName,
    actorName,
    actorEmail,
    projectName,
    projectUrl,
    activityType,
    mediaCount,
    mediaDetails,
    actedAt,
    mediaPreviewUrl,
  } = props;

  const previewText = getActivityTitle(props);
  const activityTitle = getActivityTitle(props);
  const activityDescription = getActivityDescription(props);
  const actionButtonText = getActionButtonText(props);

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
              {activityTitle}
            </Heading>

            <Text className="text-black text-[14px] leading-[24px]">
              Hello {recipientName},
            </Text>

            <Text className="text-black text-[14px] leading-[24px]">
              {activityDescription}
            </Text>

            {/* Media Preview */}
            {mediaPreviewUrl && activityType === "upload" && (
              <Section className="text-center my-[32px]">
                <Img
                  src={mediaPreviewUrl}
                  width="200"
                  height="150"
                  alt="Media Preview"
                  className="rounded border border-solid border-[#eaeaea]"
                />
              </Section>
            )}

            {/* Media Details */}
            <Section className="my-[32px]">
              <Text className="text-black text-[14px] leading-[24px] font-semibold mb-2">
                {activityType === "upload"
                  ? "Uploaded Files:"
                  : "Deleted Files:"}
              </Text>
              {mediaDetails.slice(0, 3).map((media, index) => (
                <div key={index} className="mb-2">
                  <Text className="text-black text-[12px] leading-[20px] bg-[#f6f6f6] p-2 rounded">
                    📄 {media.name}
                    {media.size && (
                      <span className="text-[#666666] ml-2">
                        ({media.size})
                      </span>
                    )}
                  </Text>
                </div>
              ))}
              {mediaDetails.length > 3 && (
                <Text className="text-[#666666] text-[12px] leading-[20px]">
                  ... and {mediaDetails.length - 3} more{" "}
                  {mediaDetails.length - 3 === 1 ? "file" : "files"}
                </Text>
              )}
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#0070F3] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={projectUrl}
              >
                {actionButtonText}
              </Button>
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This notification was sent because you're a member of{" "}
              <strong>{projectName}</strong> and have notifications enabled for{" "}
              {activityType === "upload" ? "media uploads" : "media deletions"}.
            </Text>

            <Text className="text-[#666666] text-[12px] leading-[24px]">
              {activityType === "upload" ? "Uploaded" : "Deleted"} by:{" "}
              {actorName} ({actorEmail})
            </Text>

            <Text className="text-[#666666] text-[12px] leading-[24px]">
              {activityType === "upload" ? "Uploaded" : "Deleted"} on:{" "}
              {new Date(actedAt).toLocaleString()}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
