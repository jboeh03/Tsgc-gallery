import { NextRequest, NextResponse } from "next/server";
import { PRODUCTS } from "@/lib/products";
import { logAffiliateClick } from "@/lib/admin/events";

export const runtime = "nodejs";

/**
 * /api/track/click?id=<product-id>
 *
 * Used by the /products page on every outbound affiliate link. Logs the
 * click (fire-and-forget) to the Apps Script, then 302-redirects to the
 * product's affiliate URL.
 *
 * If the id is unknown or the product has no URL, bounce back to /products
 * so the visitor doesn't dead-end.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const product = id ? PRODUCTS.find((p) => p.id === id) : null;

  if (!product || !product.url) {
    return NextResponse.redirect(new URL("/products", req.url));
  }

  logAffiliateClick({
    productId: product.id,
    productName: product.name,
    affiliate: product.affiliate,
    destinationUrl: product.url,
    referer: req.headers.get("referer") ?? "",
    userAgent: req.headers.get("user-agent") ?? "",
  });

  return NextResponse.redirect(product.url, { status: 302 });
}
