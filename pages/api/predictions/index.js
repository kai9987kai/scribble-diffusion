import Replicate from "replicate";
import packageData from "../../../package.json";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
  userAgent: `${packageData.name}/${packageData.version}`,
});

const WEBHOOK_HOST = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NGROK_HOST;

const CONTROLNET_VERSION =
  "d55b9f2dcfb156089686b8f767776d5b61b007187a4e1e611881818098100fbb";

const STRUCTURES = new Set([
  "scribble",
  "canny",
  "depth",
  "hed",
  "hough",
  "normal",
  "pose",
  "seg",
]);

const NUM_SAMPLES = new Set(["1", "4"]);
const IMAGE_RESOLUTIONS = new Set(["256", "512", "768"]);

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function cleanString(value, fallback = "") {
  return typeof value === "string" && value.trim().length
    ? value.trim()
    : fallback;
}

function sanitizeInput(body) {
  const prompt = cleanString(body?.prompt);
  const image = cleanString(body?.image);

  if (!prompt || !image) {
    return null;
  }

  const structure = STRUCTURES.has(body?.structure)
    ? body.structure
    : "scribble";
  const num_samples = NUM_SAMPLES.has(String(body?.num_samples))
    ? String(body?.num_samples)
    : "1";
  const image_resolution = IMAGE_RESOLUTIONS.has(String(body?.image_resolution))
    ? String(body?.image_resolution)
    : "512";

  const input = {
    image,
    prompt,
    structure,
    num_samples,
    image_resolution,
    steps: Math.round(clampNumber(body?.steps, 1, 100, 20)),
    scale: clampNumber(body?.scale, 0.1, 30, 9),
    eta: clampNumber(body?.eta, 0, 1, 0),
    a_prompt: cleanString(body?.a_prompt, "best quality, extremely detailed"),
    n_prompt: cleanString(
      body?.n_prompt,
      "longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality"
    ),
  };

  const seed = Number(body?.seed);
  if (Number.isInteger(seed) && seed >= 0) {
    input.seed = seed;
  }

  return input;
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    sendJson(res, 200, {
      configured: Boolean(process.env.REPLICATE_API_TOKEN),
    });
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { detail: "Method not allowed" });
    return;
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    sendJson(res, 500, {
      detail:
        "REPLICATE_API_TOKEN is not configured. Add it to .env.local and restart the dev server.",
    });
    return;
  }

  const input = sanitizeInput(req.body);
  if (!input) {
    sendJson(res, 400, { detail: "A prompt and scribble image are required." });
    return;
  }

  let prediction;
  try {
    prediction = await replicate.predictions.create({
      version: CONTROLNET_VERSION,
      input,
      ...(WEBHOOK_HOST && {
        webhook: `${WEBHOOK_HOST}/api/replicate-webhook`,
        webhook_events_filter: ["start", "completed"],
      }),
    });
  } catch (error) {
    sendJson(res, 500, {
      detail: error.message || "Could not create Replicate prediction.",
    });
    return;
  }

  if (prediction?.error) {
    sendJson(res, 500, { detail: prediction.error });
    return;
  }

  sendJson(res, 201, prediction);
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};
