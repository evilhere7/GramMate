Place a local MP4 to test feed playback and review browser auth test results.

- To enable local video playback for dev, put a sample mp4 at:
  GramMate/public/sample.mp4

- Saved browser auth test output files are in this folder, e.g.:
  auth-browser-test-1781077353673.json

Notes:
- The frontend `platformData.js` now references `/sample.mp4` for mock videos.
- If you add `sample.mp4` to `GramMate/public/`, reload the Vite dev server and the feed will show playable local clips.
