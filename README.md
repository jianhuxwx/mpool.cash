# mpool.cash – Bitcoin Cash mempool explorer

This repository powers [mpool.cash](https://mpool.cash), a Bitcoin Cash blockchain explorer and mempool visualizer.

> **Important notice**  
> mpool.cash is an independent fork of the [Mempool Open Source Project](https://github.com/mempool/mempool).  
> We are not affiliated with, endorsed by, or sponsored by mempool.space or the Mempool Foundation.  
> Our objective is to bring the familiar mempool.space experience to the Bitcoin Cash community.

## Project overview

- **Backend (`backend/`)**: Node.js + TypeScript service that indexes Bitcoin Cash node data, maintains statistics, and exposes the `/api/v1/**` REST + WebSocket APIs now tailored for BCH (cashaddr support, 32 MB blocks, BCH price feeds, etc.).
- **Frontend (`frontend/`)**: Angular application that consumes the backend and presents the mpool.cash UI with Bitcoin Cash branding, pricing, fee units, and address formats.
- **Infrastructure (`production/`, `nginx.conf`)**: Reference configs for deploying the stack behind nginx or systemd. These examples now assume Bitcoin Cash defaults.

Refer to the upstream mempool project for in-depth architecture details—the majority still applies—while this fork layers on the Bitcoin Cash-specific behavior.

## Getting started

1. **Clone the repository**
   ```bash
   git clone https://github.com/mpool-cash/mpool.cash.git
   cd mpool.cash
   ```
2. **Backend setup**
   - Review `backend/README.md` and copy `backend/mempool-config.bch.sample.json` to `backend/mempool-config.json`.
   - Point the config at your Bitcoin Cash full node (and optional Electrum/Fulcrum server), then run:
     ```bash
     cd backend
     npm install --no-install-links
     npm run build
     npm run start:bch
     ```
3. **Frontend setup**
   - Generate the runtime config and start the dev server:
     ```bash
     cd ../frontend
     npm install
     npm run start
     ```
   - The app proxies API calls to `https://api.mpool.cash` by default. Set `API_BASE_URL` in `mempool-frontend-config.json` if you are running the backend locally.

For production deployment, mirror the steps above and consult the files in `production/` plus `nginx.conf` for reverse-proxy guidance.

## Contributing

We welcome pull requests that improve Bitcoin Cash support, performance, or documentation. Please review `CONTRIBUTING.md` before submitting changes.

## License

This fork retains the original project licensing:

- Source code: [GNU Affero General Public License v3.0](./COPYING.md)
- Documentation: [Creative Commons Attribution-ShareAlike 4.0](./LICENSE)

If you use mpool.cash in production, we kindly ask you to credit the upstream Mempool Open Source Project and this fork.