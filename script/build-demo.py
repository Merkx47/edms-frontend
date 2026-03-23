"""
Build synced demo video: generates per-segment audio, then orchestrates
Playwright recording timed to each segment's exact duration.
"""
import asyncio
import edge_tts
import subprocess
import json
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DEMO_DIR = os.path.join(PROJECT_DIR, 'demo-recordings')
SEGMENTS_FILE = os.path.join(SCRIPT_DIR, 'demo-segments.json')
VOICE = "en-NG-AbeoNeural"
RATE = "+5%"  # Slightly faster, more energetic

os.makedirs(DEMO_DIR, exist_ok=True)

async def generate_segment_audio(segments):
    """Generate individual audio files for each segment and return durations."""
    durations = {}
    for seg in segments:
        audio_path = os.path.join(DEMO_DIR, f"seg_{seg['id']}.mp3")
        communicate = edge_tts.Communicate(seg['narration'].strip(), VOICE, rate=RATE)
        await communicate.save(audio_path)

        # Get duration
        r = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", audio_path],
            capture_output=True, text=True
        )
        dur = float(r.stdout.strip())
        durations[seg['id']] = dur
        print(f"  {seg['id']:20s} -> {dur:5.1f}s  ({audio_path})")

    return durations


def concat_audio(segments):
    """Concatenate all segment audio files with pre-speech silence into one track."""
    # Build ffmpeg complex filter
    inputs = []
    filter_parts = []
    idx = 0

    for seg in segments:
        pause = seg.get('preSpeechPause', 2)
        audio_path = os.path.join(DEMO_DIR, f"seg_{seg['id']}.mp3")

        # Silence before speech
        filter_parts.append(f"aevalsrc=0:d={pause}[sil{idx}]")
        inputs.append(f"[sil{idx}]")
        idx += 1

        # The speech
        filter_parts.append(f"amovie={audio_path}[sp{idx}]")
        inputs.append(f"[sp{idx}]")
        idx += 1

    concat_input = "".join(inputs)
    n = len(inputs)
    full_filter = ";".join(filter_parts) + f";{concat_input}concat=n={n}:v=0:a=1[out]"

    output = os.path.join(DEMO_DIR, "full_narration.mp3")
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
        "-filter_complex", full_filter,
        "-map", "[out]",
        "-c:a", "libmp3lame", "-b:a", "256k",
        "-t", "600",
        output
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Concat error: {result.stderr[-300:]}")
        # Fallback: simple concat
        list_file = os.path.join(DEMO_DIR, "concat_list.txt")
        with open(list_file, 'w') as f:
            for seg in segments:
                pause = seg.get('preSpeechPause', 2)
                audio_path = os.path.join(DEMO_DIR, f"seg_{seg['id']}.mp3")
                # Generate silence file
                sil_path = os.path.join(DEMO_DIR, f"sil_{seg['id']}.mp3")
                subprocess.run([
                    "ffmpeg", "-y", "-f", "lavfi", "-i",
                    f"anullsrc=r=44100:cl=mono",
                    "-t", str(pause), "-c:a", "libmp3lame", "-b:a", "128k", sil_path
                ], capture_output=True)
                f.write(f"file '{sil_path}'\n")
                f.write(f"file '{audio_path}'\n")

        subprocess.run([
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", list_file, "-c:a", "libmp3lame", "-b:a", "256k", output
        ], capture_output=True)

    # Get total duration
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", output],
        capture_output=True, text=True
    )
    total = float(r.stdout.strip())
    print(f"\n  Full narration: {total:.1f}s ({output})")
    return output, total


def generate_timing_file(segments, durations):
    """Write a JSON timing file that the Playwright script will read."""
    timings = []
    for seg in segments:
        pause = seg.get('preSpeechPause', 2)
        speech_dur = durations[seg['id']]
        total_screen_time = pause + speech_dur + 1  # 1s buffer after speech
        timings.append({
            'id': seg['id'],
            'route': seg['route'],
            'preSpeechPause': pause,
            'speechDuration': round(speech_dur, 1),
            'totalScreenTime': round(total_screen_time, 1),
            'actions': seg.get('actions', []),
        })

    timing_path = os.path.join(DEMO_DIR, "timings.json")
    with open(timing_path, 'w') as f:
        json.dump(timings, f, indent=2)

    total = sum(t['totalScreenTime'] for t in timings)
    print(f"  Total video time needed: {total:.1f}s ({total/60:.1f} min)")
    return timing_path


