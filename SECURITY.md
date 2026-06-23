# Security Notes

- Do not commit production snapshots or secrets.
- Keep `data/generated/` private at deploy time.
- Treat Hermes session data as sensitive user data.
- If public access becomes too broad, add authentication before expanding scope.
