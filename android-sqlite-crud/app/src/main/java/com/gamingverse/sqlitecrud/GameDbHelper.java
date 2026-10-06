package com.gamingverse.sqlitecrud;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import java.util.ArrayList;
import java.util.List;

/**
 * Owns the SQLite database and exposes the four basic operations:
 * insert, search (query), update and delete.
 */
public class GameDbHelper extends SQLiteOpenHelper {

    private static final String DATABASE_NAME = "gamingverse.db";
    private static final int DATABASE_VERSION = 1;

    public static final String TABLE_GAMES = "games";
    public static final String COL_ID = "_id";
    public static final String COL_TITLE = "title";
    public static final String COL_GENRE = "genre";
    public static final String COL_PLATFORM = "platform";
    public static final String COL_PRICE = "price";

    private static final String SQL_CREATE_GAMES =
            "CREATE TABLE " + TABLE_GAMES + " ("
                    + COL_ID + " INTEGER PRIMARY KEY AUTOINCREMENT, "
                    + COL_TITLE + " TEXT NOT NULL, "
                    + COL_GENRE + " TEXT, "
                    + COL_PLATFORM + " TEXT, "
                    + COL_PRICE + " REAL NOT NULL DEFAULT 0)";

    public GameDbHelper(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL(SQL_CREATE_GAMES);
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_GAMES);
        onCreate(db);
    }

    // ---------- INSERT ----------

    /** @return the new row id, or -1 on failure. */
    public long insertGame(Game game) {
        SQLiteDatabase db = getWritableDatabase();
        return db.insert(TABLE_GAMES, null, toValues(game));
    }

    // ---------- SEARCH / READ ----------

    /**
     * Returns games whose title, genre or platform contains {@code keyword}.
     * An empty keyword returns every row.
     */
    public List<Game> searchGames(String keyword) {
        SQLiteDatabase db = getReadableDatabase();
        String selection = null;
        String[] args = null;
        if (keyword != null && !keyword.trim().isEmpty()) {
            String like = "%" + keyword.trim() + "%";
            selection = COL_TITLE + " LIKE ? OR " + COL_GENRE + " LIKE ? OR " + COL_PLATFORM + " LIKE ?";
            args = new String[]{like, like, like};
        }

        List<Game> games = new ArrayList<>();
        Cursor cursor = db.query(TABLE_GAMES, null, selection, args, null, null,
                COL_TITLE + " COLLATE NOCASE ASC");
        try {
            while (cursor.moveToNext()) {
                games.add(fromCursor(cursor));
            }
        } finally {
            cursor.close();
        }
        return games;
    }

    /** @return the game with this id, or null if none exists. */
    public Game getGame(long id) {
        SQLiteDatabase db = getReadableDatabase();
        Cursor cursor = db.query(TABLE_GAMES, null, COL_ID + " = ?",
                new String[]{String.valueOf(id)}, null, null, null);
        try {
            return cursor.moveToFirst() ? fromCursor(cursor) : null;
        } finally {
            cursor.close();
        }
    }

    // ---------- UPDATE ----------

    /** @return the number of rows updated (0 if the id does not exist). */
    public int updateGame(Game game) {
        SQLiteDatabase db = getWritableDatabase();
        return db.update(TABLE_GAMES, toValues(game), COL_ID + " = ?",
                new String[]{String.valueOf(game.getId())});
    }

    // ---------- DELETE ----------

    /** @return the number of rows deleted (0 if the id does not exist). */
    public int deleteGame(long id) {
        SQLiteDatabase db = getWritableDatabase();
        return db.delete(TABLE_GAMES, COL_ID + " = ?", new String[]{String.valueOf(id)});
    }

    // ---------- helpers ----------

    private static ContentValues toValues(Game game) {
        ContentValues values = new ContentValues();
        values.put(COL_TITLE, game.getTitle());
        values.put(COL_GENRE, game.getGenre());
        values.put(COL_PLATFORM, game.getPlatform());
        values.put(COL_PRICE, game.getPrice());
        return values;
    }

    private static Game fromCursor(Cursor c) {
        return new Game(
                c.getLong(c.getColumnIndexOrThrow(COL_ID)),
                c.getString(c.getColumnIndexOrThrow(COL_TITLE)),
                c.getString(c.getColumnIndexOrThrow(COL_GENRE)),
                c.getString(c.getColumnIndexOrThrow(COL_PLATFORM)),
                c.getDouble(c.getColumnIndexOrThrow(COL_PRICE)));
    }
}
