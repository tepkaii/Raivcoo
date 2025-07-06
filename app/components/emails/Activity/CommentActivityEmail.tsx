// components/emails/CommentActivityEmail.tsx
import {
  Body,
  Button,
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

interface CommentActivityEmailProps {
  recipientName: string;
  actorName: string;
  actorEmail?: string;
  projectName: string;
  projectUrl: string;
  activityType: "comment" | "reply";
  mediaName: string;
  commentContent: string;
  commentTimestamp?: number;
  isOwner: boolean;
  isReply: boolean;
  parentComment?: {
    content: string;
    authorName: string;
  };
  actedAt: string;
  // NEW: Review-specific props
  isReviewComment?: boolean;
  reviewToken?: string;
  isGuest?: boolean;
  isOutsider?: boolean;
  isReplyToMe?: boolean;
}

const getCommentActivityTitle = (props: CommentActivityEmailProps) => {
  const {
    activityType,
    isOwner,
    actorName,
    isReply,
    isReviewComment,
    isGuest,
    isOutsider,
    isReplyToMe,
  } = props;

  if (isReviewComment) {
    if (isReply) {
      if (isReplyToMe) {
        return `💬 ${actorName} replied to your comment`;
      } else if (isGuest || isOutsider) {
        return `💬 ${actorName} replied to a comment`;
      } else if (isOwner) {
        return `💬 ${actorName} replied to a comment in your project review`;
      } else {
        return `💬 ${actorName} replied to a comment in project review`;
      }
    } else {
      if (isOwner) {
        return `💬 ${actorName} commented on your project review`;
      } else {
        return `💬 ${actorName} added a comment to project review`;
      }
    }
  } else {
    // Original project workspace logic
    if (isReply) {
      if (isOwner) {
        return `💬 ${actorName} replied to a comment in your project`;
      } else {
        return `💬 ${actorName} replied to a comment`;
      }
    } else {
      if (isOwner) {
        return `💬 ${actorName} commented on your project`;
      } else {
        return `💬 ${actorName} added a comment`;
      }
    }
  }
};

const getCommentActivityDescription = (props: CommentActivityEmailProps) => {
  const {
    isOwner,
    actorName,
    projectName,
    mediaName,
    isReply,
    isReviewComment,
    isGuest,
    isOutsider,
    isReplyToMe,
  } = props;

  if (isReviewComment) {
    if (isReply) {
      if (isReplyToMe) {
        return `${actorName} replied to your comment on "${mediaName}" in the ${projectName} review.`;
      } else if (isGuest || isOutsider) {
        return `${actorName} replied to a comment on "${mediaName}" in the ${projectName} review.`;
      } else if (isOwner) {
        return `${actorName} replied to a comment on "${mediaName}" in your project ${projectName} review.`;
      } else {
        return `${actorName} replied to a comment on "${mediaName}" in the ${projectName} review.`;
      }
    } else {
      if (isOwner) {
        return `${actorName} left a comment on "${mediaName}" in your project ${projectName} review.`;
      } else {
        return `${actorName} commented on "${mediaName}" in the ${projectName} review.`;
      }
    }
  } else {
    // Original project workspace logic
    if (isReply) {
      if (isOwner) {
        return `${actorName} replied to a comment on "${mediaName}" in your project ${projectName}.`;
      } else {
        return `${actorName} replied to a comment on "${mediaName}" in ${projectName}.`;
      }
    } else {
      if (isOwner) {
        return `${actorName} left a comment on "${mediaName}" in your project ${projectName}.`;
      } else {
        return `${actorName} commented on "${mediaName}" in ${projectName}.`;
      }
    }
  }
};

const getRecipientContext = (props: CommentActivityEmailProps) => {
  const {
    isOwner,
    isGuest,
    isOutsider,
    isReviewComment,
    isReply,
    isReplyToMe,
  } = props;

  if (isReviewComment) {
    if (isGuest) {
      if (isReply && isReplyToMe) {
        return "You received this notification because someone replied to your comment in the review.";
      } else {
        return "You received this notification because you participated in this review.";
      }
    } else if (isOutsider) {
      if (isReply && isReplyToMe) {
        return "You received this notification because someone replied to your comment in the review.";
      } else {
        return "You received this notification because you participated in this review.";
      }
    } else if (isOwner) {
      return "You received this notification because this is your project review and you have notifications enabled.";
    } else {
      return "You received this notification because you're a member of this project and have notifications enabled for review comments.";
    }
  } else {
    // Original project workspace logic
    if (isOwner) {
      return `This notification was sent because you're the owner of ${props.projectName} and have notifications enabled for ${isReply ? "comment replies" : "new comments"}.`;
    } else {
      return `This notification was sent because you're a member of ${props.projectName} and have notifications enabled for ${isReply ? "comment replies" : "new comments"}.`;
    }
  }
};

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const getButtonText = (props: CommentActivityEmailProps) => {
  const { isReviewComment, isReply } = props;

  if (isReviewComment) {
    return isReply ? "View Review & Reply" : "View Review";
  } else {
    return isReply ? "View Project & Reply" : "View Project";
  }
};

const getContextIcon = (props: CommentActivityEmailProps) => {
  const { isReviewComment, isOwner, isGuest, isOutsider } = props;

  if (isReviewComment) {
    if (isGuest) return "👤";
    if (isOutsider) return "🔗";
    if (isOwner) return "👑";
    return "👥";
  } else {
    return isOwner ? "👑" : "👥";
  }
};

export const CommentActivityEmail = (props: CommentActivityEmailProps) => {
  const {
    recipientName,
    actorName,
    actorEmail,
    projectName,
    projectUrl,
    mediaName,
    commentContent,
    commentTimestamp,
    isReply,
    parentComment,
    actedAt,
    isReviewComment = false,
    reviewToken,
  } = props;

  const previewText = getCommentActivityTitle(props);
  const activityTitle = getCommentActivityTitle(props);
  const activityDescription = getCommentActivityDescription(props);
  const recipientContext = getRecipientContext(props);
  const buttonText = getButtonText(props);
  const contextIcon = getContextIcon(props);

  // Use review URL if this is a review comment
  const linkUrl =
    isReviewComment && reviewToken
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/review/${reviewToken}`
      : projectUrl;

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

            {/* Context Badge */}
            <Section className="my-[16px]">
              <div className="inline-flex items-center bg-[#f8f9fa] border border-[#e9ecef] rounded px-3 py-1">
                <Text className="text-[#666666] text-[12px] leading-[16px] m-0">
                  {contextIcon}{" "}
                  {isReviewComment ? "Review Comment" : "Project Comment"}
                </Text>
              </div>
            </Section>

            {/* Media Context */}
            <Section className="my-[32px]">
              <Text className="text-black text-[14px] leading-[24px] font-semibold mb-2">
                📄 Media: {mediaName}
              </Text>
              {commentTimestamp && (
                <Text className="text-[#666666] text-[12px] leading-[20px]">
                  🕐 At {formatTime(commentTimestamp)}
                </Text>
              )}
            </Section>

            {/* Parent Comment Context (for replies) */}
            {isReply && parentComment && (
              <Section className="my-[32px]">
                <Text className="text-black text-[14px] leading-[24px] font-semibold mb-2">
                  💬 Replying to:
                </Text>
                <div className="bg-[#f6f6f6] border-l-4 border-[#0070F3] p-3 rounded">
                  <Text className="text-[#333333] text-[12px] leading-[18px] font-semibold mb-1">
                    {parentComment.authorName}
                  </Text>
                  <Text className="text-[#333333] text-[12px] leading-[18px] italic">
                    "{parentComment.content}"
                  </Text>
                </div>
              </Section>
            )}

            {/* New Comment */}
            <Section className="my-[32px]">
              <Text className="text-black text-[14px] leading-[24px] font-semibold mb-2">
                {isReply ? "💬 Reply:" : "💬 Comment:"}
              </Text>
              <div className="bg-[#f0f9ff] border-l-4 border-[#0070F3] p-3 rounded">
                <Text className="text-[#333333] text-[12px] leading-[18px] font-semibold mb-1">
                  {actorName}
                </Text>
                <Text className="text-[#333333] text-[12px] leading-[18px]">
                  "{commentContent}"
                </Text>
              </div>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#0070F3] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={linkUrl}
              >
                {buttonText}
              </Button>
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            <Text className="text-[#666666] text-[12px] leading-[24px]">
              {recipientContext}
            </Text>

            {actorEmail && (
              <Text className="text-[#666666] text-[12px] leading-[24px]">
                {isReply ? "Reply" : "Comment"} by: {actorName} ({actorEmail})
              </Text>
            )}

            <Text className="text-[#666666] text-[12px] leading-[24px]">
              {isReply ? "Replied" : "Commented"} on:{" "}
              {new Date(actedAt).toLocaleString()}
            </Text>

            {/* Review-specific footer */}
            {isReviewComment && (
              <Section className="mt-[20px]">
                <Text className="text-[#666666] text-[10px] leading-[16px]">
                  💡 Tip:{" "}
                  {isReply
                    ? "You can continue the conversation by clicking the button above."
                    : "You can reply to this comment by clicking the button above."}
                </Text>
              </Section>
            )}

            {/* Unsubscribe hint for guests */}
            {isReviewComment && (props.isGuest || props.isOutsider) && (
              <Section className="mt-[20px]">
                <Text className="text-[#666666] text-[10px] leading-[16px]">
                  📧 As a {props.isGuest ? "guest" : "external"} reviewer,
                  you'll only receive notifications for replies to your
                  comments.
                </Text>
              </Section>
            )}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
