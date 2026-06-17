# Orbit Trash — Panel Art Shot List (Edition #2)

This is the "image for each sentence" checklist for **Orbit Trash**, mirroring Edition 1's
73 hand-placed panels in `src/assets/story/`. Every story panel currently shows a
**placeholder** (one of the 3 existing orbit images). Generate the shots below, drop them
into `src/assets/orbit-story/`, then swap the placeholder in `src/lib/orbit/data.ts`.

## How to wire a finished image
1. Save the file as `src/assets/orbit-story/chN-MM.jpg` (chapter N, panel MM — see tables).
2. In `src/lib/orbit/data.ts`, add an import at the top, e.g.
   `import c1p1 from "@/assets/orbit-story/ch1-01.jpg";`
3. Replace that panel's placeholder (`PH_STATION` / `PH_HERO` / `PH_BOSS`) with the import:
   `{ image: c1p1, speaker: "Narrator", text: "…" }`

Panels are numbered flat per chapter: **intro panels first, then outro panels.**

## Style guide (prepend to every prompt for a consistent look)
> Gritty cartoon **comic-book panel**, thick black ink outlines, cel shading, dramatic
> neon-noir lighting, 4:3 aspect. Hero is **Scrapper**, a scrappy gray tabby alley cat in a
> dented makeshift space helmet. Setting is **STAR-BIN 9**, an orbital sanitation station —
> zero-gravity, floating garbage, red alarm lights, magenta/teal accents. Villains are
> raccoon space-pirates; the boss **Captain Racc-X** is a huge scarred raccoon with a
> bottle-cap crown. Punchy, comedic, a little grimy.

---

## Chapter 1 — Wrong Dumpster  *(dive: Airlock Intake)*
| File | Beat | Caption | Shot |
|---|---|---|---|
| ch1-01.jpg | intro | "Behind the research lab, the dumpster hummed like a fridge full of bees." | Night alley behind a research lab; one dumpster glowing eerie blue, steam rising; gray tabby approaching in silhouette. |
| ch1-02.jpg | intro | "Sniff. Tuna. Electricity. Trouble." | Close-up of the tabby sniffing the glowing blue dumpster, whiskers twitching, blue neon in his eyes. |
| ch1-03.jpg | intro | "The crew voted no. Scrapper jumped in anyway." | A few alley cats shaking their heads "no" as Scrapper leaps into the open glowing bin. |
| ch1-04.jpg | intro | "(Worst case, I find a snack. Best case, I find a BIG snack.)" | Cat mid-leap into the blue light, cocky grin, paws outstretched. |
| ch1-05.jpg | intro | "The lid slammed. The floor shook. The sky got very, very close." | Blinding flash; the lid slams, ground quakes, stars rushing in through a tearing sky. |
| ch1-06.jpg | intro | "…that's not the floor. WHY ISN'T THAT THE FLOOR—" | Cat free-falling UP into space, fur on end, comically panicked, Earth shrinking below. |
| ch1-07.jpg | outro | "By morning, the alley was gone. The trash was floating." | Dawn over an empty alley; the dumpster gone; a few wrappers drifting weightless. |
| ch1-08.jpg | outro | "Mew. Okay. New plan. Survive." | The cat floating in zero-G among trash, helmet fogged, newly determined. |
| ch1-09.jpg | outro | "A hatch hissed open above a sea of drifting garbage. Welcome to STAR-BIN 9." | A huge hatch hissing open above an ocean of floating garbage; epic establishing shot of the station. |

## Chapter 2 — Star-Bin 9  *(dive: Galley Waste Ring)*
| File | Beat | Caption | Shot |
|---|---|---|---|
| ch2-01.jpg | intro | "Alarms blink red. Trash drifts in midair like lazy snowflakes." | Station interior, red alarm lights, garbage drifting like snow. |
| ch2-02.jpg | intro | "Crew. Stay close. Don't lick anything." | Scrapper in his helmet motioning to his floating crew to stay close. |
| ch2-03.jpg | intro | "Somewhere in the dark, something mechanical sorts garbage. Click. Whirr. Crunch." | Dark maintenance shaft; a mechanical claw-arm sorting trash, sparks. |
| ch2-04.jpg | intro | "That's a cafeteria. Where there's a cafeteria, there's leftovers." | Cat peeking into a zero-G cafeteria full of floating food trays. |
| ch2-05.jpg | intro | "And where there's leftovers… there's me." | Close-up greedy grin, floating snacks reflected in his eyes. |
| ch2-06.jpg | outro | "The galley ring went quiet. The snacks did not survive." | Trashed, empty galley ring; crumbs floating; the aftermath. |
| ch2-07.jpg | outro | "Floating food. No gravity tax. I could get used to this." | Cat lounging mid-air, patting a full belly, content. |
| ch2-08.jpg | outro | "But the station had noticed the cat. And it was hungry too." | An ominous mechanical sensor-eye glowing in the dark, watching. |

