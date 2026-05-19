import { useEffect, useState } from "react";

export default function PromptForm({
  initialPrompt,
  onSubmit,
  isProcessing,
  scribbleExists,
}) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [settings, setSettings] = useState({
    structure: "scribble",
    num_samples: "1",
    image_resolution: "512",
    steps: 20,
    scale: 9,
    eta: 0,
    seed: "",
    a_prompt: "best quality, extremely detailed",
    n_prompt:
      "longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality",
  });

  const disabled = isProcessing || !(scribbleExists && prompt?.length > 0);

  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

  const updateSetting = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const addPromptChip = (chip) => {
    setPrompt((current) => {
      const trimmed = current.trim();
      if (!trimmed) return chip;
      if (trimmed.toLowerCase().includes(chip.toLowerCase())) return trimmed;
      return `${trimmed}, ${chip}`;
    });
  };

  const randomizeSeed = () => {
    updateSetting("seed", Math.floor(Math.random() * 2147483647).toString());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="animate-in fade-in duration-700">
      <div className="flex mt-4">
        <input
          id="prompt-input"
          type="text"
          name="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to create..."
          className="block w-full flex-grow rounded-l-md"
          disabled={isProcessing}
        />

        <button
          className={`bg-black text-white rounded-r-md text-small inline-block px-5 py-3 flex-none ${
            disabled ? "opacity-20 cursor-not-allowed	" : ""
          }`}
          type="submit"
          disabled={disabled}
        >
          {isProcessing ? "Working" : "Go"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {[
          "photorealistic",
          "watercolor",
          "storybook illustration",
          "product concept",
          "isometric",
          "cinematic lighting",
        ].map((chip) => (
          <button
            key={chip}
            type="button"
            className="chip-button"
            onClick={() => addPromptChip(chip)}
            disabled={isProcessing}
          >
            {chip}
          </button>
        ))}
      </div>

      <details className="experiment-panel mt-4">
        <summary className="cursor-pointer text-sm font-semibold text-gray-700">
          Experiment lab
        </summary>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="field-label">
            <span>Control</span>
            <select
              name="structure"
              value={settings.structure}
              onChange={(e) => updateSetting("structure", e.target.value)}
            >
              <option value="scribble">Scribble</option>
              <option value="canny">Canny edges</option>
              <option value="hed">Soft edges</option>
              <option value="hough">Hough lines</option>
              <option value="depth">Depth</option>
              <option value="seg">Segmentation</option>
              <option value="normal">Normal map</option>
              <option value="pose">Pose</option>
            </select>
          </label>

          <label className="field-label">
            <span>Outputs</span>
            <select
              name="num_samples"
              value={settings.num_samples}
              onChange={(e) => updateSetting("num_samples", e.target.value)}
            >
              <option value="1">1 image</option>
              <option value="4">4 variations</option>
            </select>
          </label>

          <label className="field-label">
            <span>Resolution</span>
            <select
              name="image_resolution"
              value={settings.image_resolution}
              onChange={(e) =>
                updateSetting("image_resolution", e.target.value)
              }
            >
              <option value="256">256</option>
              <option value="512">512</option>
              <option value="768">768</option>
            </select>
          </label>

          <label className="field-label">
            <span>Seed</span>
            <div className="flex">
              <input
                name="seed"
                type="number"
                min="0"
                value={settings.seed}
                onChange={(e) => updateSetting("seed", e.target.value)}
                placeholder="Random"
                className="min-w-0 flex-1 rounded-r-none"
              />
              <button
                type="button"
                className="rounded-r-md border border-l-0 border-gray-300 px-3 text-sm text-gray-600"
                onClick={randomizeSeed}
              >
                Roll
              </button>
            </div>
          </label>

          <label className="field-label">
            <span>Steps: {settings.steps}</span>
            <input
              name="steps"
              type="range"
              min="10"
              max="60"
              value={settings.steps}
              onChange={(e) => updateSetting("steps", e.target.value)}
            />
          </label>

          <label className="field-label">
            <span>Guidance: {settings.scale}</span>
            <input
              name="scale"
              type="range"
              min="3"
              max="15"
              step="0.5"
              value={settings.scale}
              onChange={(e) => updateSetting("scale", e.target.value)}
            />
          </label>

          <label className="field-label sm:col-span-2">
            <span>Quality prompt</span>
            <input
              name="a_prompt"
              type="text"
              value={settings.a_prompt}
              onChange={(e) => updateSetting("a_prompt", e.target.value)}
            />
          </label>

          <label className="field-label sm:col-span-2">
            <span>Negative prompt</span>
            <input
              name="n_prompt"
              type="text"
              value={settings.n_prompt}
              onChange={(e) => updateSetting("n_prompt", e.target.value)}
            />
          </label>

          <input type="hidden" name="eta" value={settings.eta} />
        </div>
      </details>
    </form>
  );
}
