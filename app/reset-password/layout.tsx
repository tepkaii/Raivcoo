import { Metadata } from "next";
import React from "react";



export const metadata: Metadata = {
  title: "Reset Password - Raivcoo",
  description:
    "Set a new password for your Raivcoo account and get back to showcasing your video editing portfolio.",
};

function layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div> {children}</div>;
}

export default layout;
