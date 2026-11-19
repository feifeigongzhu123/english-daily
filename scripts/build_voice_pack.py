#!/usr/bin/env python3
"""Build the offline English voice pack for the 2026 junior edition.

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
DATA = ROOT / "js" / "data-junior-2026.js"
OUT = ROOT / "audio" / "voices"
SAMPLES = ROOT / "audio" / "samples"
PACK_JS = ROOT / "js" / "voice-pack.js"
SAMPLE_SRC = Path.home() / "Downloads" / "英词通语音样例"

VOICES = {
    "aria": ("Aria", "en-US-AriaNeural"),
    "jenny": ("Jenny", "en-US-JennyNeural"),
    "guy": ("Guy", "en-US-GuyNeural"),
    "sonia": ("Sonia", "en-GB-SoniaNeural"),
}
ZH_VOICE = "zh-CN-XiaoxiaoNeural"
SAMPLE_FILES = {
    "aria": "02-Aria-女声.mp3",
    "jenny": "01-Jenny-女声.mp3",
    "guy": "03-Guy-男声.mp3",
    "sonia": "04-Sonia-英音女声.mp3",
}
CONCURRENCY = 4
RETRIES = 4


def normalize(text):
    return " ".join(str(text or "").strip().lower().split())


def read_book():
    text = DATA.read_text(encoding="utf-8")
    marker = "window.YCT_BOOKS.push("
    start = text.index(marker) + len(marker)
    book, _ = json.JSONDecoder().raw_decode(text[start:])
    return book


def unique_values(values):
    unique = {}
    for value in values:
        key = normalize(value)
        if key and key not in unique:
            unique[key] = value
    return unique


def load_texts():
    book = read_book()
    values = []
    for unit in book["units"]:
        for row in unit["words"]:
            values.append(row[0])
            if row[4]:
                values.append(row[4])
    values.extend(string.ascii_uppercase)
    return unique_values(values)


def load_chinese_texts():
    book = read_book()
    values = []
    for unit in book["units"]:
        for row in unit["words"]:
            if row[3]:
                values.append(row[3])
    return unique_values(values)


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
            except Exception as exc:
                if attempt == RETRIES - 1:
                    raise
                await asyncio.sleep(2 ** attempt)


async def build_voice(voice_key, voice_name, label, texts, semaphore):
    directory = OUT / voice_key
    directory.mkdir(parents=True, exist_ok=True)
    entries = {}
    items = list(texts.items())
    for index, (key, original) in enumerate(items, 1):
        digest = hashlib.sha1(key.encode("utf-8")).hexdigest()
        relative = f"audio/voices/{voice_key}/{digest}.mp3"
        path = ROOT / relative
        await synthesize(original, voice_name, path, semaphore)
        entries[key] = relative
        if index % 25 == 0 or index == len(items):
            print(f"{label}: {index}/{len(items)}", flush=True)
    return entries


async def main():
    texts = load_texts()
    print(f"texts: {len(texts)}", flush=True)
    semaphore = asyncio.Semaphore(CONCURRENCY)
    keys = list(VOICES.keys())
    built = await asyncio.gather(*[
        build_voice(key, VOICES[key][1], VOICES[key][0], texts, semaphore)
        for key in keys
    ])
    results = dict(zip(keys, built))
    zh_texts = load_chinese_texts()
    zh_entries = await build_voice("zh", ZH_VOICE, "中文", zh_texts, semaphore)

    SAMPLES.mkdir(parents=True, exist_ok=True)
    for key, filename in SAMPLE_FILES.items():
        source = SAMPLE_SRC / filename
        target = SAMPLES / f"{key}.mp3"
        if source.exists():
            target.write_bytes(source.read_bytes())

    full_map = {}
    for key in texts:
        full_map[key] = {voice: results[voice][key] for voice in VOICES}
    pack = {
        "version": 1,
        "voices": {key: {"label": value[0]} for key, value in VOICES.items()},
        "default": "aria",
        "samples": {key: f"audio/samples/{key}.mp3" for key in VOICES},
        "map": full_map,
        "zh": zh_entries,
    }
    PACK_JS.write_text(
        "window.YCT_VOICE_PACK = " + json.dumps(pack, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(f"wrote {PACK_JS} ({PACK_JS.stat().st_size} bytes)", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
