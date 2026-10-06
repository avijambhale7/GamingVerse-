# GamingVerse Library — Android SQLite CRUD

A small native Android app (Java, no third-party libraries) that manages a game
library stored in a local **SQLite** database and covers the four basic
operations: **insert, search, update and delete**.

## Data model

Table `games` in `gamingverse.db`:

| Column     | Type                              |
|------------|-----------------------------------|
| `_id`      | INTEGER PRIMARY KEY AUTOINCREMENT |
| `title`    | TEXT NOT NULL                     |
| `genre`    | TEXT                              |
| `platform` | TEXT                              |
| `price`    | REAL NOT NULL DEFAULT 0           |

## Where each operation lives

All SQL goes through `GameDbHelper` (a `SQLiteOpenHelper`), using
parameterised queries:

| Operation | Method                         | Triggered in the UI by                     |
|-----------|--------------------------------|--------------------------------------------|
| Insert    | `insertGame(Game)`             | Fill the form → **Insert**                 |
| Search    | `searchGames(String keyword)`  | Typing in the search box (title/genre/platform, `LIKE`) |
| Update    | `updateGame(Game)`             | Tap a game → edit fields → **Update**      |
| Delete    | `deleteGame(long id)`          | Long-press a game → confirm **Delete**     |

`MainActivity` holds the single screen: the form, the live search box and a
`ListView` of results.

## Project layout

```
app/src/main/
├── AndroidManifest.xml
├── java/com/gamingverse/sqlitecrud/
│   ├── Game.java            # model
│   ├── GameDbHelper.java    # SQLite schema + CRUD
│   └── MainActivity.java    # UI
└── res/layout/
    ├── activity_main.xml
    └── item_game.xml
```

## Build & run

Requirements: Android Studio (or Android SDK with platform 34), JDK 17+.

- **Android Studio:** *File → Open* → select this `android-sqlite-crud` folder → Run.
- **Command line:** `./gradlew installDebug` with a device/emulator connected.

minSdk 21, targetSdk 34.
