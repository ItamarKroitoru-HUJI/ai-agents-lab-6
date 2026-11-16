"""Usage: tts.py "<text>" out.wav [voice]"""
import sys
import soundfile as sf
from kokoro_onnx import Kokoro

text, out = sys.argv[1], sys.argv[2]
voice = sys.argv[3] if len(sys.argv) > 3 else "af_heart"
kokoro = Kokoro("models/kokoro-v1.0.onnx", "models/voices-v1.0.bin")
samples, rate = kokoro.create(text, voice=voice, speed=1.0, lang="en-us")
sf.write(out, samples, rate)
print(f"{out}: {len(samples) / rate:.2f}s")
