package com.gamingverse.sqlitecrud;

/** One row of the games table. */
public class Game {
    private long id;
    private String title;
    private String genre;
    private String platform;
    private double price;

    public Game(long id, String title, String genre, String platform, double price) {
        this.id = id;
        this.title = title;
        this.genre = genre;
        this.platform = platform;
        this.price = price;
    }

    public Game(String title, String genre, String platform, double price) {
        this(-1, title, genre, platform, price);
    }

    public long getId() { return id; }
    public String getTitle() { return title; }
    public String getGenre() { return genre; }
    public String getPlatform() { return platform; }
    public double getPrice() { return price; }
}
