"""Usage: tts.py lines.json out_dir [voice]

Writes one <id>.wav per entry in lines.json.
"""
import json
import sys
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro

lines_path, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
voice = sys.argv[3] if len(sys.argv) > 3 else "af_heart"
out_dir.mkdir(parents=True, exist_ok=True)
kokoro = Kokoro("models/kokoro-v1.0.onnx", "models/voices-v1.0.bin")
for line_id, text in json.loads(lines_path.read_text()).items():
    samples, rate = kokoro.create(text, voice=voice, speed=1.0, lang="en-us")
    sf.write(out_dir / f"{line_id}.wav", samples, rate)
    print(f"{line_id}: {len(samples) / rate:.2f}s")