def add_background_music(narration_path, total_duration):
    """Mix soft ambient music under the narration."""
    bg_music = os.path.join(DEMO_DIR, "bg_music.wav")
    mixed = os.path.join(DEMO_DIR, "mixed_audio.mp3")

    # Generate ambient pad
    dur = total_duration + 5
    subprocess.run([
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", f"sine=frequency=174:duration={dur}",
        "-f", "lavfi", "-i", f"sine=frequency=261:duration={dur}",
        "-f", "lavfi", "-i", f"sine=frequency=329:duration={dur}",
        "-filter_complex",
        f"[0:a]volume=0.015[a0];"
        f"[1:a]volume=0.008[a1];"
        f"[2:a]volume=0.006[a2];"
        f"[a0][a1][a2]amix=inputs=3:duration=longest,"
        f"lowpass=f=400,highpass=f=100,"
        f"afade=t=in:st=0:d=3,afade=t=out:st={dur-4}:d=4[out]",
        "-map", "[out]", "-ar", "44100", bg_music
    ], capture_output=True)

    # Mix voice + music
    subprocess.run([
        "ffmpeg", "-y",
        "-i", narration_path,
        "-i", bg_music,
        "-filter_complex",
        "[0:a]volume=1.0[voice];[1:a]volume=0.2[music];"
        "[voice][music]amix=inputs=2:duration=longest:dropout_transition=3",
        "-c:a", "libmp3lame", "-b:a", "256k", mixed
    ], capture_output=True)

    # Cleanup
    os.remove(bg_music)
    print(f"  Mixed audio: {mixed}")
    return mixed


def merge_video_audio(mixed_audio):
    """Merge the Playwright video with the mixed audio."""
    video_files = [f for f in os.listdir(DEMO_DIR) if f.endswith('.webm')]
    if not video_files:
        print("ERROR: No .webm video found! Run the Playwright recording first.")
        return None

    video_path = os.path.join(DEMO_DIR, video_files[0])
    output = os.path.join(DEMO_DIR, "Qucent-FinOps-Demo.mp4")

    subprocess.run([
        "ffmpeg", "-y",
        "-i", video_path,
        "-i", mixed_audio,
        "-c:v", "libx264", "-preset", "slow", "-crf", "12",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "256k",
        "-shortest",
        "-movflags", "+faststart",
        output
    ], capture_output=True)

    size_mb = os.path.getsize(output) / (1024 * 1024)
    print(f"\n  FINAL: {output} ({size_mb:.1f} MB)")
    return output


async def main():
    with open(SEGMENTS_FILE) as f:
        segments = json.load(f)

    print(f"=== Qucent FinOps Demo Builder ===\n")
    print(f"Segments: {len(segments)}")

    # Step 1: Generate per-segment audio
    print(f"\n[1/5] Generating voiceover per segment...")
    durations = await generate_segment_audio(segments)

    # Step 2: Write timing file for Playwright
    print(f"\n[2/5] Generating timing file...")
    timing_path = generate_timing_file(segments, durations)

    # Step 3: Concatenate audio
    print(f"\n[3/5] Concatenating full narration track...")
    narration_path, total_dur = concat_audio(segments)

    # Step 4: Add background music
    print(f"\n[4/5] Adding background music...")
    mixed_path = add_background_music(narration_path, total_dur)

    # Step 5: Record video (run Playwright with timings)
    print(f"\n[5/5] Recording video (this takes ~{total_dur/60:.0f} minutes)...")
    result = subprocess.run(
        ["npx", "tsx", os.path.join(SCRIPT_DIR, "record-demo-synced.ts")],
        cwd=PROJECT_DIR,
        capture_output=True, text=True,
        timeout=int(total_dur + 120)
    )
    if result.returncode != 0:
        print(f"Recording error: {result.stderr[-500:]}")
        print(f"stdout: {result.stdout[-500:]}")
        return
    print(result.stdout)

    # Step 6: Merge
    print(f"\n[6/5] Merging video + audio...")
    final = merge_video_audio(mixed_path)

    if final:
        # Cleanup intermediate files
        for f in os.listdir(DEMO_DIR):
            if f.startswith('seg_') or f.startswith('sil_') or f in ['mixed_audio.mp3', 'full_narration.mp3', 'narration.mp3', 'concat_list.txt', 'timings.json']:
                os.remove(os.path.join(DEMO_DIR, f))
        print(f"\nDone! Open {final}")

asyncio.run(main())
