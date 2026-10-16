# JelanWha
Responsive React + Vite manhwa reader with an Express API adapter.

## Deploy to Render (single service)
- Create a GitHub repository and upload all project files, preserving the `src/` and `server/` folders.
- In Render, create **New > Web Service** and connect the repository.
- Runtime: Node. Build command: `npm install && npm run build`. Start command: `npm start`.
- No environment variable is required for the default API. Optional: `SHNGM_API_BASE` to change the upstream API base.
- Render will provide an `onrender.com` URL after a successful deploy.

## Local development
- `npm install`
- `npm run dev`

## Notes
The upstream Shinigami API and chapter image URLs are external dependencies and may change or be unavailable. Check that you have the right to access and display any manga/chapter content.