## Chapter 3 — No Gravity, No Rules  *(dive: Cargo Chute 6)*
| File | Beat | Caption | Shot |
|---|---|---|---|
| ch3-01.jpg | intro | "Rule one of the alley: always land on your feet." | Cat clinging to a wall, lecturing, one paw raised. |
| ch3-02.jpg | intro | "Up here? There are no feet. There is no down." | Cat realizing there's no floor, peering into a starry void, gulp. |
| ch3-03.jpg | intro | "He pushed off a crate. He kept going. And going." | Cat drifting helplessly away from a crate, flailing. |
| ch3-04.jpg | intro | "(Okay. Okay. I totally meant to do that.)" | Cat spinning mid-air but playing it cool. |
| ch3-05.jpg | intro | "He pounced sideways off a conveyor. It worked. Sort of." | Cat pouncing sideways off a glowing conveyor belt, motion lines. |
| ch3-06.jpg | outro | "By the third crate, the sideways pounce looked almost graceful." | Cat bouncing gracefully between crates in a confident arc. |
| ch3-07.jpg | outro | "Zero-G Dodge. Patent pending. Don't tell the raccoons." | Cat striking a cool zero-G dodge pose, wink to camera. |
| ch3-08.jpg | outro | "The cargo chute spat him toward the luxury deck. Fancy." | A cargo chute launching the cat toward shiny golden luxury doors. |

## Chapter 4 — Luxury Trash  *(dive: Luxury Deck Disposal)*
| File | Beat | Caption | Shot |
|---|---|---|---|
| ch4-01.jpg | intro | "Perfume clouds. Untouched lobster. Gold-trim wrappers, still warm." | Opulent luxury disposal: perfume clouds, floating lobster, gold wrappers. |
| ch4-02.jpg | intro | "Who throws this away?? Mew. I respect them. I also hate them." | Cat clutching a discarded whole lobster, conflicted awe. |
| ch4-03.jpg | intro | "The luxury deck disposal was a buffet pretending to be garbage." | Wide shot of a glamorous garbage buffet floating in zero-G. |
| ch4-04.jpg | intro | "Note to self: rich people are bad at finishing their food. Good for me." | Cat stuffing gourmet trash into his cheeks, gold chandelier behind. |
| ch4-05.jpg | outro | "Premium junk. Tastes the same as regular junk. Just judgier." | Chubby, satisfied cat floating with a toothpick, smug. |
| ch4-06.jpg | outro | "Scrapper left three pounds heavier and twice as smug." | Cat drifting past gilded mirrors, visibly rounder. |
| ch4-07.jpg | outro | "Beyond the gold doors, something growled. Something that hadn't eaten in a while." | Ominous shadow with glowing eyes growling behind huge gold doors. |

## Chapter 5 — The Waste Ring  *(dive: Biohazard Bin)*
| File | Beat | Caption | Shot |
|---|---|---|---|
| ch5-01.jpg | intro | "Tribute time, fleabags. Caps. Snacks. Now." | A raccoon space-pirate with eyepatch and trash-hook demanding tribute. |
| ch5-02.jpg | intro | "We already did this back home. We won." | Cat unimpressed, arms crossed, floating. |
| ch5-03.jpg | intro | "The waste ring crawled with raccoon pirates and things that used to be lunch." | Grimy waste ring crawling with raccoon pirates and mutant leftovers. |
| ch5-04.jpg | intro | "This is OUR bin, kitten. Float along." | Raccoon pirate shoving a clawed hand toward the camera. |
| ch5-05.jpg | intro | "Make me, trash panda." | Cat baring claws, fierce grin, ready to brawl. |
| ch5-06.jpg | outro | "The pirates scattered. Their loot did not." | Raccoon pirates fleeing; dropped loot floating in their wake. |
| ch5-07.jpg | outro | "Tell your captain the alley cat says hi." | Cat tipping an imaginary hat, loot bag over shoulder. |
| ch5-08.jpg | outro | "…you'll regret that. Racc-X eats cats for breakfast." | A defeated pirate pointing upward in warning, fearful. |

