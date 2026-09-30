---
title: "This site is now a solar system"
summary: "The homepage became a clickable orrery. Every planet is a section, and the physics is mostly lies."
date: 2026-09-30
tags: ["note"]
notion_id: "3eb499aa-39c9-8124-939c-efa6334ba40b"
---

The homepage used to be a picture of Earth. Now it is a small solar system you can drag around, and every body in it is a part of this site:

- **The Sun** is home.

- **Earth** is Projects.

- **Mars** is Races. Red, dusty, and slightly painful. It fits.

- **The asteroid belt** is Notes, which is honest: a few rocks, mostly empty space.

- **Saturn** is Reading. The arc of its ring shows how far I am through the series on my shelf.

Click a planet and the camera flies to it and opens a card with a link. Double\-tap empty space to fly back out.

## The rules are real, the astronomy is not

Size follows how much is in a section. Orbit speed follows how recently it changed, worked out in your browser against today's date. So if I stop racing, Mars slows down. If I stop reading, Saturn drifts. The site shames me in real time.

## Things that took longer than they should have

- **Saturn's ring.** A planet in focus is framed by what is drawn, not by its sphere. For Saturn that means the ring, so the sphere had to shrink to about 40% of the room to keep the ring clear of the text.

- **The camera chasing a moving planet.** Easing toward the planet's position left the camera 0.4 to 1.4 units behind it, which was more than the gap to the card.

- **Double\-tap.** A 500 ms window, a 40 px slop for fingers, and a rule that the Sky card waits until the window closes, so one tap cannot do two things.

- **The angle.** The camera looks down 30 degrees, not 21. It makes the orbits rounder and fills the hero better.

## If you cannot see it

The static Earth is still there. It is the first thing that paints, and it stays if your browser asks for reduced motion or data saving, or if WebGL fails. three.js loads later, only when the hero is near view. Every section is also a plain link under the picture.

Textures are from Solar System Scope \(CC BY 4.0\), based on NASA imagery.
