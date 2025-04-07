import React from "react";
import SupportPage from "./SupportPage";
import { Metadata } from "next";
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Support Center - Raivcoo",
  description: "Get help or report issues with Raivcoo. ",
};
function page() {
  return <SupportPage />;
}

export default page;
