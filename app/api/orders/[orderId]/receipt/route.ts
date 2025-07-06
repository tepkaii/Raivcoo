import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import jsPDF from "jspdf";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", params.orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "completed") {
      return NextResponse.json(
        { error: "Receipt only available for completed orders" },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBuffer = generateReceiptPDF(order, user);

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="receipt-${order.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating receipt:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateReceiptPDF(order: any, user: any): Buffer {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text("RECEIPT", 105, 30, { align: "center" });

  // Company info
  doc.setFontSize(12);
  doc.text("Raivcoo", 105, 45, { align: "center" });
  doc.text("raivcoo@gmeail.com", 105, 55, { align: "center" });

  // Order info
  doc.setFontSize(14);
  doc.text("Order Information", 20, 80);

  doc.setFontSize(10);
  doc.text(`Order ID: ${order.id}`, 20, 95);
  doc.text(`Transaction ID: ${order.transaction_id || "N/A"}`, 20, 105);
  doc.text(
    `Date: ${new Date(order.completed_at).toLocaleDateString()}`,
    20,
    115
  );

  // Customer info
  doc.setFontSize(14);
  doc.text("Customer Information", 20, 140);

  doc.setFontSize(10);
  doc.text(`Email: ${user.email}`, 20, 155);

  // Order details
  doc.setFontSize(14);
  doc.text("Order Details", 20, 180);

  doc.setFontSize(10);
  doc.text(`Plan: ${order.plan_name}`, 20, 195);
  if (order.metadata?.storage_gb) {
    const storage =
      order.metadata.storage_gb < 1
        ? `${Math.round(order.metadata.storage_gb * 1000)}MB`
        : `${order.metadata.storage_gb}GB`;
    doc.text(`Storage: ${storage}`, 20, 205);
  }

  // Amount
  doc.setFontSize(12);
  doc.text(
    `Total: $${order.amount.toFixed(2)} ${order.currency.toUpperCase()}`,
    20,
    225
  );

  // Footer
  doc.setFontSize(8);
  doc.text("Thank you for your purchase!", 105, 270, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}
