# Scribble Diffusion

Turn a sketch into a refined image with AI.

Scribble Diffusion is a small Next.js app powered by Replicate ControlNet. Draw or edit a scribble, describe the image you want, then run generation with optional experiment controls for variations, guidance, seeds, and ControlNet structure modes.

## Features

- Draw directly in the browser with pen, eraser, brush size, color swatches, undo, redo, clear, and restore-last-sketch tools.
- Start from a seeded example scribble and prompt, or clear the canvas and draw from scratch.
- Add prompt style chips such as photorealistic, watercolor, storybook illustration, product concept, isometric, and cinematic lighting.
- Use the Experiment lab to adjust ControlNet structure, output count, resolution, seed, diffusion steps, guidance scale, quality prompt, and negative prompt.
- Generate one image or a 4-image variation grid from the same sketch and prompt.
- Compare the input scribble against outputs, view generation metadata, and copy share links.
- Persist completed predictions through Replicate webhooks when database and webhook host configuration are available.

## How It Works

1. The browser exports the canvas as a PNG data URI.
2. The PNG is uploaded through Upload.io.
3. The app posts the image URL, prompt, and experiment settings to `pages/api/predictions`.
4. The API validates supported ControlNet inputs and creates a Replicate prediction.
5. The client polls `pages/api/predictions/[id]` until the prediction succeeds or fails.
6. If a webhook host and database are configured, completed predictions are saved for share pages and the `/scribbles` gallery.

## Development

Install a recent version of Node.js, then configure your Replicate token:

```bash
echo "REPLICATE_API_TOKEN=<your-token-here>" > .env.local
```

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Environment Variables

- `REPLICATE_API_TOKEN`: required for generation.
- `DATABASE_URL`: required only for persisted shared scribbles and the gallery.
- `VERCEL_URL`: used in production to build the Replicate webhook URL.
- `NGROK_HOST`: optional local webhook host for development when testing Replicate webhooks.

If neither `VERCEL_URL` nor `NGROK_HOST` is set, generation still works, but the API skips webhook registration for local runs.

## Scripts

```bash
npm run dev      # Start Next.js locally
npm run lint     # Run Next.js linting
npm run build    # Build the production app
npm run test     # Run lint and build
```

## Tech Stack

- [Next.js](https://nextjs.org/) pages and API routes
- [Replicate](https://replicate.com/) for ControlNet predictions
- [ControlNet](https://arxiv.org/abs/2302.05543) for image generation with structural conditioning
- [react-sketch-canvas](https://www.npmjs.com/package/react-sketch-canvas) for browser drawing
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Prisma](https://www.prisma.io/) for optional prediction persistence
- [Upload.io](https://upload.io/) for input image uploads

## Notes

The default flow remains simple: draw, prompt, and click Go. The Experiment lab is optional and maps to the existing Replicate ControlNet model fields, with server-side validation to keep unsupported values out of prediction requests.
