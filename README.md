# Titan Slayer — Attack on Titan ODM Arcade

[![make.fun](https://img.shields.io/badge/competition-make.fun%20best--game--01-7ef0c1)](https://make.fun)
[![Node](https://img.shields.io/badge/node-%3E%3D22.18-339933)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Titan Slayer** is a complete arcade game for [make.fun](https://make.fun)'s
`best-game-01` bounty: swing through Shiganshina on ODM gear as Eren, Mikasa,
Levi or Armin, slash the glowing napes of the Titans marching on Wall Maria,
and survive 10 waves — ending with the Colossal Titan itself.

## Play

- **Hold mouse** — fire your ODM grapple at rooftops and swing
- **Space / J** — slash with your dual blades (only the red-glowing **nape** kills)
- **A / D** — run, **W** — jump (reels the cable in while swinging)
- **P** — pause, **M** — mute, **1–4** — pick your soldier on the title screen

Titans that reach the Wall tear at it; if Wall Maria falls — or a Titan grabs
you three times — humanity loses. Clear wave 10 and the Wall stands.

## The cast

Playable, drawn faithfully from the series: **Eren Yeager** (shaggy brown hair,
green eyes), **Mikasa Ackerman** (black bob, red scarf), **Levi Ackerman**
(black undercut, grey eyes, white ascot) and **Armin Arlert** (blond bangs,
blue eyes). Sasha, Connie, Jean, Hange and Erwin back you up from the squad
strip and the radio. Boss waves bring the **Female Titan** (5), the **Beast
Titan** (7), the **Armored Titan** (9) and the **Colossal Titan** (10).

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
