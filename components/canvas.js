import * as React from "react";
import { useEffect } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";

import {
  Eraser as EraserIcon,
  Pencil as PencilIcon,
  Redo as RedoIcon,
  RotateCcw as RestoreIcon,
  Trash as TrashIcon,
  Undo as UndoIcon,
} from "lucide-react";

const STROKE_COLORS = [
  { name: "Ink", value: "black" },
  { name: "Block", value: "#475569" },
  { name: "Warm", value: "#d97706" },
  { name: "Cool", value: "#2563eb" },
];

function getStoredPaths() {
  try {
    return window.localStorage?.getItem("paths");
  } catch (e) {
    return null;
  }
}

function setStoredPaths(paths) {
  try {
    window.localStorage?.setItem("paths", JSON.stringify(paths, null, 2));
  } catch (e) {
    return;
  }
}

function clearStoredPaths() {
  try {
    window.localStorage?.removeItem("paths");
  } catch (e) {
    return;
  }
}

export default function Canvas({
  startingPaths,
  onScribble,
  scribbleExists,
  setScribbleExists,
}) {
  const canvasRef = React.useRef(null);
  const [strokeWidth, setStrokeWidth] = React.useState(4);
  const [strokeColor, setStrokeColor] = React.useState("black");
  const [tool, setTool] = React.useState("pen");
  const [savedPathsAvailable, setSavedPathsAvailable] = React.useState(false);

  useEffect(() => {
    // Hack to work around Firfox bug in react-sketch-canvas
    // https://github.com/vinothpandian/react-sketch-canvas/issues/54
    document
      .querySelector("#react-sketch-canvas__stroke-group-0")
      ?.removeAttribute("mask");

    setSavedPathsAvailable(Boolean(getStoredPaths()));
    const timeoutId = setTimeout(loadStartingPaths, 100);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    canvasRef.current?.eraseMode(tool === "eraser");
  }, [tool]);

  async function loadStartingPaths() {
    if (!startingPaths?.length) return;

    try {
      await canvasRef.current.loadPaths(startingPaths);
      setScribbleExists(true);
      const data = await canvasRef.current.exportImage("png");
      onScribble(data);
    } catch (e) {
      console.error("Could not load starting paths", e);
    }
  }

  async function restoreSavedPaths() {
    const savedPaths = getStoredPaths();
    if (!savedPaths) return;

    try {
      const paths = JSON.parse(savedPaths);
      await canvasRef.current.resetCanvas();
      await canvasRef.current.loadPaths(paths);
      setScribbleExists(paths.length > 0);
      onChange();
    } catch (e) {
      console.error("Could not restore saved paths", e);
    }
  }

  const onChange = async () => {
    const paths = await canvasRef.current.exportPaths();
    setStoredPaths(paths);
    setSavedPathsAvailable(paths.length > 0);

    if (!paths.length) {
      return;
    }

    setScribbleExists(true);

    const data = await canvasRef.current.exportImage("png");
    onScribble(data);
  };

  const undo = () => {
    canvasRef.current.undo();
  };

  const redo = () => {
    canvasRef.current.redo();
  };

  const reset = () => {
    setScribbleExists(false);
    setSavedPathsAvailable(false);
    clearStoredPaths();
    onScribble(null);
    canvasRef.current.resetCanvas();
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-md border border-gray-200 bg-white p-1">
          <button
            type="button"
            className={`tool-button ${tool === "pen" ? "tool-button-active" : ""}`}
            onClick={() => setTool("pen")}
            title="Draw"
            aria-label="Draw"
          >
            <PencilIcon className="icon-only" />
          </button>
          <button
            type="button"
            className={`tool-button ${
              tool === "eraser" ? "tool-button-active" : ""
            }`}
            onClick={() => setTool("eraser")}
            title="Erase"
            aria-label="Erase"
          >
            <EraserIcon className="icon-only" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {STROKE_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              className={`color-swatch ${
                strokeColor === color.value ? "color-swatch-active" : ""
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
              aria-label={`${color.name} stroke`}
              onClick={() => {
                setStrokeColor(color.value);
                setTool("pen");
              }}
            />
          ))}
        </div>

        <label className="flex min-w-[150px] items-center gap-2 text-sm text-gray-500">
          <span>Size</span>
          <input
            type="range"
            min="2"
            max="16"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="tool-range"
          />
        </label>
      </div>

      <div className="relative">
        {scribbleExists || (
          <div>
            <div className="absolute grid w-full h-full p-3 place-items-center pointer-events-none text-xl">
              <span className="opacity-40">Draw something here.</span>
            </div>
          </div>
        )}

        <ReactSketchCanvas
          ref={canvasRef}
          className="w-full aspect-square border-none cursor-crosshair"
          strokeWidth={strokeWidth}
          strokeColor={strokeColor}
          eraserWidth={strokeWidth * 2}
          onChange={onChange}
          withTimestamp={true}
        />
      </div>

      {(scribbleExists || savedPathsAvailable) && (
        <div className="animate-in fade-in duration-700 text-left">
          <button className="lil-button" onClick={undo}>
            <UndoIcon className="icon" />
            Undo
          </button>
          <button className="lil-button" onClick={redo}>
            <RedoIcon className="icon" />
            Redo
          </button>
          {savedPathsAvailable && (
            <button className="lil-button" onClick={restoreSavedPaths}>
              <RestoreIcon className="icon" />
              Restore last
            </button>
          )}
          <button className="lil-button" onClick={reset}>
            <TrashIcon className="icon" />
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
