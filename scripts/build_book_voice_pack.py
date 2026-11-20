#!/usr/bin/env python3
"""Build one book's default Aria + Chinese audio at a time."""

import argparse
import asyncio
import hashlib
import json
import string
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
CORPUS = ROOT / "audio" / "corpus.json"
INDEX = ROOT / "audio" / "voice-index.json"
PACK = ROOT / "js" / "voice-pack.js"
PROGRESS = ROOT / "audio" / "voice-progress.json"
PENDING = ROOT / "audio" / "voice-pending.json"
ARIA = "en-US-AriaNeural"
ZH = "zh-CN-XiaoxiaoNeural"
CONCURRENCY = 8
RETRIES = 5


def normalize(text):
    return " ".join(str(text or "").strip().lower().split())


def load_json(path, default):
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return default


def load_index():
    if INDEX.exists():
        return load_json(INDEX, {"aria": {}, "zh": {}})
    data = {}
    if PACK.exists():
        raw = PACK.read_text(encoding="utf-8").strip()
        raw = raw[len("window.YCT_VOICE_PACK = "):].rstrip(";")
        data = json.loads(raw)
    index = {"aria": {}, "zh": {}}
    for key, entry in (data.get("map") or {}).items():
        if isinstance(entry, str):
            index["aria"][key] = entry
        elif isinstance(entry, dict) and entry.get("aria"):
            index["aria"][key] = entry["aria"]
    for key, path in (data.get("zh") or {}).items():
        index["zh"][key] = path
    return index


def save_pack(index):
    pack = {
        "version": 4,
        "default": "aria",
        "voices": {"aria": {"label": "Aria"}},
        "samples": {"aria": "audio/samples/aria.mp3"},
        "map": index["aria"],
        "zh": index["zh"],
    }
    PACK.write_text(
        "window.YCT_VOICE_PACK = " + json.dumps(pack, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )


async def synthesize(text, voice, path, semaphore):
    if path.exists() and path.stat().st_size > 0:
        return
    async with semaphore:
        for attempt in range(RETRIES):
            try:
                communicate = edge_tts.Communicate(text, voice, rate="+0%", pitch="+0Hz")
                await asyncio.wait_for(communicate.save(str(path)), timeout=20)
                if path.exists() and path.stat().st_size > 0:
                    return
            except Exception:
                if attempt == RETRIES - 1:
                    raise
                await asyncio.sleep(2 ** attempt)


async def build(items, folder, voice, index, semaphore):
    directory = ROOT / "audio" / "voices" / folder
    directory.mkdir(parents=True, exist_ok=True)
    for count, (key, original) in enumerate(items, 1):
        digest = hashlib.sha1(key.encode("utf-8")).hexdigest()
        relative = f"audio/voices/{folder}/{digest}.mp3"
        path = ROOT / relative
        await synthesize(original, voice, path, semaphore)
        index[folder][key] = relative
        if count % 50 == 0 or count == len(items):
            print(f"{folder}: {count}/{len(items)}", flush=True)


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--book")
    parser.add_argument("--next", action="store_true")
    args = parser.parse_args()

    corpus = load_json(CORPUS, None)
    if not corpus:
        raise SystemExit("audio/corpus.json missing")
    progress = load_json(PROGRESS, {"completed": []})
    completed = set(progress.get("completed", []))
    books = corpus["books"]

    scope_ids = {"j7a26", "j7b26", "j8a26", "j8b26", "j9a26", "h1", "h2", "h3", "h4", "h5", "h6", "h7"}
    if args.next:
        pending = load_json(PENDING, {})
        if pending.get("book"):
            book_id = pending["book"]
        else:
            book_id = next((b["id"] for b in books if b["id"] in scope_ids and b["id"] not in completed), None)
    else:
        book_id = args.book
    if not book_id:
        print("ALL_DONE", flush=True)
        return 2
    book = next((b for b in books if b["id"] == book_id), None)
    if not book:
        raise SystemExit("unknown book " + book_id)

    en_values = []
    zh_values = []
    for unit in book["units"]:
        for word in unit["words"]:
            en_values.append(word["w"])
            if word["en"]:
                en_values.append(word["en"])
            if word["cn"]:
                zh_values.append(word["cn"])
    en_values.extend(string.ascii_uppercase)

    index = load_index()
    en_items = []
    seen_en = set()
    for value in en_values:
        key = normalize(value)
        if key and key not in seen_en and key not in index["aria"]:
            seen_en.add(key)
            en_items.append((key, value))
    zh_items = []
    seen_zh = set()
    for value in zh_values:
        key = normalize(value)
        if key and key not in seen_zh and key not in index["zh"]:
            seen_zh.add(key)
            zh_items.append((key, value))

    print(f"book={book_id} name={book['name']} en={len(en_items)} zh={len(zh_items)}", flush=True)
    semaphore = asyncio.Semaphore(CONCURRENCY)
    await asyncio.gather(
        build(en_items, "aria", ARIA, index, semaphore),
        build(zh_items, "zh", ZH, index, semaphore),
    )
    save_pack(index)
    INDEX.write_text(json.dumps(index, ensure_ascii=False), encoding="utf-8")

    completed.add(book_id)
    PROGRESS.write_text(json.dumps({"completed": sorted(completed)}, ensure_ascii=False), encoding="utf-8")
    PENDING.write_text(json.dumps({"book": book_id}, ensure_ascii=False), encoding="utf-8")
    print(f"BUILT {book_id} completed={len(completed)}/{len(books)}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
