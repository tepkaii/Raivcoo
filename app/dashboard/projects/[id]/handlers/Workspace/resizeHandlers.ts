// app/dashboard/projects/[id]/handlers/Workspace/resizeHandlers.ts
import { useState, useCallback, useEffect, useRef } from "react";

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
  // ✅ ALWAYS call hooks in the same order - move ALL hooks to the top
  const [isResizing, setIsResizing] = useState<
    "library-player" | "player-comments" | "library-comments" | null
  >(null);

  const libraryWidthRef = useRef(libraryWidth);
  const playerWidthRef = useRef(playerWidth);
  const commentsWidthRef = useRef(commentsWidth);
  const containerDimensionsRef = useRef({ width: 0, left: 0 });
  const frameRef = useRef<number | null>(null); // ✅ Fixed initialization

  // ✅ Update refs when values change - ALWAYS called
  useEffect(() => {
    libraryWidthRef.current = libraryWidth;
  }, [libraryWidth]);

  useEffect(() => {
    playerWidthRef.current = playerWidth;
  }, [playerWidth]);

  useEffect(() => {
    commentsWidthRef.current = commentsWidth;
  }, [commentsWidth]);

  const updateContainerDimensions = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      containerDimensionsRef.current = {
        width: rect.width,
        left: rect.left,
      };
    }
  }, []);

  const handleResizeStart = useCallback(
    (
      type: "library-player" | "player-comments" | "library-comments",
      e: React.MouseEvent
    ) => {
      if (isMobile) return;
      setIsResizing(type);
      updateContainerDimensions();
      e.preventDefault();
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [isMobile, updateContainerDimensions]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || isMobile) return;

      // Cancel previous frame if still pending
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }

      // Batch all updates in single animation frame
      frameRef.current = requestAnimationFrame(() => {
        const { width: containerWidth, left: containerLeft } =
          containerDimensionsRef.current;
        if (containerWidth === 0) return;

        const mouseX = e.clientX - containerLeft;
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
          const libraryTaken = showMediaLibrary ? libraryWidthRef.current : 0;
          const availableSpace = 100 - libraryTaken;
          const relativeMousePercent =
            ((mousePercent - libraryTaken) / availableSpace) * 100;
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
      });
    },
    [
      isResizing,
      showMediaLibrary,
      showCommentsPanel,
      isMobile,
      setLibraryWidth,
      setPlayerWidth,
      setCommentsWidth,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(null);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";

    // Cancel any pending frame
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  // ✅ ALWAYS call useEffect - conditional logic inside
  useEffect(() => {
    if (isResizing && !isMobile) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        // Cleanup pending frame
        if (frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }
      };
    }
    // Return empty cleanup function when not resizing
    return () => {};
  }, [isResizing, handleMouseMove, handleMouseUp, isMobile]);

  return {
    isResizing,
    handleResizeStart,
  };
};