// app/dashboard/projects/[id]/handlers/Workspace/panelHandlers.ts
import { useState, useMemo } from "react";

export const createPanelHandlers = (isMobile: boolean) => {
  const [showMediaLibrary, setShowMediaLibrary] = useState(true);
  const [showMediaPlayer, setShowMediaPlayer] = useState(false);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [libraryWidth, setLibraryWidth] = useState(30);
  const [playerWidth, setPlayerWidth] = useState(45);
  const [commentsWidth, setCommentsWidth] = useState(25);

  const openPanelsCount = !isMobile
    ? [showMediaLibrary, showMediaPlayer, showCommentsPanel].filter(Boolean)
        .length
    : 1;

  const canToggleMediaLibrary = (() => {
    if (isMobile) return false;
    if (!showMediaLibrary) return true;
    if (openPanelsCount === 1) return false;
    if (openPanelsCount === 2) return false;
    if (openPanelsCount === 3) return true;
    return false;
  })();

  const playerLocked = !showMediaLibrary && showMediaPlayer;
  const commentsLocked = !showMediaLibrary && showCommentsPanel;

  const handleMediaLibraryToggle = () => {
    if (isMobile) return;
    if (!showMediaLibrary) {
      setShowMediaLibrary(true);
    } else if (canToggleMediaLibrary) {
      setShowMediaLibrary(false);
    }
  };

  const handleMediaPlayerToggle = () => {
    if (isMobile || playerLocked) return;
    if (!showMediaPlayer) {
      if (showMediaLibrary) {
        setShowMediaPlayer(true);
      }
    } else {
      if (openPanelsCount > 1) {
        setShowMediaPlayer(false);
      }
    }
  };

  const handleCommentsToggle = (canComment: boolean) => {
    if (isMobile || commentsLocked || !canComment) return;
    if (!showCommentsPanel) {
      if (showMediaLibrary) {
        setShowCommentsPanel(true);
      }
    } else {
      if (openPanelsCount > 1) {
        setShowCommentsPanel(false);
      }
    }
  };

  const widths = useMemo(() => {
    if (isMobile) {
      return { library: 100, player: 0, comments: 0 };
    }

    if (openPanelsCount === 1) {
      if (showMediaLibrary) return { library: 100, player: 0, comments: 0 };
      if (showMediaPlayer) return { library: 0, player: 100, comments: 0 };
      if (showCommentsPanel) return { library: 0, player: 0, comments: 100 };
    } else if (openPanelsCount === 2) {
      if (showMediaLibrary && showMediaPlayer) {
        return {
          library: libraryWidth,
          player: 100 - libraryWidth,
          comments: 0,
        };
      } else if (showMediaLibrary && showCommentsPanel) {
        return {
          library: libraryWidth,
          player: 0,
          comments: 100 - libraryWidth,
        };
      } else if (showMediaPlayer && showCommentsPanel) {
        return { library: 0, player: playerWidth, comments: 100 - playerWidth };
      }
    } else if (openPanelsCount === 3) {
      return {
        library: libraryWidth,
        player: playerWidth,
        comments: commentsWidth,
      };
    }

    return { library: showMediaLibrary ? 100 : 0, player: 0, comments: 0 };
  }, [
    isMobile,
    openPanelsCount,
    showMediaLibrary,
    showMediaPlayer,
    showCommentsPanel,
    libraryWidth,
    playerWidth,
    commentsWidth,
  ]);

  return {
    showMediaLibrary,
    showMediaPlayer,
    showCommentsPanel,
    setShowMediaPlayer,
    setShowCommentsPanel,
    libraryWidth,
    playerWidth,
    commentsWidth,
    setLibraryWidth,
    setPlayerWidth,
    setCommentsWidth,
    openPanelsCount,
    canToggleMediaLibrary,
    playerLocked,
    commentsLocked,
    handleMediaLibraryToggle,
    handleMediaPlayerToggle,
    handleCommentsToggle,
    widths,
  };
};
