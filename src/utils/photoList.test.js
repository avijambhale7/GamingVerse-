import { describe, expect, it } from "vitest";
import { mergePhotoList, photoLinesFrom } from "./photoList.js";

describe("photoLinesFrom", () => {
  it("splits pasted links into trimmed lines", () => {
    expect(photoLinesFrom(" https://a.jpg \r\n\nhttps://b.jpg\n")).toEqual([
      "https://a.jpg",
      "https://b.jpg",
    ]);
  });

  it("copes with empty input", () => {
    expect(photoLinesFrom("")).toEqual([]);
    expect(photoLinesFrom(undefined)).toEqual([]);
  });
});

describe("mergePhotoList", () => {
  it("keeps current photos (uploads and links) and appends new links", () => {
    expect(
      mergePhotoList(["data:image/jpeg;base64,AAA", "https://a.jpg"], "https://b.jpg"),
    ).toEqual(["data:image/jpeg;base64,AAA", "https://a.jpg", "https://b.jpg"]);
  });

  it("drops duplicates and blanks", () => {
    expect(mergePhotoList(["https://a.jpg", " "], "https://a.jpg\n\n")).toEqual([
      "https://a.jpg",
    ]);
  });

  it("copes with missing input", () => {
    expect(mergePhotoList(undefined, undefined)).toEqual([]);
  });
});
