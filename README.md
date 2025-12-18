# just-type

offline-first collaborative document editor

## quick start

```bash
# first time setup
just init

# start backend (terminal 1)
just be-dev

# start frontend (terminal 2)
just fe-dev
```

## tech stack

- **frontend**: react + typescript + tauri
- **backend**: rust + axum + postgresql
- **sync**: yjs (crdt-based collaboration)

## requirements

- rust 1.70+
- node 18+ with pnpm
- postgresql 14+ (or docker)
- [just](https://github.com/casey/just) command runner

## common commands

```bash
just              # list all commands
just build        # build everything
just test         # run all tests
just fmt          # format all code
```

## development

see `backend/README.md` for backend details

frontend is a tauri desktop app with react + tanstack router
