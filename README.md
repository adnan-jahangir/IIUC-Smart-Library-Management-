# IIUC Smart Library Management

Quick start and contributor notes.

## Environment setup

- Copy `.env.example` to `.env` in the repository root:

```bash
cp .env.example .env
```

- Open `.env` and replace the placeholder values (for example, `your_mongodb_uri` and `your_jwt_secret`) with your local credentials.
- Never commit real secrets; `.env` is ignored by git.

If you need a per-package example, check `backend/.env` and the top-level `.env.example`.
