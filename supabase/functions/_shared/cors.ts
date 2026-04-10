const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
];

// Add production domain if set
const prodOrigin = Deno.env.get("SITE_URL");
if (prodOrigin) allowedOrigins.push(prodOrigin);

// Also allow Vercel preview deployments
const vercelUrl = Deno.env.get("VERCEL_URL");
if (vercelUrl) allowedOrigins.push(`https://${vercelUrl}`);

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const isAllowed =
    allowedOrigins.includes(origin) ||
    origin.includes("-zack-hollands-projects.vercel.app"); // Allow only this team's Vercel previews

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