## Chapter 6 — Captain Racc-X  *(dive: Racc-X Waste Throne — BOSS)*
| File | Beat | Caption | Shot |
|---|---|---|---|
| ch6-01.jpg | intro | "Atop a throne of crushed satellites sat the king of the orbital bins." | A throne built of crushed satellites; a regal villain silhouette atop it. |
| ch6-02.jpg | intro | "This station's trash belongs to me, kitten." | Captain Racc-X: huge scarred raccoon with a bottle-cap crown, sneering. |
| ch6-03.jpg | intro | "Then I'll just take it twice." | The small cat squaring up defiantly before the giant raccoon king. |
| ch6-04.jpg | intro | "Cute claws. Bad orbit." | Racc-X laughing, swiping a massive clawed paw. |
| ch6-05.jpg | intro | "Six pirates. One crown. One very confident cat." | Six pirates surrounding one tiny, confident cat; crown gleaming. |
| ch6-06.jpg | outro | "The crown drifted free. Scrapper snatched it out of the air." | The crown knocked loose, spinning in zero-G; cat snatching it mid-air. |
| ch6-07.jpg | outro | "Heavy is the head. Good thing I skip leg day." | Cat wearing the oversized crown at a tilt, smug. |
| ch6-08.jpg | outro | "This isn't over, fleabag. The station won't let you leave." | Beaten Racc-X snarling a final threat; station lights flaring red. |

## Chapter 7 — Core Compactor  *(dive: Core Compactor — FINAL)*
| File | Beat | Caption | Shot |
|---|---|---|---|
| ch7-01.jpg | intro | "Klaxons. Red light. The walls began to move INWARD." | Klaxons, red light, massive walls grinding inward; the cat tiny between them. |
| ch7-02.jpg | intro | "GO. GO. GO. Bring the snacks!" | Cat sprinting in zero-G, snacks bundled in his arms, panic. |
| ch7-03.jpg | intro | "STAR-BIN 9 had decided everything would be smaller. Including the cat." | The compactor core crushing trash into cubes, sparks, claustrophobic. |
| ch7-04.jpg | intro | "(Run. Don't look at the walls. Don't look at the WALLS.)" | Close on the cat's wide eyes reflecting the closing walls. |
| ch7-05.jpg | outro | "The compactor groaned shut on empty air. The cat was already gone." | The compactor slamming shut on empty air; cat already escaped. |
| ch7-06.jpg | outro | "Escape pod. Soda can. Same energy." | Cat squeezing into a ridiculous soda-can escape pod, grin. |
| ch7-07.jpg | outro | "He grabbed the key, the crown, and a suspicious amount of snacks." | Cat clutching a glowing key, the crown, and armfuls of snacks. |

## Chapter 8 — Trash Moon  *(dive: Junk Reentry)*
| File | Beat | Caption | Shot |
|---|---|---|---|
| ch8-01.jpg | intro | "The escape pod was made of a soda can and a dream." | A tiny ridiculous escape pod made from a soda can, drifting in space. |
| ch8-02.jpg | intro | "Wait. That's not Earth." | Cat at the porthole, confused, staring out. |
| ch8-03.jpg | intro | "Below them, a moon made entirely of garbage rolled into view." | A giant moon made entirely of garbage rolling into view; awe. |
| ch8-04.jpg | intro | "…is it weird that I'm hungry again?" | Cat licking his lips at the trash moon, hungry sparkle in eye. |
| ch8-05.jpg | outro | "Somewhere down there, a new alley waited. A bigger one." | The trash moon's surface — a vast new alley awaiting. |
| ch8-06.jpg | outro | "Crew. Buckle up. We're divin'." | Cat buckling a seatbelt, fierce grin, crew behind him. |
| ch8-07.jpg | outro | "TO BE CONTINUED… (Edition #3 — Trash Moon)" | Dramatic "TO BE CONTINUED" card over the trash moon; Edition #3 tease. |

---

**Total: 62 panels** (matches the ~per-sentence density of Edition 1). Until they're filled
in, the placeholders keep Orbit Trash fully playable.
