// app/components/emails/statusChangeEmail.tsx
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

interface StatusChangeEmailProps {
  recipientName: string;
  actorName: string;
  actorEmail: string;
  projectName: string;
  projectUrl: string;
  mediaName: string;
  mediaType: string;
  mediaSize: string;
  oldStatus: string;
  newStatus: string;
  oldStatusLabel: string;
  newStatusLabel: string;
  isOwner: boolean;
  isMyMedia: boolean;
  changedAt: string;
  // mediaPreviewUrl?: string; // REMOVED - no longer used
}

const getStatusColor = (status: string) => {
  const colors = {
    on_hold: "#6B7280", // gray-500
    in_progress: "#3B82F6", // blue-500
    needs_review: "#F59E0B", // yellow-500
    rejected: "#EF4444", // red-500
    approved: "#10B981", // green-500
  };
  return colors[status as keyof typeof colors] || "#6B7280";
};

const getStatusEmoji = (status: string) => {
  const emojis = {
    on_hold: "⏸️",
    in_progress: "🔄",
    needs_review: "👀",
    rejected: "❌",
    approved: "✅",
  };
  return emojis[status as keyof typeof emojis] || "📄";
};

const getActivityTitle = (props: StatusChangeEmailProps) => {
  const { isMyMedia, actorName, mediaName, newStatusLabel } = props;

  if (isMyMedia) {
    return `${getStatusEmoji(props.newStatus)} Your media "${mediaName}" status changed to ${newStatusLabel}`;
  } else {
    return `${getStatusEmoji(props.newStatus)} ${actorName} changed "${mediaName}" status to ${newStatusLabel}`;
  }
};

const getActivityDescription = (props: StatusChangeEmailProps) => {
  const {
    isMyMedia,
    actorName,
    projectName,
    mediaName,
    oldStatusLabel,
    newStatusLabel,
  } = props;

  if (isMyMedia) {
    return `Your media "${mediaName}" in ${projectName} has been updated from ${oldStatusLabel} to ${newStatusLabel}.`;
  } else {
    return `${actorName} has changed the status of "${mediaName}" from ${oldStatusLabel} to ${newStatusLabel} in ${projectName}.`;
  }
};

export const StatusChangeEmail = (props: StatusChangeEmailProps) => {
  const {
    recipientName,
    actorName,
    actorEmail,
    projectName,
    projectUrl,
    mediaName,
    mediaType,
    mediaSize,
    oldStatus,
    newStatus,
    oldStatusLabel,
    newStatusLabel,
    changedAt,
  } = props;

  const previewText = getActivityTitle(props);
  const activityTitle = getActivityTitle(props);
  const activityDescription = getActivityDescription(props);

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

            {/* Status Change Visual */}
            <Section className="my-[32px] text-center">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div
                    className="inline-block px-3 py-1 rounded-full text-white text-[12px] font-semibold mb-2"
                    style={{ backgroundColor: getStatusColor(oldStatus) }}
                  >
                    {oldStatusLabel}
                  </div>
                </div>
                <div className="text-[24px]">→</div>
                <div className="text-center">
                  <div
                    className="inline-block px-3 py-1 rounded-full text-white text-[12px] font-semibold mb-2"
                    style={{ backgroundColor: getStatusColor(newStatus) }}
                  >
                    {newStatusLabel}
                  </div>
                </div>
              </div>
            </Section>

            {/* Media Details - NO PREVIEW IMAGE */}
            <Section className="my-[32px]">
              <Text className="text-black text-[14px] leading-[24px] font-semibold mb-2">
                Media Details:
              </Text>
              <div className="mb-2">
                <Text className="text-black text-[12px] leading-[20px] bg-[#f6f6f6] p-2 rounded">
                  📄 {mediaName}
                  <span className="text-[#666666] ml-2">
                    ({mediaType} • {mediaSize})
                  </span>
                </Text>
              </div>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#0070F3] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={projectUrl}
              >
                View Project
              </Button>
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This notification was sent because you're a member of{" "}
              <strong>{projectName}</strong> and have notifications enabled for
              status changes.
            </Text>

            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Changed by: {actorName} ({actorEmail})
            </Text>

            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Changed on: {new Date(changedAt).toLocaleString()}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
