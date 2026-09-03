// ============================================================
// GamingVerse - Game Details Database
// ============================================================

const yt = (query) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

export const gamesData = {
  // ==========================================================
  // YOUR CURRENT GAMES
  // ==========================================================

  "Assassin's Creed Shadows": {
    title: "Assassin's Creed Shadows",
    description:
      "An action-adventure game set in feudal Japan, featuring stealth, combat, exploration and two playable protagonists.",
    genre: "Action • Stealth • Open World",
    platforms: "PC • PlayStation 5 • Xbox Series X|S • Nintendo Switch 2",
    releaseDate: "20 March 2025",
    developer: "Ubisoft Quebec",
    publisher: "Ubisoft",
    trailerSearchUrl: yt("Assassin's Creed Shadows official trailer Ubisoft"),
  },

  AU: {
    title: "Among Us",
    description:
      "A multiplayer social-deduction game where Crewmates complete tasks while Impostors secretly eliminate players.",
    genre: "Social Deduction • Multiplayer",
    platforms: "PC • Android • iOS • PlayStation • Xbox • Nintendo Switch",
    releaseDate: "15 June 2018",
    developer: "Innersloth",
    publisher: "Innersloth",
    trailerSearchUrl: yt("Among Us official trailer Innersloth"),
  },

  "Black Myth Wukong": {
    title: "Black Myth: Wukong",
    description:
      "An action RPG inspired by Journey to the West, featuring intense combat, exploration, mythical creatures and challenging bosses.",
    genre: "Action RPG",
    platforms: "PC • PlayStation 5 • Xbox Series X|S",
    releaseDate: "20 August 2024",
    developer: "Game Science",
    publisher: "Game Science",
    trailerSearchUrl: yt("Black Myth Wukong official trailer Game Science"),
  },

  CS2: {
    title: "Counter-Strike 2",
    description:
      "A competitive tactical first-person shooter based around precise gunplay, team strategy and objective-based rounds.",
    genre: "Tactical FPS • Multiplayer",
    platforms: "PC",
    releaseDate: "27 September 2023",
    developer: "Valve",
    publisher: "Valve",
    trailerSearchUrl: yt("Counter Strike 2 official trailer Valve"),
  },

  "Cyberpunk 2077": {
    title: "Cyberpunk 2077",
    description:
      "An open-world action RPG set in Night City, where V becomes involved in a dangerous futuristic conflict.",
    genre: "Action RPG • Open World",
    platforms: "PC • PlayStation 5 • Xbox Series X|S",
    releaseDate: "10 December 2020",
    developer: "CD Projekt Red",
    publisher: "CD Projekt",
    trailerSearchUrl: yt("Cyberpunk 2077 official trailer CD Projekt Red"),
  },

  "Ghost of Tsushima": {
    title: "Ghost of Tsushima",
    description:
      "An open-world action adventure following Jin Sakai as he fights to protect Tsushima during the Mongol invasion.",
    genre: "Action • Open World",
    platforms: "PC • PlayStation 4 • PlayStation 5",
    releaseDate: "17 July 2020",
    developer: "Sucker Punch Productions",
    publisher: "Sony Interactive Entertainment",
    trailerSearchUrl: yt("Ghost of Tsushima official trailer PlayStation"),
  },

  "GTA VI": {
    title: "Grand Theft Auto VI",
    description:
      "The next mainline Grand Theft Auto adventure set in Leonida, including Vice City, and centered on Jason and Lucia.",
    genre: "Action • Open World",
    platforms: "PlayStation 5 • Xbox Series X|S",
    releaseDate: "19 November 2026",
    developer: "Rockstar Games",
    publisher: "Rockstar Games",
    trailerSearchUrl: yt("Grand Theft Auto VI official trailer Rockstar Games"),
  },

  "GTA V": {
    title: "Grand Theft Auto V",
    description:
      "An open-world action-adventure set in Los Santos, following three criminals whose lives collide through a series of heists.",
    genre: "Action • Open World",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "17 September 2013",
    developer: "Rockstar North",
    publisher: "Rockstar Games",
    trailerSearchUrl: yt("Grand Theft Auto V official trailer Rockstar Games"),
  },

  "God of War Ragnarok": {
    title: "God of War Ragnarök",
    description:
      "Kratos and Atreus travel through the Norse realms as they face gods, monsters and the coming of Ragnarök.",
    genre: "Action • Adventure",
    platforms: "PC • PlayStation 4 • PlayStation 5",
    releaseDate: "9 November 2022",
    developer: "Santa Monica Studio",
    publisher: "Sony Interactive Entertainment",
    trailerSearchUrl: yt("God of War Ragnarok official trailer PlayStation"),
  },

  "God of War": {
    title: "God of War",
    description:
      "Kratos and his son Atreus journey through a dangerous Norse wilderness in this story-driven action adventure.",
    genre: "Action • Adventure",
    platforms: "PC • PlayStation 4",
    releaseDate: "20 April 2018",
    developer: "Santa Monica Studio",
    publisher: "Sony Interactive Entertainment",
    trailerSearchUrl: yt("God of War 2018 official trailer PlayStation"),
  },

  "Hogwarts Legacy": {
    title: "Hogwarts Legacy",
    description:
      "An open-world action RPG set in the Wizarding World, allowing players to attend Hogwarts and explore its surrounding lands.",
    genre: "Action RPG • Open World",
    platforms: "PC • PlayStation • Xbox • Nintendo Switch",
    releaseDate: "10 February 2023",
    developer: "Avalanche Software",
    publisher: "Warner Bros. Games",
    trailerSearchUrl: yt("Hogwarts Legacy official trailer WB Games"),
  },

  Minecraft: {
    title: "Minecraft",
    description:
      "A sandbox game focused on exploration, building, crafting and survival in procedurally generated worlds.",
    genre: "Sandbox • Survival",
    platforms: "PC • PlayStation • Xbox • Nintendo Switch • Mobile",
    releaseDate: "18 November 2011",
    developer: "Mojang Studios",
    publisher: "Mojang Studios",
    trailerSearchUrl: yt("Minecraft official trailer Mojang"),
  },

  "Red Dead Redemption 2": {
    title: "Red Dead Redemption 2",
    description:
      "A huge western adventure following Arthur Morgan and the Van der Linde gang as their way of life begins to collapse.",
    genre: "Action • Open World • Western",
    platforms: "PC • PlayStation 4 • Xbox One",
    releaseDate: "26 October 2018",
    developer: "Rockstar Studios",
    publisher: "Rockstar Games",
    trailerSearchUrl: yt(
      "Red Dead Redemption 2 official trailer Rockstar Games",
    ),
  },

  "Red Dead Redemption": {
    title: "Red Dead Redemption",
    description:
      "A western open-world adventure following John Marston as he hunts members of his former gang.",
    genre: "Action • Open World • Western",
    platforms: "PC • PlayStation • Xbox • Nintendo Switch",
    releaseDate: "18 May 2010",
    developer: "Rockstar San Diego",
    publisher: "Rockstar Games",
    trailerSearchUrl: yt("Red Dead Redemption official trailer Rockstar Games"),
  },

  "The Witcher 3 Wild Hunt": {
    title: "The Witcher 3: Wild Hunt",
    description:
      "A story-rich open-world RPG following Geralt of Rivia as he searches for Ciri across a war-torn continent.",
    genre: "Action RPG • Open World",
    platforms: "PC • PlayStation • Xbox • Nintendo Switch",
    releaseDate: "19 May 2015",
    developer: "CD Projekt Red",
    publisher: "CD Projekt",
    trailerSearchUrl: yt(
      "The Witcher 3 Wild Hunt official trailer CD Projekt Red",
    ),
  },

  // ==========================================================
  // RPG / OPEN WORLD
  // ==========================================================

  "Elden Ring": {
    title: "Elden Ring",
    description:
      "A vast open-world action RPG featuring exploration, difficult combat, mysterious lore and deep character customization.",
    genre: "Action RPG • Open World",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "25 February 2022",
    developer: "FromSoftware",
    publisher: "Bandai Namco Entertainment",
    trailerSearchUrl: yt("Elden Ring official trailer Bandai Namco"),
  },

  "Elden Ring Nightreign": {
    title: "Elden Ring Nightreign",
    description:
      "A standalone multiplayer survival-action experience set in the Elden Ring universe.",
    genre: "Action RPG • Co-op",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "30 May 2025",
    developer: "FromSoftware",
    publisher: "Bandai Namco Entertainment",
    trailerSearchUrl: yt("Elden Ring Nightreign official trailer Bandai Namco"),
  },

  "Assassin's Creed Valhalla": {
    title: "Assassin's Creed Valhalla",
    description:
      "A Viking-era open-world adventure about Eivor, clan building, raids and a conflict between Assassins and Templars.",
    genre: "Action RPG • Open World",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "10 November 2020",
    developer: "Ubisoft Montreal",
    publisher: "Ubisoft",
    trailerSearchUrl: yt("Assassin's Creed Valhalla official trailer Ubisoft"),
  },

  "Assassin's Creed Odyssey": {
    title: "Assassin's Creed Odyssey",
    description:
      "A choice-driven open-world RPG set in ancient Greece with naval exploration, combat and branching storylines.",
    genre: "Action RPG • Open World",
    platforms: "PC • PlayStation • Xbox • Nintendo Switch",
    releaseDate: "5 October 2018",
    developer: "Ubisoft Quebec",
    publisher: "Ubisoft",
    trailerSearchUrl: yt("Assassin's Creed Odyssey official trailer Ubisoft"),
  },

  "Assassin's Creed Origins": {
    title: "Assassin's Creed Origins",
    description:
      "An open-world action RPG set in ancient Egypt and focused on Bayek and the origins of the Assassin Brotherhood.",
    genre: "Action RPG • Open World",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "27 October 2017",
    developer: "Ubisoft Montreal",
    publisher: "Ubisoft",
    trailerSearchUrl: yt("Assassin's Creed Origins official trailer Ubisoft"),
  },

  "Far Cry 6": {
    title: "Far Cry 6",
    description:
      "A tropical open-world shooter set on Yara, where Dani Rojas joins a guerrilla revolution against dictator Anton Castillo.",
    genre: "FPS • Open World",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "7 October 2021",
    developer: "Ubisoft Toronto",
    publisher: "Ubisoft",
    trailerSearchUrl: yt("Far Cry 6 official trailer Ubisoft"),
  },

  "Far Cry 5": {
    title: "Far Cry 5",
    description:
      "An open-world first-person shooter set in Hope County, Montana, where a resistance movement challenges a violent cult.",
    genre: "FPS • Open World",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "27 March 2018",
    developer: "Ubisoft Montreal • Ubisoft Toronto",
    publisher: "Ubisoft",
    trailerSearchUrl: yt("Far Cry 5 official trailer Ubisoft"),
  },

  "Watch Dogs 2": {
    title: "Watch Dogs 2",
    description:
      "An open-world action game centered around hacking, technology and the hacker group DedSec in San Francisco.",
    genre: "Action • Open World",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "15 November 2016",
    developer: "Ubisoft Montreal",
    publisher: "Ubisoft",
    trailerSearchUrl: yt("Watch Dogs 2 official trailer Ubisoft"),
  },

  "Mafia III": {
    title: "Mafia III",
    description:
      "A crime drama set in 1968 New Bordeaux, following Lincoln Clay as he builds a new criminal organization.",
    genre: "Action • Open World",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "7 October 2016",
    developer: "Hangar 13",
    publisher: "2K",
    trailerSearchUrl: yt("Mafia III official trailer 2K"),
  },

  "Sleeping Dogs": {
    title: "Sleeping Dogs",
    description:
      "An open-world action game following undercover cop Wei Shen as he infiltrates Hong Kong's criminal underworld.",
    genre: "Action • Open World",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "14 August 2012",
    developer: "United Front Games",
    publisher: "Square Enix",
    trailerSearchUrl: yt("Sleeping Dogs official trailer Square Enix"),
  },

  "Just Cause 4": {
    title: "Just Cause 4",
    description:
      "A chaotic open-world action game where Rico Rodriguez uses a wingsuit, grappling hook and explosive gadgets.",
    genre: "Action • Open World",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "4 December 2018",
    developer: "Avalanche Studios",
    publisher: "Square Enix",
    trailerSearchUrl: yt("Just Cause 4 official trailer Square Enix"),
  },

  // ==========================================================
  // MARVEL / ACTION / ADVENTURE
  // ==========================================================

  "Spider-Man Remastered": {
    title: "Marvel's Spider-Man Remastered",
    description:
      "A cinematic open-world superhero adventure featuring Peter Parker and a detailed New York City.",
    genre: "Action • Superhero • Open World",
    platforms: "PC • PlayStation 5",
    releaseDate: "12 August 2022",
    developer: "Insomniac Games",
    publisher: "Sony Interactive Entertainment",
    trailerSearchUrl: yt(
      "Marvel's Spider-Man Remastered official trailer PlayStation",
    ),
  },

  "Spider-Man 2": {
    title: "Marvel's Spider-Man 2",
    description:
      "Peter Parker and Miles Morales face dangerous threats including Venom and Kraven across an expanded New York City.",
    genre: "Action • Superhero • Open World",
    platforms: "PC • PlayStation 5",
    releaseDate: "20 October 2023",
    developer: "Insomniac Games",
    publisher: "Sony Interactive Entertainment",
    trailerSearchUrl: yt("Marvel's Spider-Man 2 official trailer PlayStation"),
  },

  "Spider-Man Miles Morales": {
    title: "Marvel's Spider-Man: Miles Morales",
    description:
      "Miles Morales steps into the role of Spider-Man while protecting Harlem and mastering his new powers.",
    genre: "Action • Superhero • Open World",
    platforms: "PC • PlayStation",
    releaseDate: "12 November 2020",
    developer: "Insomniac Games",
    publisher: "Sony Interactive Entertainment",
    trailerSearchUrl: yt(
      "Marvel's Spider-Man Miles Morales official trailer PlayStation",
    ),
  },

  // ==========================================================
  // THE LAST OF US / UNCHARTED
  // ==========================================================

  "The Last of Us Part I": {
    title: "The Last of Us Part I",
    description:
      "A rebuilt version of the original survival story following Joel and Ellie across a ravaged United States.",
    genre: "Action • Survival • Story",
    platforms: "PC • PlayStation 5",
    releaseDate: "2 September 2022",
    developer: "Naughty Dog",
    publisher: "Sony Interactive Entertainment",
    trailerSearchUrl: yt("The Last of Us Part I official trailer PlayStation"),
  },

  "The Last of Us Part II": {
    title: "The Last of Us Part II",
    description:
      "A narrative-driven survival adventure following Ellie and Abby through a violent journey of revenge, loss and survival.",
    genre: "Action • Survival • Story",
    platforms: "PlayStation 4 • PlayStation 5",
    releaseDate: "19 June 2020",
    developer: "Naughty Dog",
    publisher: "Sony Interactive Entertainment",
    trailerSearchUrl: yt("The Last of Us Part II official trailer PlayStation"),
  },

  "Uncharted 4": {
    title: "Uncharted 4: A Thief's End",
    description:
      "Nathan Drake returns for one final adventure involving lost treasure, pirates and a dangerous rival.",
    genre: "Action • Adventure",
    platforms: "PC • PlayStation 4",
    releaseDate: "10 May 2016",
    developer: "Naughty Dog",
    publisher: "Sony Interactive Entertainment",
    trailerSearchUrl: yt("Uncharted 4 official trailer PlayStation"),
  },

  "Tomb Raider": {
    title: "Tomb Raider",
    description:
      "A survival action adventure following a young Lara Croft as she fights to survive a shipwreck and uncover a mysterious island.",
    genre: "Action • Adventure • Survival",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "5 March 2013",
    developer: "Crystal Dynamics",
    publisher: "Square Enix",
    trailerSearchUrl: yt("Tomb Raider 2013 official trailer Square Enix"),
  },

  "Rise of the Tomb Raider": {
    title: "Rise of the Tomb Raider",
    description:
      "Lara Croft travels across Siberia in search of a legendary city while confronting the organization Trinity.",
    genre: "Action • Adventure",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "10 November 2015",
    developer: "Crystal Dynamics",
    publisher: "Square Enix",
    trailerSearchUrl: yt("Rise of the Tomb Raider official trailer"),
  },

  "Shadow of the Tomb Raider": {
    title: "Shadow of the Tomb Raider",
    description:
      "Lara races to prevent a Mayan apocalypse while exploring ancient ruins and confronting the cost of her actions.",
    genre: "Action • Adventure",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "14 September 2018",
    developer: "Eidos-Montréal",
    publisher: "Square Enix",
    trailerSearchUrl: yt("Shadow of the Tomb Raider official trailer"),
  },

  // ==========================================================
  // ACTION / COMBAT
  // ==========================================================

  Sekiro: {
    title: "Sekiro: Shadows Die Twice",
    description:
      "A challenging action-adventure featuring precise swordplay, stealth and resurrection mechanics.",
    genre: "Action • Adventure",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "22 March 2019",
    developer: "FromSoftware",
    publisher: "Activision",
    trailerSearchUrl: yt("Sekiro Shadows Die Twice official trailer"),
  },

  "Devil May Cry 5": {
    title: "Devil May Cry 5",
    description:
      "Stylish demon-slaying action featuring Nero, Dante and V with deep combo-based combat.",
    genre: "Action • Hack and Slash",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "8 March 2019",
    developer: "Capcom",
    publisher: "Capcom",
    trailerSearchUrl: yt("Devil May Cry 5 official trailer Capcom"),
  },

  "Star Wars Jedi Fallen Order": {
    title: "Star Wars Jedi: Fallen Order",
    description:
      "A single-player action adventure following Cal Kestis, a surviving Jedi apprentice hunted by the Empire.",
    genre: "Action • Adventure",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "15 November 2019",
    developer: "Respawn Entertainment",
    publisher: "Electronic Arts",
    trailerSearchUrl: yt("Star Wars Jedi Fallen Order official trailer EA"),
  },

  "Star Wars Jedi Survivor": {
    title: "Star Wars Jedi: Survivor",
    description:
      "Cal Kestis continues his fight against the Empire while discovering new worlds, abilities and enemies.",
    genre: "Action • Adventure",
    platforms: "PC • PlayStation 5 • Xbox Series X|S",
    releaseDate: "28 April 2023",
    developer: "Respawn Entertainment",
    publisher: "Electronic Arts",
    trailerSearchUrl: yt("Star Wars Jedi Survivor official trailer EA"),
  },

  // ==========================================================
  // HORROR
  // ==========================================================

  "Resident Evil 4": {
    title: "Resident Evil 4",
    description:
      "A modern survival-horror remake following Leon S. Kennedy on a mission involving a mysterious rural cult.",
    genre: "Survival Horror • Action",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "24 March 2023",
    developer: "Capcom",
    publisher: "Capcom",
    trailerSearchUrl: yt(
      "Resident Evil 4 remake official launch trailer Capcom",
    ),
  },

  "Resident Evil Village": {
    title: "Resident Evil Village",
    description:
      "Ethan Winters searches for his kidnapped daughter in a mysterious village filled with terrifying supernatural threats.",
    genre: "Survival Horror • Action",
    platforms: "PC • PlayStation • Xbox • Nintendo Switch",
    releaseDate: "7 May 2021",
    developer: "Capcom",
    publisher: "Capcom",
    trailerSearchUrl: yt("Resident Evil Village official trailer Capcom"),
  },

  "Resident Evil 2": {
    title: "Resident Evil 2",
    description:
      "Leon Kennedy and Claire Redfield attempt to survive a zombie outbreak in Raccoon City.",
    genre: "Survival Horror",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "25 January 2019",
    developer: "Capcom",
    publisher: "Capcom",
    trailerSearchUrl: yt("Resident Evil 2 remake official trailer Capcom"),
  },

  "Silent Hill 2": {
    title: "Silent Hill 2",
    description:
      "James Sunderland enters the fog-shrouded town of Silent Hill after receiving a mysterious letter from his deceased wife.",
    genre: "Psychological Horror",
    platforms: "PC • PlayStation 5",
    releaseDate: "8 October 2024",
    developer: "Bloober Team",
    publisher: "Konami",
    trailerSearchUrl: yt("Silent Hill 2 remake official trailer Konami"),
  },

  "Dead Space": {
    title: "Dead Space",
    description:
      "Engineer Isaac Clarke battles terrifying necromorphs aboard a drifting mining ship.",
    genre: "Survival Horror • Sci-Fi",
    platforms: "PC • PlayStation 5 • Xbox Series X|S",
    releaseDate: "27 January 2023",
    developer: "Motive Studio",
    publisher: "Electronic Arts",
    trailerSearchUrl: yt("Dead Space remake official trailer EA"),
  },

  "Alan Wake 2": {
    title: "Alan Wake 2",
    description:
      "A psychological survival-horror experience following writer Alan Wake and FBI agent Saga Anderson.",
    genre: "Survival Horror • Psychological",
    platforms: "PC • PlayStation 5 • Xbox Series X|S",
    releaseDate: "27 October 2023",
    developer: "Remedy Entertainment",
    publisher: "Epic Games Publishing",
    trailerSearchUrl: yt("Alan Wake 2 official trailer Remedy"),
  },

  Phasmophobia: {
    title: "Phasmophobia",
    description:
      "A four-player co-op psychological horror game where investigators gather evidence of paranormal activity.",
    genre: "Co-op • Horror",
    platforms: "PC • PlayStation 5 • Xbox Series X|S",
    releaseDate: "18 September 2020",
    developer: "Kinetic Games",
    publisher: "Kinetic Games",
    trailerSearchUrl: yt("Phasmophobia official trailer Kinetic Games"),
  },

  "The Forest": {
    title: "The Forest",
    description:
      "A survival horror game where players build, craft and fight to survive on a dangerous forest peninsula.",
    genre: "Survival • Horror • Crafting",
    platforms: "PC • PlayStation 4",
    releaseDate: "30 April 2018",
    developer: "Endnight Games",
    publisher: "Endnight Games",
    trailerSearchUrl: yt("The Forest official trailer Endnight Games"),
  },

  "Sons of the Forest": {
    title: "Sons of the Forest",
    description:
      "A survival horror sequel focused on exploration, crafting, combat and survival on a remote island.",
    genre: "Survival • Horror • Crafting",
    platforms: "PC • PlayStation 5",
    releaseDate: "22 February 2024",
    developer: "Endnight Games",
    publisher: "Newnight",
    trailerSearchUrl: yt("Sons of the Forest official trailer Endnight Games"),
  },

  // ==========================================================
  // COMPETITIVE / MULTIPLAYER
  // ==========================================================

  Valorant: {
    title: "VALORANT",
    description:
      "A competitive tactical shooter combining precise gunplay with agents who have unique abilities.",
    genre: "Tactical FPS • Multiplayer",
    platforms: "PC • Console",
    releaseDate: "2 June 2020",
    developer: "Riot Games",
    publisher: "Riot Games",
    trailerSearchUrl: yt("VALORANT official trailer Riot Games"),
  },

  Fortnite: {
    title: "Fortnite",
    description:
      "A live-service multiplayer platform featuring Battle Royale, creative experiences and a constantly changing ecosystem.",
    genre: "Battle Royale • Multiplayer",
    platforms: "PC • PlayStation • Xbox • Nintendo Switch • Mobile",
    releaseDate: "25 July 2017",
    developer: "Epic Games",
    publisher: "Epic Games",
    trailerSearchUrl: yt("Fortnite official trailer Epic Games"),
  },

  "Call of Duty Warzone": {
    title: "Call of Duty: Warzone",
    description:
      "A free-to-play Call of Duty multiplayer experience combining battle royale and squad combat.",
    genre: "Battle Royale • FPS",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "10 March 2020",
    developer: "Infinity Ward • Raven Software",
    publisher: "Activision",
    trailerSearchUrl: yt("Call of Duty Warzone official trailer Activision"),
  },

  "Apex Legends": {
    title: "Apex Legends",
    description:
      "A squad-based hero battle royale featuring unique Legends, fast movement and tactical team play.",
    genre: "Battle Royale • Hero Shooter",
    platforms: "PC • PlayStation • Xbox • Nintendo Switch",
    releaseDate: "4 February 2019",
    developer: "Respawn Entertainment",
    publisher: "Electronic Arts",
    trailerSearchUrl: yt("Apex Legends official trailer EA"),
  },

  "Rainbow Six Siege": {
    title: "Tom Clancy's Rainbow Six Siege",
    description:
      "A tactical team shooter centered on operators, destructible environments and objective-based close-quarters combat.",
    genre: "Tactical FPS • Multiplayer",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "1 December 2015",
    developer: "Ubisoft Montreal",
    publisher: "Ubisoft",
    trailerSearchUrl: yt("Rainbow Six Siege official trailer Ubisoft"),
  },

  PUBG: {
    title: "PUBG: Battlegrounds",
    description:
      "A battle royale shooter where players scavenge equipment and fight until one player or team remains.",
    genre: "Battle Royale • Shooter",
    platforms: "PC • PlayStation • Xbox • Mobile",
    releaseDate: "20 December 2017",
    developer: "PUBG Studios",
    publisher: "Krafton",
    trailerSearchUrl: yt("PUBG Battlegrounds official trailer KRAFTON"),
  },

  "Rocket League": {
    title: "Rocket League",
    description:
      "A physics-based competitive sports game combining rocket-powered cars with soccer.",
    genre: "Sports • Multiplayer",
    platforms: "PC • PlayStation • Xbox • Nintendo Switch",
    releaseDate: "7 July 2015",
    developer: "Psyonix",
    publisher: "Epic Games",
    trailerSearchUrl: yt("Rocket League official trailer Psyonix"),
  },

  "Overwatch 2": {
    title: "Overwatch 2",
    description:
      "A team-based hero shooter featuring unique heroes, objectives and fast-paced multiplayer combat.",
    genre: "Hero Shooter • Multiplayer",
    platforms: "PC • PlayStation • Xbox • Nintendo Switch",
    releaseDate: "4 October 2022",
    developer: "Blizzard Entertainment",
    publisher: "Blizzard Entertainment",
    trailerSearchUrl: yt("Overwatch 2 official trailer Blizzard"),
  },

  "Dota 2": {
    title: "Dota 2",
    description:
      "A competitive multiplayer online battle arena where two teams of heroes battle to destroy the opposing Ancient.",
    genre: "MOBA • Multiplayer",
    platforms: "PC",
    releaseDate: "9 July 2013",
    developer: "Valve",
    publisher: "Valve",
    trailerSearchUrl: yt("Dota 2 official trailer Valve"),
  },

  "League of Legends": {
    title: "League of Legends",
    description:
      "A multiplayer online battle arena featuring champions, strategy, team fights and competitive seasons.",
    genre: "MOBA • Multiplayer",
    platforms: "PC",
    releaseDate: "27 October 2009",
    developer: "Riot Games",
    publisher: "Riot Games",
    trailerSearchUrl: yt("League of Legends official trailer Riot Games"),
  },

  // ==========================================================
  // RACING / SPORTS
  // ==========================================================

  "Forza Horizon 5": {
    title: "Forza Horizon 5",
    description:
      "An open-world racing game set in a detailed representation of Mexico with hundreds of cars and events.",
    genre: "Racing • Open World",
    platforms: "PC • Xbox • PlayStation 5",
    releaseDate: "9 November 2021",
    developer: "Playground Games",
    publisher: "Xbox Game Studios",
    trailerSearchUrl: yt("Forza Horizon 5 official trailer Xbox"),
  },

  "Need for Speed Heat": {
    title: "Need for Speed Heat",
    description:
      "An arcade racing game where players compete in Palm City by day and take risks in illegal street races at night.",
    genre: "Racing • Open World",
    platforms: "PC • PlayStation 4 • Xbox One",
    releaseDate: "8 November 2019",
    developer: "Ghost Games",
    publisher: "Electronic Arts",
    trailerSearchUrl: yt("Need for Speed Heat official trailer EA"),
  },

  "Need for Speed Unbound": {
    title: "Need for Speed Unbound",
    description:
      "A stylized street-racing game mixing realistic vehicles with animated effects and underground racing culture.",
    genre: "Racing • Open World",
    platforms: "PC • PlayStation 5 • Xbox Series X|S",
    releaseDate: "2 December 2022",
    developer: "Criterion Games",
    publisher: "Electronic Arts",
    trailerSearchUrl: yt("Need for Speed Unbound official trailer EA"),
  },

  "EA Sports FC 26": {
    title: "EA Sports FC 26",
    description:
      "A modern football simulation with Career Mode, Ultimate Team and competitive online play.",
    genre: "Sports • Football",
    platforms: "PC • PlayStation • Xbox • Nintendo Switch • Nintendo Switch 2",
    releaseDate: "26 September 2025",
    developer: "EA Sports",
    publisher: "Electronic Arts",
    trailerSearchUrl: yt("EA Sports FC 26 official trailer EA"),
  },

  "NBA 2K26": {
    title: "NBA 2K26",
    description:
      "A basketball simulation featuring MyCAREER, MyTEAM, MyNBA and competitive online modes.",
    genre: "Sports • Basketball",
    platforms: "PC • PlayStation • Xbox • Nintendo Switch 2",
    releaseDate: "5 September 2025",
    developer: "Visual Concepts",
    publisher: "2K",
    trailerSearchUrl: yt("NBA 2K26 official trailer 2K"),
  },

  "F1 25": {
    title: "EA Sports F1 25",
    description:
      "The official Formula 1 racing game featuring updated circuits, career content and My Team.",
    genre: "Racing • Formula 1",
    platforms: "PC • PlayStation 5 • Xbox Series X|S",
    releaseDate: "30 May 2025",
    developer: "Codemasters",
    publisher: "Electronic Arts",
    trailerSearchUrl: yt("EA Sports F1 25 official trailer EA"),
  },

  // ==========================================================
  // SANDBOX / INDIE / SURVIVAL
  // ==========================================================

  Terraria: {
    title: "Terraria",
    description:
      "A 2D sandbox adventure centered on exploration, building, crafting, combat and discovering a procedural world.",
    genre: "Sandbox • Survival",
    platforms: "PC • PlayStation • Xbox • Nintendo Switch • Mobile",
    releaseDate: "16 May 2011",
    developer: "Re-Logic",
    publisher: "Re-Logic",
    trailerSearchUrl: yt("Terraria official trailer Re-Logic"),
  },

  "Stardew Valley": {
    title: "Stardew Valley",
    description:
      "A farming and life simulation RPG where players restore a farm, build relationships and explore the valley.",
    genre: "Simulation • RPG • Farming",
    platforms: "PC • PlayStation • Xbox • Nintendo Switch • Mobile",
    releaseDate: "26 February 2016",
    developer: "ConcernedApe",
    publisher: "ConcernedApe",
    trailerSearchUrl: yt("Stardew Valley official trailer ConcernedApe"),
  },

  "Hollow Knight": {
    title: "Hollow Knight",
    description:
      "A hand-drawn action adventure set in the ruined kingdom of Hallownest with exploration, combat and difficult bosses.",
    genre: "Metroidvania • Action",
    platforms: "PC • PlayStation • Xbox • Nintendo Switch",
    releaseDate: "24 February 2017",
    developer: "Team Cherry",
    publisher: "Team Cherry",
    trailerSearchUrl: yt("Hollow Knight official trailer Team Cherry"),
  },

  "Hollow Knight Silksong": {
    title: "Hollow Knight: Silksong",
    description:
      "Hornet journeys through a haunted kingdom filled with new enemies, movement abilities, mysteries and challenges.",
    genre: "Metroidvania • Action",
    platforms: "PC • PlayStation • Xbox • Nintendo Switch",
    releaseDate: "4 September 2025",
    developer: "Team Cherry",
    publisher: "Team Cherry",
    trailerSearchUrl: yt("Hollow Knight Silksong official trailer Team Cherry"),
  },

  Hades: {
    title: "Hades",
    description:
      "A fast-paced rogue-like action game where Zagreus repeatedly attempts to escape the Underworld.",
    genre: "Rogue-like • Action",
    platforms: "PC • PlayStation • Xbox • Nintendo Switch",
    releaseDate: "17 September 2020",
    developer: "Supergiant Games",
    publisher: "Supergiant Games",
    trailerSearchUrl: yt("Hades official trailer Supergiant Games"),
  },

  "Hades II": {
    title: "Hades II",
    description:
      "A rogue-like action sequel following Melinoë as she battles supernatural enemies tied to the Titan of Time.",
    genre: "Rogue-like • Action",
    platforms: "PC",
    releaseDate: "6 May 2024 (Early Access)",
    developer: "Supergiant Games",
    publisher: "Supergiant Games",
    trailerSearchUrl: yt("Hades II official trailer Supergiant Games"),
  },

  "Dead Cells": {
    title: "Dead Cells",
    description:
      "A roguevania combining metroidvania exploration with repeated runs, fast combat and permanent unlocks.",
    genre: "Rogue-like • Action • Metroidvania",
    platforms: "PC • PlayStation • Xbox • Nintendo Switch • Mobile",
    releaseDate: "7 August 2018",
    developer: "Motion Twin",
    publisher: "Motion Twin",
    trailerSearchUrl: yt("Dead Cells official trailer Motion Twin"),
  },

  Palworld: {
    title: "Palworld",
    description:
      "An open-world survival and crafting game where players collect creatures called Pals for exploration, combat and building.",
    genre: "Open World • Survival • Crafting",
    platforms: "PC • Xbox • PlayStation 5",
    releaseDate: "19 January 2024 (Early Access)",
    developer: "Pocketpair",
    publisher: "Pocketpair",
    trailerSearchUrl: yt("Palworld official trailer Pocketpair"),
  },

  Rust: {
    title: "Rust",
    description:
      "A multiplayer survival game focused on gathering resources, building bases, crafting equipment and surviving other players.",
    genre: "Survival • Multiplayer",
    platforms: "PC • PlayStation • Xbox",
    releaseDate: "8 February 2018",
    developer: "Facepunch Studios",
    publisher: "Facepunch Studios",
    trailerSearchUrl: yt("Rust official trailer Facepunch Studios"),
  },

  "ARK Survival Evolved": {
    title: "ARK: Survival Evolved",
    description:
      "A survival sandbox where players tame dinosaurs, build bases, craft equipment and explore dangerous environments.",
    genre: "Survival • Open World",
    platforms: "PC • PlayStation • Xbox • Nintendo Switch • Mobile",
    releaseDate: "29 August 2017",
    developer: "Studio Wildcard",
    publisher: "Studio Wildcard",
    trailerSearchUrl: yt(
      "ARK Survival Evolved official trailer Studio Wildcard",
    ),
  },

  "Garry's Mod": {
    title: "Garry's Mod",
    description:
      "A physics sandbox built around user-created modes, tools, maps and multiplayer experiences.",
    genre: "Sandbox • Multiplayer",
    platforms: "PC",
    releaseDate: "29 November 2006",
    developer: "Facepunch Studios",
    publisher: "Valve",
    trailerSearchUrl: yt("Garry's Mod official trailer Facepunch"),
  },

  "Left 4 Dead 2": {
    title: "Left 4 Dead 2",
    description:
      "A co-op first-person shooter where survivors fight through hordes of infected across chaotic campaigns.",
    genre: "Co-op • FPS • Horror",
    platforms: "PC • Xbox 360",
    releaseDate: "17 November 2009",
    developer: "Valve",
    publisher: "Valve",
    trailerSearchUrl: yt("Left 4 Dead 2 official trailer Valve"),
  },
};

// ============================================================
// ALIASES FOR COMMON FILE NAMES
// ============================================================

gamesDataAliases = {
  ACS: "Assassin's Creed Shadows",
  AU: "AU",
  Wukong: "Black Myth Wukong",
  "Black Myth Wukong": "Black Myth Wukong",
  "CS 2": "CS2",
  "Counter Strike 2": "CS2",
  Cyberpunk: "Cyberpunk 2077",
  "GTA 5": "GTA V",
  "GTA 6": "GTA VI",
  RDR: "Red Dead Redemption",
  RDR2: "Red Dead Redemption 2",
  GOT: "Ghost of Tsushima",
  GOW: "God of War",
  GOWR: "God of War Ragnarok",
  "God of War R": "God of War Ragnarok",
  "Spider-Man": "Spider-Man Remastered",
};

// Create aliases inside the exported object
Object.entries(gamesDataAliases).forEach(([alias, target]) => {
  if (gamesData[target]) {
    gamesData[alias] = gamesData[target];
  }
});

export default gamesData;
