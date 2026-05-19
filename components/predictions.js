import copy from "copy-to-clipboard";
import { Copy as CopyIcon, PlusCircle as PlusCircleIcon } from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import Loader from "components/loader";

export default function Predictions({
  predictions,
  submissionCount,
  isProcessing = false,
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (submissionCount > 0 && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [predictions, submissionCount]);

  if (submissionCount === 0) return;

  return (
    <section className="w-full my-10">
      <h2 className="text-center text-3xl font-bold m-6">Results</h2>

      {isProcessing && submissionCount > Object.keys(predictions).length && (
        <div className="pb-10 mx-auto w-full text-center">
          <div className="pt-10" ref={scrollRef} />
          <Loader />
        </div>
      )}

      {Object.values(predictions)
        .slice()
        .reverse()
        .map((prediction, index) => (
          <Fragment key={prediction.id || prediction.uuid}>
            {index === 0 &&
              submissionCount == Object.keys(predictions).length && (
                <div ref={scrollRef} />
              )}
            <Prediction prediction={prediction} />
          </Fragment>
        ))}
    </section>
  );
}

export function Prediction({ prediction, showLinkToNewScribble = false }) {
  const [linkCopied, setLinkCopied] = useState(false);
  const outputs = prediction?.output?.length ? prediction.output : [];
  const input = prediction?.input || {};
  const predictionId = prediction?.uuid || prediction?.id;

  const copyLink = () => {
    const url = window.location.origin + "/scribbles/" + predictionId;
    copy(url);
    setLinkCopied(true);
  };

  // Clear the "Copied!" message after 4 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      setLinkCopied(false);
    }, 4 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  if (!prediction) return null;

  return (
    <div className="mt-6 mb-12">
      <div className="shadow-lg border my-5 p-5 bg-white grid gap-3 sm:grid-cols-2">
        <div className="aspect-square relative border">
          <img
            src={input.image}
            alt="input scribble"
            className="w-full aspect-square"
          />
        </div>
        <div className="aspect-square relative">
          {outputs.length ? (
            <div
              className={`grid h-full gap-2 ${
                outputs.length > 1
                  ? "grid-cols-2 grid-rows-2"
                  : "grid-cols-1"
              }`}
            >
              {outputs.map((output, index) => (
                <img
                  key={output}
                  src={output}
                  alt={`output image ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              ))}
            </div>
          ) : (
            <div className="grid h-full place-items-center">
              <Loader />
            </div>
          )}
        </div>
      </div>
      <div className="text-center px-4 opacity-60 text-xl">
        &ldquo;{input.prompt}&rdquo;
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 px-4 text-center text-xs uppercase tracking-wide text-gray-400">
        {input.structure && <span>{input.structure}</span>}
        {input.num_samples && <span>{input.num_samples} outputs</span>}
        {input.image_resolution && <span>{input.image_resolution}px</span>}
        {input.steps && <span>{input.steps} steps</span>}
        {input.scale && <span>guidance {input.scale}</span>}
        {Number.isInteger(input.seed) && <span>seed {input.seed}</span>}
      </div>
      <div className="text-center py-2">
        <button className="lil-button" onClick={copyLink}>
          <CopyIcon className="icon" />
          {linkCopied ? "Copied!" : "Copy link"}
        </button>

        {showLinkToNewScribble && (
          <Link href="/">
            <button className="lil-button" onClick={copyLink}>
              <PlusCircleIcon className="icon" />
              Create a new scribble
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
