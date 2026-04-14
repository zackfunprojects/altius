import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.103.0";
import Stripe from "npm:stripe@17.7.0";
import { getUserIdFromRequest, ValidationError } from "../_shared/anthropic.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const proPriceId = Deno.env.get("STRIPE_PRO_PRICE_ID");

serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    if (!stripeSecretKey || !proPriceId) {
      return new Response(
        JSON.stringify({ error: "Stripe is not configured. Contact support." }),
        { status: 503, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const authUserId = getUserIdFromRequest(req);
    if (!authUserId) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey);

    // Fetch profile to get or create Stripe customer
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id, display_name")
      .eq("id", authUserId)
      .single();

    if (profileError || !profile) {
      throw new ValidationError("Profile not found");
    }

    // Get user email from auth
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(authUserId);
    if (userError || !user?.email) {
      throw new ValidationError("Could not retrieve account email");
    }

    let customerId = profile.stripe_customer_id;

    // Create Stripe customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile.display_name || undefined,
        metadata: { supabase_user_id: authUserId },
      });

      customerId = customer.id;

      // Store customer ID on profile
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", authUserId);
    }

    // Parse request body for optional parameters
    const body = await req.json().catch(() => ({}));
    const origin = body.origin || "https://altius.vercel.app";

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: proPriceId, quantity: 1 }],
      success_url: `${origin}/settings?upgraded=true`,
      cancel_url: `${origin}/settings`,
      metadata: { supabase_user_id: authUserId },
    });

    return new Response(
      JSON.stringify({ checkout_url: session.url }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    console.error("stripe-checkout error:", (error as Error).message);
    return new Response(
      JSON.stringify({ error: "Failed to create checkout session." }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
