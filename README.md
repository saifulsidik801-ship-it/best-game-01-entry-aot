# Skyfall Slayers — Skyhook Arcade

[![make.fun](https://img.shields.io/badge/competition-make.fun%20best--game--01-7ef0c1)](https://make.fun)
[![Node](https://img.shields.io/badge/node-%3E%3D22.18-339933)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Skyfall Slayers** is a complete arcade game for [make.fun](https://make.fun)'s
`best-game-01` bounty. Giant Ravagers march on Aurelia, the last walled city.
You are a soldier of the Skyward Corps: swing through the rooftops on skyhook
gear, slash the glowing napes of the Ravagers marching on Wall Aegis, and
survive 10 waves — ending with the Colossus itself.

## Play

- **Hold mouse** — fire your skyhook grapple at rooftops and swing
- **Space / J** — slash with your dual blades (only the red-glowing **nape** kills)
- **A / D** — run, **W** — jump (reels the cable in while swinging)
- **P** — pause, **M** — mute, **1–4** — pick your soldier on the title screen

Ravagers that reach the Wall tear at it; if Wall Aegis falls — or a Ravager grabs
you three times — the city falls. Clear wave 10 and the Wall stands.

## The cast

Playable, all original designs: **Kael Voss** (dark auburn shaggy hair,
green eyes), **Sera Quinn** (black bob, deep teal scarf), **Dain Mercer**
(black undercut, grey eyes, dark navy ascot) and **Milo Thorne** (blond bangs,
teal eyes). Pippa, Theo, Marcus, Wren and Alden back you up from the squad
strip and the radio. Boss waves bring **The Huntress** (5), **The Mauler**
(7), **The Bulwark** (9) and **The Colossus** (10).

All art is drawn in code on canvas — no stills, no photos, no network requests.
Sound is synthesised WebAudio. The game runs fully offline from static files.

## Run it

```sh
node serve.ts   # then open http://localhost:8080
```

Screenshots are deterministic renders of the game itself:
`?shot=title|play|boss|victory&seed=7`.

## Referral

Built for make.fun — join with referral code **`59gqp20q`**.

## License

MIT — see [LICENSE](LICENSE).
