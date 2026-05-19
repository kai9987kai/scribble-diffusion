import Canvas from "components/canvas";
import PromptForm from "components/prompt-form";
import Head from "next/head";
import { useState } from "react";
import Predictions from "components/predictions";
import Error from "components/error";
import uploadFile from "lib/upload";
import naughtyWords from "naughty-words";
import seeds from "lib/seeds";
import pkg from "../package.json";
import sleep from "lib/sleep";

const HOST = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

async function readApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (contentType.includes("application/json") || /^[\[{]/.test(text.trim())) {
    try {
      return JSON.parse(text);
    } catch (e) {
      return { detail: "The server returned invalid JSON." };
    }
  }

  const title = text.match(/<title>(.*?)<\/title>/)?.[1];
  return {
    detail: title || response.statusText || "Unexpected server response.",
  };
}

const CONFIGURATION_ERROR =
  "REPLICATE_API_TOKEN is not configured. Add it to .env.local and restart the dev server.";

export default function Home({ isReplicateConfigured }) {
  const [error, setError] = useState(null);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [predictions, setPredictions] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [scribbleExists, setScribbleExists] = useState(false);
  const [seed] = useState(seeds[Math.floor(Math.random() * seeds.length)]);
  const [initialPrompt] = useState(seed.prompt);
  const [scribble, setScribble] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    // track submissions so we can show a spinner while waiting for the next prediction to be created
    setSubmissionCount((count) => count + 1);

    const prompt = form.prompt.value
      .split(/\s+/)
      .map((word) =>
        naughtyWords.en.includes(word.toLowerCase().replace(/[^a-z]/g, ""))
          ? "something"
          : word
      )
      .join(" ");

    setError(null);
    setIsProcessing(true);

    try {
      const statusResponse = await fetch("/api/predictions");
      const status = await readApiResponse(statusResponse);
      if (!status.configured) {
        throw new Error(CONFIGURATION_ERROR);
      }

      const fileUrl = await uploadFile(scribble);
      const seed = Number(form.seed.value);

      const body = {
        prompt,
        image: fileUrl,
        structure: form.structure.value,
        num_samples: form.num_samples.value,
        image_resolution: form.image_resolution.value,
        steps: Number(form.steps.value),
        scale: Number(form.scale.value),
        eta: Number(form.eta.value),
        a_prompt: form.a_prompt.value,
        n_prompt: form.n_prompt.value,
        ...(Number.isInteger(seed) && seed >= 0 ? { seed } : {}),
      };

      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      let prediction = await readApiResponse(response);

      if (prediction.id) {
        setPredictions((predictions) => ({
          ...predictions,
          [prediction.id]: prediction,
        }));
      }

      if (response.status !== 201) {
        throw new Error(prediction.detail || "Could not create prediction.");
      }

      while (
        prediction.status !== "succeeded" &&
        prediction.status !== "failed"
      ) {
        await sleep(500);
        const response = await fetch("/api/predictions/" + prediction.id);
        prediction = await readApiResponse(response);
        setPredictions((predictions) => ({
          ...predictions,
          [prediction.id]: prediction,
        }));
        if (response.status !== 200) {
          throw new Error(prediction.detail || "Could not refresh prediction.");
        }
      }

      if (prediction.status === "failed") {
        throw new Error(prediction.error || "The prediction failed.");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Head>
        <title>{pkg.appName}</title>
        <meta name="description" content={pkg.appMetaDescription} />
        <meta property="og:title" content={pkg.appName} />
        <meta property="og:description" content={pkg.appMetaDescription} />
        <meta
          property="og:image"
          content={`${HOST}/og-b7xwc4g4wrdrtneilxnbngzvti.jpg`}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <main className="container max-w-[1024px] mx-auto p-5 ">
        <div className="container max-w-[512px] mx-auto">
          <hgroup>
            <h1 className="text-center text-5xl font-bold m-4">
              {pkg.appName}
            </h1>
            <p className="text-center text-xl opacity-60 m-4">
              {pkg.appSubtitle}
            </p>
          </hgroup>

          <Canvas
            startingPaths={seed.paths}
            onScribble={setScribble}
            scribbleExists={scribbleExists}
            setScribbleExists={setScribbleExists}
          />

          <PromptForm
            initialPrompt={initialPrompt}
            isConfigured={isReplicateConfigured}
            onSubmit={handleSubmit}
            isProcessing={isProcessing}
            scribbleExists={scribbleExists}
          />

          <Error
            error={
              error || (!isReplicateConfigured ? CONFIGURATION_ERROR : null)
            }
          />
        </div>

        <Predictions
          predictions={predictions}
          isProcessing={isProcessing}
          submissionCount={submissionCount}
        />
      </main>

    </>
  );
}

export async function getServerSideProps() {
  return {
    props: {
      isReplicateConfigured: Boolean(process.env.REPLICATE_API_TOKEN),
    },
  };
}
