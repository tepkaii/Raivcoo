// app/dashboard/projects/[id]/handlers/Workspace/resizeHandlers.ts
import { useState, useCallback, useEffect } from "react";

export const createResizeHandlers = (
  isMobile: boolean,
  libraryWidth: number,
  playerWidth: number,
  commentsWidth: number,
  setLibraryWidth: (width: number) => void,
  setPlayerWidth: (width: number) => void,
  setCommentsWidth: (width: number) => void,
  showMediaLibrary: boolean,
  showCommentsPanel: boolean,
  containerRef: React.RefObject<HTMLDivElement>
) => {
  const [isResizing, setIsResizing] = useState<
    "library-player" | "player-comments" | "library-comments" | null
  >(null);

  const handleResizeStart = useCallback(
    (
      type: "library-player" | "player-comments" | "library-comments",
      e: React.MouseEvent
    ) => {
      if (isMobile) return;
      setIsResizing(type);
      e.preventDefault();
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [isMobile]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current || isMobile) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;
      const mousePercent = (mouseX / containerWidth) * 100;

      if (isResizing === "library-player") {
        const newLibraryWidth = Math.max(20, Math.min(60, mousePercent));
        setLibraryWidth(newLibraryWidth);
        if (showCommentsPanel) {
          const remaining = 100 - newLibraryWidth;
          setPlayerWidth(remaining * 0.7);
          setCommentsWidth(remaining * 0.3);
        }
      } else if (isResizing === "player-comments") {
        const libraryTaken = showMediaLibrary ? libraryWidth : 0;
        const availableSpace = 100 - libraryTaken;
        const relativeMousePercent =
          (((mouseX / containerWidth) * 100 - libraryTaken) / availableSpace) *
          100;
        const newPlayerPercent = Math.max(
          30,
          Math.min(70, relativeMousePercent)
        );
        setPlayerWidth((availableSpace * newPlayerPercent) / 100);
        setCommentsWidth((availableSpace * (100 - newPlayerPercent)) / 100);
      } else if (isResizing === "library-comments") {
        const newLibraryWidth = Math.max(20, Math.min(80, mousePercent));
        setLibraryWidth(newLibraryWidth);
      }
    },
    [
      isResizing,
      libraryWidth,
      showMediaLibrary,
      showCommentsPanel,
      isMobile,
      containerRef,
      setLibraryWidth,
      setPlayerWidth,
      setCommentsWidth,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(null);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    if (isResizing && !isMobile) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp, isMobile]);

  return {
    isResizing,
    handleResizeStart,
  };
};
