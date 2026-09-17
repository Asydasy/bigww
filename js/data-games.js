"use strict";

/* BigWW - Baza gier (204 tytuly) -> GAMES */

/* =========================================================
   1. BAZA GIER
   format: nazwa | gatunek | tryb | platformy | popularność(1-5)
========================================================= */
const GAME_DATA = `
Counter-Strike 2|FPS|PvP|PC|5
VALORANT|FPS|PvP|PC|5
Call of Duty: Warzone|FPS|PvP|PC,PS,XBOX|5
Call of Duty: Black Ops 6|FPS|PvP|PC,PS,XBOX|5
Call of Duty: Modern Warfare III|FPS|PvP|PC,PS,XBOX|4
Apex Legends|FPS|PvP|PC,PS,XBOX|5
Overwatch 2|FPS|PvP|PC,PS,XBOX,SWITCH|4
Rainbow Six Siege|FPS|PvP|PC,PS,XBOX|4
Battlefield 2042|FPS|PvP|PC,PS,XBOX|3
Battlefield V|FPS|PvP|PC,PS,XBOX|3
Battlefield 1|FPS|PvP|PC,PS,XBOX|3
Escape from Tarkov|FPS|PvPvE|PC|4
Hunt: Showdown 1896|FPS|PvPvE|PC,PS,XBOX|3
The Finals|FPS|PvP|PC,PS,XBOX|3
Destiny 2|FPS|PvE|PC,PS,XBOX|4
Halo Infinite|FPS|PvP|PC,XBOX|3
Team Fortress 2|FPS|PvP|PC|3
Titanfall 2|FPS|PvP|PC,PS,XBOX|2
Insurgency: Sandstorm|FPS|PvP|PC,PS,XBOX|3
Squad|FPS|PvP|PC|3
Arma 3|FPS|Symulacja|PC|3
Arma Reforger|FPS|Symulacja|PC,XBOX|3
Hell Let Loose|FPS|PvP|PC,PS,XBOX|3
Ready or Not|FPS|Co-op|PC|3
PAYDAY 3|FPS|Co-op|PC,PS,XBOX|2
PAYDAY 2|FPS|Co-op|PC,PS,XBOX|3
Left 4 Dead 2|FPS|Co-op|PC|3
Deep Rock Galactic|FPS|Co-op|PC,PS,XBOX|4
Helldivers 2|Shooter|Co-op|PC,PS|5
Warframe|Shooter|Co-op|PC,PS,XBOX,SWITCH|4
Marvel Rivals|Shooter|PvP|PC,PS,XBOX|4
Delta Force|FPS|PvP|PC|3
Splitgate 2|FPS|PvP|PC,PS,XBOX|2
Paladins|FPS|PvP|PC,PS,XBOX,SWITCH|2
Enlisted|FPS|PvP|PC,PS,XBOX|2
War Thunder|Symulacja|PvP|PC,PS,XBOX|4
World of Tanks|Symulacja|PvP|PC,PS,XBOX|4
World of Warships|Symulacja|PvP|PC|3
Crossout|Akcja|PvP|PC,PS,XBOX|2
PUBG: Battlegrounds|Battle Royale|PvP|PC,PS,XBOX|4
Fortnite|Battle Royale|PvP|PC,PS,XBOX,SWITCH,MOBILE|5
Naraka: Bladepoint|Battle Royale|PvP|PC,PS,XBOX|3
Rust|Survival|PvP|PC|5
DayZ|Survival|PvP|PC,PS,XBOX|4
SCUM|Survival|PvP|PC|3
ARK: Survival Ascended|Survival|PvPvE|PC,PS,XBOX|4
ARK: Survival Evolved|Survival|PvPvE|PC,PS,XBOX|3
7 Days to Die|Survival|Co-op|PC,PS,XBOX|4
Valheim|Survival|Co-op|PC,XBOX|4
V Rising|Survival|PvPvE|PC,PS|3
Conan Exiles|Survival|PvPvE|PC,PS,XBOX|3
The Forest|Survival|Co-op|PC,PS|3
Sons of the Forest|Survival|Co-op|PC|4
Green Hell|Survival|Co-op|PC,PS,XBOX|3
Raft|Survival|Co-op|PC|3
Grounded|Survival|Co-op|PC,PS,XBOX,SWITCH|3
Icarus|Survival|Co-op|PC|2
Project Zomboid|Survival|Co-op|PC|4
Minecraft|Sandbox|Co-op|PC,PS,XBOX,SWITCH,MOBILE|5
Terraria|Sandbox|Co-op|PC,PS,XBOX,SWITCH,MOBILE|4
Core Keeper|Sandbox|Co-op|PC,PS,XBOX,SWITCH|3
Palworld|Survival|Co-op|PC,PS,XBOX|4
Enshrouded|Survival|Co-op|PC,PS,XBOX|3
Once Human|Survival|PvPvE|PC,MOBILE|3
No Man's Sky|Sandbox|Co-op|PC,PS,XBOX,SWITCH|4
Astroneer|Sandbox|Co-op|PC,PS,XBOX,SWITCH|3
Space Engineers|Sandbox|Co-op|PC,XBOX|3
Satisfactory|Sandbox|Co-op|PC|4
Factorio|Strategia|Co-op|PC,SWITCH|4
Stardew Valley|Symulacja|Co-op|PC,PS,XBOX,SWITCH,MOBILE|4
Don't Starve Together|Survival|Co-op|PC,PS,XBOX|3
Garry's Mod|Sandbox|Co-op|PC|3
Roblox|Sandbox|Co-op|PC,PS,XBOX,MOBILE|4
Dota 2|MOBA|PvP|PC|5
League of Legends|MOBA|PvP|PC|5
Teamfight Tactics|Strategia|PvP|PC,MOBILE|3
Deadlock|MOBA|PvP|PC|4
SMITE 2|MOBA|PvP|PC,PS,XBOX|3
Heroes of the Storm|MOBA|PvP|PC|2
Predecessor|MOBA|PvP|PC,PS,XBOX|2
Pokémon UNITE|MOBA|PvP|SWITCH,MOBILE|2
World of Warcraft|MMO|PvE|PC|5
Final Fantasy XIV|MMO|PvE|PC,PS,XBOX|4
Guild Wars 2|MMO|PvE|PC|4
Lost Ark|MMO|PvE|PC|3
New World: Aeternum|MMO|PvPvE|PC,PS,XBOX|3
Black Desert Online|MMO|PvPvE|PC,PS,XBOX|3
The Elder Scrolls Online|MMO|PvE|PC,PS,XBOX|4
Old School RuneScape|MMO|PvE|PC,MOBILE|4
RuneScape|MMO|PvE|PC,MOBILE|3
Albion Online|MMO|PvPvE|PC,MOBILE|3
EVE Online|MMO|PvPvE|PC|3
Star Wars: The Old Republic|MMO|PvE|PC|2
Throne and Liberty|MMO|PvPvE|PC,PS,XBOX|3
Path of Exile 2|RPG akcji|Co-op|PC,PS,XBOX|5
Path of Exile|RPG akcji|Co-op|PC,PS,XBOX|4
Diablo IV|RPG akcji|Co-op|PC,PS,XBOX|4
Diablo III|RPG akcji|Co-op|PC,PS,XBOX,SWITCH|3
Last Epoch|RPG akcji|Co-op|PC,PS,XBOX|3
Grim Dawn|RPG akcji|Co-op|PC,PS,XBOX|2
Warhammer 40,000: Darktide|RPG akcji|Co-op|PC,PS,XBOX|3
Warhammer: Vermintide 2|RPG akcji|Co-op|PC,PS,XBOX|3
Warhammer 40,000: Space Marine 2|Akcja|Co-op|PC,PS,XBOX|4
Baldur's Gate 3|RPG|Co-op|PC,PS,XBOX|5
Divinity: Original Sin 2|RPG|Co-op|PC,PS,XBOX,SWITCH|3
Elden Ring Nightreign|RPG akcji|Co-op|PC,PS,XBOX|5
Elden Ring|RPG akcji|Co-op|PC,PS,XBOX|5
Monster Hunter Wilds|RPG akcji|Co-op|PC,PS,XBOX|5
Monster Hunter: World|RPG akcji|Co-op|PC,PS,XBOX|4
Monster Hunter Rise|RPG akcji|Co-op|PC,PS,XBOX,SWITCH|3
Remnant II|RPG akcji|Co-op|PC,PS,XBOX|3
Borderlands 4|Shooter|Co-op|PC,PS,XBOX|4
Borderlands 3|Shooter|Co-op|PC,PS,XBOX,SWITCH|3
Risk of Rain 2|Akcja|Co-op|PC,PS,XBOX,SWITCH|3
Dying Light 2|Akcja|Co-op|PC,PS,XBOX,SWITCH|3
Killing Floor 3|FPS|Co-op|PC,PS,XBOX|2
World War Z: Aftermath|Shooter|Co-op|PC,PS,XBOX,SWITCH|2
GTFO|FPS|Co-op|PC|2
Barotrauma|Symulacja|Co-op|PC|3
Grand Theft Auto Online|Akcja|PvPvE|PC,PS,XBOX|5
Red Dead Online|Akcja|PvPvE|PC,PS,XBOX|3
Sea of Thieves|Przygodowa|PvPvE|PC,PS,XBOX|4
Star Citizen|Symulacja|PvPvE|PC|3
Elite Dangerous|Symulacja|PvE|PC,PS,XBOX|3
DCS World|Symulacja|Co-op|PC|2
Microsoft Flight Simulator 2024|Symulacja|Co-op|PC,XBOX|3
Rocket League|Sportowa|PvP|PC,PS,XBOX,SWITCH|5
EA SPORTS FC 26|Sportowa|PvP|PC,PS,XBOX,SWITCH|5
EA SPORTS FC 25|Sportowa|PvP|PC,PS,XBOX,SWITCH|4
eFootball|Sportowa|PvP|PC,PS,XBOX,MOBILE|3
NBA 2K25|Sportowa|PvP|PC,PS,XBOX,SWITCH|3
Madden NFL 25|Sportowa|PvP|PC,PS,XBOX|2
Football Manager 24|Sportowa|Solo|PC,MOBILE|3
Forza Horizon 5|Wyścigi|PvP|PC,PS,XBOX|4
F1 25|Wyścigi|PvP|PC,PS,XBOX|3
Assetto Corsa Competizione|Wyścigi|PvP|PC,PS,XBOX|3
Assetto Corsa|Wyścigi|PvP|PC,PS,XBOX|3
iRacing|Wyścigi|PvP|PC|3
BeamNG.drive|Symulacja|Co-op|PC|3
EA SPORTS WRC|Wyścigi|PvP|PC,PS,XBOX|2
DiRT Rally 2.0|Wyścigi|PvP|PC,PS,XBOX|2
Need for Speed Unbound|Wyścigi|PvP|PC,PS,XBOX|3
Wreckfest|Wyścigi|PvP|PC,PS,XBOX,SWITCH|2
Trackmania|Wyścigi|PvP|PC,PS,XBOX|3
CarX Drift Racing Online|Wyścigi|PvP|PC,PS,XBOX|2
Euro Truck Simulator 2|Symulacja|Co-op|PC|4
American Truck Simulator|Symulacja|Co-op|PC|3
Farming Simulator 25|Symulacja|Co-op|PC,PS,XBOX|4
Farming Simulator 22|Symulacja|Co-op|PC,PS,XBOX|3
Tekken 8|Bijatyka|PvP|PC,PS,XBOX|3
Street Fighter 6|Bijatyka|PvP|PC,PS,XBOX|3
Mortal Kombat 1|Bijatyka|PvP|PC,PS,XBOX,SWITCH|3
Guilty Gear Strive|Bijatyka|PvP|PC,PS,XBOX|2
Granblue Fantasy Versus: Rising|Bijatyka|PvP|PC,PS|2
Brawlhalla|Bijatyka|PvP|PC,PS,XBOX,SWITCH,MOBILE|3
Dragon Ball FighterZ|Bijatyka|PvP|PC,PS,XBOX,SWITCH|2
Dead by Daylight|Horror|PvP|PC,PS,XBOX,SWITCH,MOBILE|5
Phasmophobia|Horror|Co-op|PC,PS,XBOX|5
Lethal Company|Horror|Co-op|PC|4
R.E.P.O.|Horror|Co-op|PC|4
Content Warning|Horror|Co-op|PC|3
DEVOUR|Horror|Co-op|PC|2
The Texas Chain Saw Massacre|Horror|PvP|PC,PS,XBOX|2
Among Us|Imprezowa|PvP|PC,PS,XBOX,SWITCH,MOBILE|4
Fall Guys|Imprezowa|PvP|PC,PS,XBOX,SWITCH|3
Party Animals|Imprezowa|PvP|PC,XBOX|3
Gang Beasts|Imprezowa|PvP|PC,PS,XBOX,SWITCH|2
Human Fall Flat|Imprezowa|Co-op|PC,PS,XBOX,SWITCH,MOBILE|3
Overcooked! 2|Imprezowa|Co-op|PC,PS,XBOX,SWITCH|3
Moving Out 2|Imprezowa|Co-op|PC,PS,XBOX,SWITCH|2
Golf With Your Friends|Imprezowa|Co-op|PC,PS,XBOX,SWITCH|3
Unrailed!|Imprezowa|Co-op|PC,PS,XBOX,SWITCH|2
Chained Together|Imprezowa|Co-op|PC|3
Stumble Guys|Imprezowa|PvP|PC,MOBILE|2
It Takes Two|Przygodowa|Co-op|PC,PS,XBOX,SWITCH|4
Age of Empires IV|Strategia|PvP|PC,XBOX|3
Age of Empires II: DE|Strategia|PvP|PC,XBOX|3
StarCraft II|Strategia|PvP|PC|3
Company of Heroes 3|Strategia|PvP|PC,PS,XBOX|2
Total War: WARHAMMER III|Strategia|Co-op|PC|3
Sid Meier's Civilization VII|Strategia|PvP|PC,PS,XBOX,SWITCH|4
Sid Meier's Civilization VI|Strategia|PvP|PC,PS,XBOX,SWITCH,MOBILE|3
Crusader Kings III|Strategia|Co-op|PC,PS,XBOX|3
Europa Universalis IV|Strategia|Co-op|PC|3
Hearts of Iron IV|Strategia|Co-op|PC|4
Stellaris|Strategia|Co-op|PC,PS,XBOX|3
Anno 1800|Strategia|Co-op|PC|3
Cities: Skylines II|Symulacja|Solo|PC,PS,XBOX|3
RimWorld|Symulacja|Solo|PC,PS,XBOX|3
Northgard|Strategia|PvP|PC,PS,XBOX,SWITCH|2
Frostpunk 2|Strategia|Solo|PC,PS,XBOX|3
Foxhole|Strategia|PvP|PC|2
Chivalry 2|Akcja|PvP|PC,PS,XBOX|2
MORDHAU|Akcja|PvP|PC,PS,XBOX|2
For Honor|Akcja|PvP|PC,PS,XBOX|3
Mount & Blade II: Bannerlord|RPG akcji|Co-op|PC,PS,XBOX|3
Genshin Impact|RPG|Co-op|PC,PS,MOBILE|4
Honkai: Star Rail|RPG|Solo|PC,PS,MOBILE|4
Wuthering Waves|RPG|Solo|PC,PS,MOBILE|3
Zenless Zone Zero|RPG akcji|Solo|PC,PS,MOBILE|3
Slay the Spire 2|Karcianka|Solo|PC|3
Hearthstone|Karcianka|PvP|PC,MOBILE|3
Magic: The Gathering Arena|Karcianka|PvP|PC,MOBILE|3
Marvel Snap|Karcianka|PvP|PC,MOBILE|2
Balatro|Karcianka|Solo|PC,PS,XBOX,SWITCH,MOBILE|3
`.trim();

const GAMES = GAME_DATA.split("\n").map((line, i) => {
  const [name, genre, mode, plats, pop] = line.split("|");
  return {
    id: i + 1,
    name: name.trim(),
    genre: genre.trim(),
    mode: mode.trim(),
    plats: plats.trim().split(","),
    pop: Number(pop)
  };
});
