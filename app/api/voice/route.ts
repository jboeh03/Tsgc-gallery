/**
 * Voice handler for the Twilio number (513-790-4040). The number is published
 * site-wide for both text and call; texts go to /api/sms, and calls hit this
 * route, which forwards (TwiML <Dial>) to Jeff's existing line so nothing
 * rings into a dead end. Change VOICE_FORWARD_TO (or the env) to retarget.
 */

const FORWARD_TO = process.env.VOICE_FORWARD_TO || "+16578314276";

function twiml() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Dial>${FORWARD_TO}</Dial></Response>`;
  return new Response(xml, { status: 200, headers: { "content-type": "text/xml" } });
}

export const runtime = "nodejs";
export async function POST() {
  return twiml();
}
export async function GET() {
  return twiml();
}
