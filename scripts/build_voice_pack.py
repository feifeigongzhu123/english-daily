#!/usr/bin/env python3
"""Build the default Aria + Chinese voice pack for all books.

Requires: pip install edge-tts
Usage: python scripts/build_voice_pack.py
"""

import asyncio
import hashlib
import json
import string
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
CORPUS = ROOT / "audio" / "corpus.json"
OUT = ROOT / "audio" / "voices"
SAMPLES = ROOT / "audio" / "samples"
PACK_JS = ROOT / "js" / "voice-pack.js"
ARIA = "en-US-AriaNeural"
ZH = "zh-CN-XiaoxiaoNeural"
CONCURRENCY = 16
RETRIES = 5


def normalize(text):
    return " ".join(str(text or "").strip().lower().split())


def unique_values(values):
    unique = {}
    for value in values:
        key = normalize(value)
        if key and key not in unique:
            unique[key] = value
    return unique


def load_corpus():
    data = json.loads(CORPUS.read_text(encoding="utf-8"))
    english = []
    chinese = []
    for book in data["books"]:
        for unit in book["units"]:
            for word in unit["words"]:
                english.append(word["w"])
                if word["en"]:
                    english.append(word["en"])
                if word["cn"]:
                    chinese.append(word["cn"])
    english.extend(string.ascii_uppercase)
    return unique_values(english), unique_values(chinese), data


async def synthesize(text, voice, path, semaphore):
    if path.exists() and path.stat().st_size > 0:
        return
    async with semaphore:
        for attempt in range(RETRIES):
            try:
                communicate = edge_tts.Communicate(text, voice, rate="+0%", pitch="+0Hz")
                await communicate.save(str(path))
                if path.exists() and path.stat().st_size > 0:
                    return
            except Exception:
                if attempt == RETRIES - 1:
                    raise
                await asyncio.sleep(2 ** attempt)


async def build_folder(folder, voice, label, texts, semaphore):
    directory = OUT / folder
    directory.mkdir(parents=True, exist_ok=True)
    entries = {}
    items = list(texts.items())
    for index, (key, original) in enumerate(items, 1):
        digest = hashlib.sha1(key.encode("utf-8")).hexdigest()
        relative = f"audio/voices/{folder}/{digest}.mp3"
        path = ROOT / relative
        await synthesize(original, voice, path, semaphore)
        entries[key] = relative
        if index % 50 == 0 or index == len(items):
            print(f"{label}: {index}/{len(items)}", flush=True)
    return entries


async def main():
    english, chinese, corpus = load_corpus()
    print(f"books={len(corpus['books'])} words={corpus['count']} en={len(english)} zh={len(chinese)}", flush=True)
    semaphore = asyncio.Semaphore(CONCURRENCY)
    aria_entries, zh_entries = await asyncio.gather(
        build_folder("aria", ARIA, "Aria", english, semaphore),
        build_folder("zh", ZH, "中文", chinese, semaphore),
    )
    SAMPLES.mkdir(parents=True, exist_ok=True)
    pack = {
        "version": 3,
        "default": "aria",
        "voices": {"aria": {"label": "Aria"}},
        "samples": {"aria": "audio/samples/aria.mp3"},
        "map": aria_entries,
        "zh": zh_entries,
    }
    PACK_JS.write_text(
        "window.YCT_VOICE_PACK = " + json.dumps(pack, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(f"wrote {PACK_JS} ({PACK_JS.stat().st_size} bytes)", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
