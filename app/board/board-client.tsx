// app/board/board-client.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useDrag } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define types for our board items
type ItemType = "image" | "video";

interface BoardItem {
  id: string;
  type: ItemType;
  content: string; // URL for images or YouTube embed links
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
}

// This is our draggable item component
function DraggableBoardItem({
  item,
  moveItem,
  resizeItem,
  removeItem,
  bringToFront,
}: {
  item: BoardItem;
  moveItem: (id: string, left: number, top: number) => void;
  resizeItem: (
    id: string,
    width: number,
    height: number,
    direction: string
  ) => void;
  removeItem: (id: string) => void;
  bringToFront: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "BOARD_ITEM",
    item: { id: item.id, type: item.type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  // Simple movement with mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    // Bring this item to the front
    bringToFront(item.id);

    const initialX = e.clientX;
    const initialY = e.clientY;
    const startLeft = item.position.x;
    const startTop = item.position.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - initialX;
      const deltaY = moveEvent.clientY - initialY;
      moveItem(item.id, startLeft + deltaX, startTop + deltaY);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Handle resizing from any corner
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();

    // Bring this item to the front
    bringToFront(item.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = item.size.width;
    const startHeight = item.size.height;
    const startLeft = item.position.x;
    const startTop = item.position.y;

    const handleResizeMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newLeft = startLeft;
      let newTop = startTop;

      // Handle different resize directions
      if (direction.includes("e")) {
        // East (right)
        newWidth = Math.max(100, startWidth + deltaX);
      }
      if (direction.includes("w")) {
        // West (left)
        newWidth = Math.max(100, startWidth - deltaX);
        newLeft = startLeft + (startWidth - newWidth);
      }
      if (direction.includes("s")) {
        // South (bottom)
        newHeight = Math.max(100, startHeight + deltaY);
      }
      if (direction.includes("n")) {
        // North (top)
        newHeight = Math.max(100, startHeight - deltaY);
        newTop = startTop + (startHeight - newHeight);
      }

      // Update position if needed (for n/w resize)
      if (newLeft !== startLeft || newTop !== startTop) {
        moveItem(item.id, newLeft, newTop);
      }

      // Update size
      resizeItem(item.id, newWidth, newHeight, direction);
    };

    const handleResizeEnd = () => {
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
    };

    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
  };

  // Extract YouTube video ID from URL
  const getYoutubeEmbedUrl = (url: string) => {
    try {
      if (url.includes("youtube.com/embed/")) {
        return url; // Already an embed URL
      } else if (url.includes("youtube.com/watch?v=")) {
        const videoId = new URL(url).searchParams.get("v") || "";
        return `https://www.youtube.com/embed/${videoId}`;
      } else if (url.includes("youtu.be/")) {
        const videoId = url.split("youtu.be/")[1].split("?")[0];
        return `https://www.youtube.com/embed/${videoId}`;
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  drag(ref);

  return (
    <div
      ref={ref}
      className={`absolute cursor-move select-none ${isDragging ? "opacity-50" : ""}`}
      style={{
        left: `${item.position.x}px`,
        top: `${item.position.y}px`,
        width: `${item.size.width}px`,
        height: `${item.size.height}px`,
        zIndex: item.zIndex,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Content (fills the entire space) */}
      <div className="relative w-full h-full overflow-hidden">
        {item.type === "image" ? (
          <img
            src={item.content}
            alt="Board item"
            className="w-full h-full object-contain"
            draggable={false}
            style={{ pointerEvents: "none" }}
          />
        ) : (
          <iframe
            src={getYoutubeEmbedUrl(item.content)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
            style={{ pointerEvents: "none" }}
          />
        )}

        {/* Resize handles at all 4 corners */}
        <div
          className="absolute top-0 left-0 w-6 h-6 bg-blue-500 bg-opacity-30 border border-blue-500 cursor-nw-resize rounded-br"
          onMouseDown={(e) => handleResizeStart(e, "nw")}
        />
        <div
          className="absolute top-0 right-0 w-6 h-6 bg-blue-500 bg-opacity-30 border border-blue-500 cursor-ne-resize rounded-bl"
          onMouseDown={(e) => handleResizeStart(e, "ne")}
        />
        <div
          className="absolute bottom-0 left-0 w-6 h-6 bg-blue-500 bg-opacity-30 border border-blue-500 cursor-sw-resize rounded-tr"
          onMouseDown={(e) => handleResizeStart(e, "sw")}
        />
        <div
          className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 bg-opacity-30 border border-blue-500 cursor-se-resize rounded-tl"
          onMouseDown={(e) => handleResizeStart(e, "se")}
        />

        {/* Remove button (always visible now) */}
        <Button
          variant="destructive"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full opacity-70 hover:opacity-100 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            removeItem(item.id);
          }}
        >
          ×
        </Button>
      </div>
    </div>
  );
}

export default function BoardClient() {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [selectedType, setSelectedType] = useState<ItemType>("image");
  const [boardData, setBoardData] = useState("{}");
  const [maxZIndex, setMaxZIndex] = useState(1);

  // Update JSON display when items change
  useEffect(() => {
    setBoardData(JSON.stringify(items, null, 2));
  }, [items]);

  // Add a new item to the board
  const addItem = () => {
    if (!urlInput) return;

    // Increment the max z-index for new items
    const newZIndex = maxZIndex + 1;
    setMaxZIndex(newZIndex);

    const newItem: BoardItem = {
      id: `item-${Date.now()}`,
      type: selectedType,
      content: urlInput,
      position: { x: 50, y: 50 },
      size: { width: 300, height: selectedType === "image" ? 200 : 169 },
      zIndex: newZIndex,
    };

    setItems([...items, newItem]);
    setUrlInput("");
  };

  // Move an item to a new position
  const moveItem = (id: string, left: number, top: number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, position: { x: left, y: top } } : item
      )
    );
  };

  // Resize an item
  const resizeItem = (
    id: string,
    width: number,
    height: number,
    direction: string
  ) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, size: { width, height } } : item
      )
    );
  };

  // Remove an item
  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Bring an item to the front (highest z-index)
  const bringToFront = (id: string) => {
    const newZIndex = maxZIndex + 1;
    setMaxZIndex(newZIndex);

    setItems(
      items.map((item) =>
        item.id === id ? { ...item, zIndex: newZIndex } : item
      )
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-screen p-4">
        <div className="flex mb-4">
          <Tabs
            defaultValue="image"
            className="mr-4"
            onValueChange={(v) => setSelectedType(v as ItemType)}
          >
            <TabsList>
              <TabsTrigger value="image">Image</TabsTrigger>
              <TabsTrigger value="video">Video</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex-1 flex">
            <Input
              placeholder={
                selectedType === "image"
                  ? "Enter image URL"
                  : "Enter YouTube video URL"
              }
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="mr-2"
            />
            <Button onClick={addItem}>Add to Board</Button>
          </div>
        </div>

        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* The interactive board with scrollable container */}
          <div className="flex-1 overflow-auto border border-gray-200 rounded-lg bg-gray-50">
            <div
              className="relative bg-white"
              style={{ width: "1920px", height: "1080px" }}
            >
              {items.map((item) => (
                <DraggableBoardItem
                  key={item.id}
                  item={item}
                  moveItem={moveItem}
                  resizeItem={resizeItem}
                  removeItem={removeItem}
                  bringToFront={bringToFront}
                />
              ))}
            </div>
          </div>

          {/* JSON data display */}
          <div className="w-1/4 bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto">
            <h3 className="text-sm font-medium mb-2">Board Data (JSON)</h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-auto max-h-[calc(100vh-150px)]">
              {boardData}
            </pre>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
