// app/dashboard/projects/[id]/handlers/Workspace/panelHandlers.ts
import { useState, useMemo, useEffect, useCallback, useRef } from "react";

export const createPanelHandlers = (isMobile: boolean) => {
  const [showMediaLibrary, setShowMediaLibrary] = useState(true);
  const [showMediaPlayer, setShowMediaPlayer] = useState(false);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [libraryWidth, setLibraryWidth] = useState(30);
  const [playerWidth, setPlayerWidth] = useState(45);
  const [commentsWidth, setCommentsWidth] = useState(25);

  // Keep useState for isResizing to maintain hook order
  const [isResizing, setIsResizing] = useState(false);

  // Use ref for timeout management only
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openPanelsCount = !isMobile
    ? [showMediaLibrary, showMediaPlayer, showCommentsPanel].filter(Boolean)
        .length
    : 1;

  const canToggleMediaLibrary = useMemo(() => {
    if (isMobile) return false;
    if (!showMediaLibrary) return true;
    if (openPanelsCount === 1) return false;
    if (openPanelsCount === 2) return false;
    if (openPanelsCount === 3) return true;
    return false;
  }, [isMobile, showMediaLibrary, openPanelsCount]);

  const playerLocked = useMemo(
    () => !showMediaLibrary && showMediaPlayer,
    [showMediaLibrary, showMediaPlayer]
  );

  const commentsLocked = useMemo(
    () => !showMediaLibrary && showCommentsPanel,
    [showMediaLibrary, showCommentsPanel]
  );

  const handleMediaLibraryToggle = useCallback(() => {
    if (isMobile) return;
    setIsResizing(false); // Mark as opening/closing, not resizing
    if (!showMediaLibrary) {
      setShowMediaLibrary(true);
    } else if (canToggleMediaLibrary) {
      setShowMediaLibrary(false);
    }
  }, [isMobile, showMediaLibrary, canToggleMediaLibrary]);

  const handleMediaPlayerToggle = useCallback(() => {
    if (isMobile || playerLocked) return;
    setIsResizing(false); // Mark as opening/closing, not resizing
    if (!showMediaPlayer) {
      if (showMediaLibrary) {
        setShowMediaPlayer(true);
      }
    } else {
      if (openPanelsCount > 1) {
        setShowMediaPlayer(false);
      }
    }
  }, [
    isMobile,
    playerLocked,
    showMediaPlayer,
    showMediaLibrary,
    openPanelsCount,
  ]);

  const handleCommentsToggle = useCallback(
    (canComment: boolean) => {
      if (isMobile || commentsLocked || !canComment) return;
      setIsResizing(false); // Mark as opening/closing, not resizing
      if (!showCommentsPanel) {
        if (showMediaLibrary) {
          setShowCommentsPanel(true);
        }
      } else {
        if (openPanelsCount > 1) {
          setShowCommentsPanel(false);
        }
      }
    },
    [
      isMobile,
      commentsLocked,
      showCommentsPanel,
      showMediaLibrary,
      openPanelsCount,
    ]
  );

  // Optimized resize handlers using useCallback with debounced state updates
  const setLibraryWidthResize = useCallback((width: number) => {
    setIsResizing(true);
    setLibraryWidth(width);

    // Clear previous timeout and set new one
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    resizeTimeoutRef.current = setTimeout(() => {
      setIsResizing(false);
    }, 50); // Reduced from 100ms for snappier feel
  }, []);

  const setPlayerWidthResize = useCallback((width: number) => {
    setIsResizing(true);
    setPlayerWidth(width);

    // Clear previous timeout and set new one
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    resizeTimeoutRef.current = setTimeout(() => {
      setIsResizing(false);
    }, 50);
  }, []);

  const setCommentsWidthResize = useCallback((width: number) => {
    setIsResizing(true);
    setCommentsWidth(width);

    // Clear previous timeout and set new one
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    resizeTimeoutRef.current = setTimeout(() => {
      setIsResizing(false);
    }, 50);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // Split width calculations into stable and dynamic for better performance
  const stableWidths = useMemo(() => {
    if (isMobile) {
      return { library: 100, player: 0, comments: 0 };
    }

    // Single panel scenarios (most common) - these are stable
    if (openPanelsCount === 1) {
      if (showMediaLibrary) return { library: 100, player: 0, comments: 0 };
      if (showMediaPlayer) return { library: 0, player: 100, comments: 0 };
      if (showCommentsPanel) return { library: 0, player: 0, comments: 100 };
    }

    // No panels open case
    if (openPanelsCount === 0) {
      return { library: showMediaLibrary ? 100 : 0, player: 0, comments: 0 };
    }

    return null; // Use dynamic calculation for multi-panel scenarios
  }, [
    isMobile,
    openPanelsCount,
    showMediaLibrary,
    showMediaPlayer,
    showCommentsPanel,
  ]);

  // Dynamic width calculations (only for multi-panel scenarios)
  const dynamicWidths = useMemo(() => {
    if (stableWidths) return stableWidths;

    // Multi-panel scenarios - these need dynamic calculation
    let libWidth = 0;
    let playWidth = 0;
    let commWidth = 0;

    if (openPanelsCount === 2) {
      if (showMediaLibrary && showMediaPlayer) {
        libWidth = libraryWidth;
        playWidth = 100 - libraryWidth;
      } else if (showMediaLibrary && showCommentsPanel) {
        libWidth = libraryWidth;
        commWidth = 100 - libraryWidth;
      } else if (showMediaPlayer && showCommentsPanel) {
        playWidth = playerWidth;
        commWidth = 100 - playerWidth;
      }
    } else if (openPanelsCount === 3) {
      libWidth = libraryWidth;
      playWidth = playerWidth;
      commWidth = commentsWidth;
    }

    return {
      library: libWidth,
      player: playWidth,
      comments: commWidth,
    };
  }, [
    stableWidths,
    openPanelsCount,
    showMediaLibrary,
    showMediaPlayer,
    showCommentsPanel,
    libraryWidth,
    playerWidth,
    commentsWidth,
  ]);

  // Memoized setters for consistent references
  const setShowMediaPlayerMemo = useCallback((show: boolean) => {
    setIsResizing(false);
    setShowMediaPlayer(show);
  }, []);

  const setShowCommentsPanelMemo = useCallback((show: boolean) => {
    setIsResizing(false);
    setShowCommentsPanel(show);
  }, []);

  return {
    showMediaLibrary,
    showMediaPlayer,
    showCommentsPanel,
    setShowMediaPlayer: setShowMediaPlayerMemo,
    setShowCommentsPanel: setShowCommentsPanelMemo,
    libraryWidth,
    playerWidth,
    commentsWidth,
    setLibraryWidth: setLibraryWidthResize,
    setPlayerWidth: setPlayerWidthResize,
    setCommentsWidth: setCommentsWidthResize,
    openPanelsCount,
    canToggleMediaLibrary,
    playerLocked,
    commentsLocked,
    handleMediaLibraryToggle,
    handleMediaPlayerToggle,
    handleCommentsToggle,
    widths: dynamicWidths,
    isResizing, // Now consistent useState hook
  };
};