// app/board/page.tsx
import { Metadata } from "next";
import BoardClient from "./board-client";

export const metadata: Metadata = {
  title: "Interactive Board",
  description:
    "Drag, resize and manage images and embedded videos on an interactive board",
};

export default function BoardPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Interactive Board</h1>
      <BoardClient />
    </div>
  );
}
