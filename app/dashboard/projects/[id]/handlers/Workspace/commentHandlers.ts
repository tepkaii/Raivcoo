// CommentHandlers.ts
import { createCommentAction } from "../../lib/CommentActions";

export const createCommentHandlers = (projectId: string) => {
  const handleCreateComment = async (data: any) => {
    const result = await createCommentAction({
      projectId,
      mediaId: data.mediaId,
      content: data.content,
      timestampSeconds: data.timestampSeconds,
      parentCommentId: data.parentCommentId,
      annotationData: data.annotationData,
      drawingData: data.drawingData,
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    return result;
  };

  return {
    handleCreateComment,
  };
};
