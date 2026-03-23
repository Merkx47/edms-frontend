"""
Synced demo builder v2.1
- No scrolling (steady screen)
- Subtitle generation (SRT burned into video)
- Precise segment timing
"""
import asyncio
import edge_tts
import subprocess
import json
import os
import shutil

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DEMO_DIR = os.path.join(PROJECT_DIR, 'demo-recordings')
SEGMENTS_FILE = os.path.join(SCRIPT_DIR, 'demo-segments.json')
VOICE = "en-US-AndrewNeural"  # Warm, Confident, Authentic

def get_duration(path):
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True)
    return float(r.stdout.strip())

def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        print(f"  CMD FAILED: {' '.join(str(c) for c in cmd[:6])}")
        print(f"  {r.stderr[-300:]}")
    return r

def fmt_srt_time(seconds):
    """Convert seconds to SRT timestamp: HH:MM:SS,mmm"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

async def step1_generate_audio(segments):
    print("\n[1/6] Generating voiceover clips...")
    durations = {}
    for seg in segments:
        out = os.path.join(DEMO_DIR, f"seg_{seg['id']}.mp3")
        communicate = edge_tts.Communicate(seg['narration'].strip(), VOICE, rate="+0%")
        await communicate.save(out)
        d = get_duration(out)
        durations[seg['id']] = d
        print(f"  {seg['id']:20s}  {d:5.1f}s")
    return durations

def step2_build_audio_and_timings(segments, durations):
    print("\n[2/6] Building audio track + timing file...")

    concat_list = os.path.join(DEMO_DIR, "_concat.txt")
    timings = []
    cursor = 0.0  # current time position

    with open(concat_list, 'w') as f:
        for seg in segments:
            pause = seg.get('preSpeechPause', 2)
            speech = durations[seg['id']]
            screen_time = pause + speech + 1  # pause + speech + 1s buffer

            # Silence before speech
            sil = os.path.join(DEMO_DIR, f"_sil_{seg['id']}.mp3")
            run(["ffmpeg", "-y", "-f", "lavfi", "-i",
                 f"anullsrc=r=44100:cl=stereo", "-t", str(pause),
                 "-c:a", "libmp3lame", "-b:a", "128k", sil])
            f.write(f"file '{sil}'\n")

            speech_start = cursor + pause
            speech_end = speech_start + speech

            # Speech clip
            speech_path = os.path.join(DEMO_DIR, f"seg_{seg['id']}.mp3")
            f.write(f"file '{speech_path}'\n")

            # Buffer silence after speech
            buf = os.path.join(DEMO_DIR, f"_buf_{seg['id']}.mp3")
            run(["ffmpeg", "-y", "-f", "lavfi", "-i",
                 f"anullsrc=r=44100:cl=stereo", "-t", "1",
                 "-c:a", "libmp3lame", "-b:a", "128k", buf])
            f.write(f"file '{buf}'\n")

            timings.append({
                'id': seg['id'],
                'route': seg['route'],
                'screenTimeMs': int(screen_time * 1000),
                'prePauseMs': int(pause * 1000),
                'speechMs': int(speech * 1000),
                'speechStart': round(speech_start, 2),
                'speechEnd': round(speech_end, 2),
                'narration': seg['narration'],
                'actions': seg.get('actions', []),
            })

            cursor += screen_time

    # Concatenate
    out = os.path.join(DEMO_DIR, "full_narration.mp3")
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0",
         "-i", concat_list, "-c:a", "libmp3lame", "-b:a", "256k", out])

    actual = get_duration(out)
    print(f"  Audio: {actual:.1f}s ({actual/60:.1f} min)")

    # Write timings
    timings_path = os.path.join(DEMO_DIR, "timings.json")
    with open(timings_path, 'w') as f:
        json.dump(timings, f, indent=2)

    return out, actual, timings

def step3_generate_subtitles(timings):
    print("\n[3/6] Generating subtitles...")
    srt_path = os.path.join(DEMO_DIR, "subtitles.srt")

    with open(srt_path, 'w') as f:
        for i, t in enumerate(timings, 1):
            start = fmt_srt_time(t['speechStart'])
            end = fmt_srt_time(t['speechEnd'])
            text = t['narration'].strip()

            # Split long narrations into 2-line chunks for readability
            words = text.split()
            if len(words) > 15:
                mid = len(words) // 2
                line1 = ' '.join(words[:mid])
                line2 = ' '.join(words[mid:])
                text = f"{line1}\n{line2}"

            f.write(f"{i}\n{start} --> {end}\n{text}\n\n")

    print(f"  Subtitles: {srt_path} ({len(timings)} segments)")
    return srt_path

def step4_add_music(narration_path, duration):
    print("\n[4/6] Adding background music...")
    bg = os.path.join(DEMO_DIR, "_bg.wav")
    d = duration + 5
    run(["ffmpeg", "-y",
         "-f", "lavfi", "-i", f"sine=frequency=174:duration={d}",
         "-f", "lavfi", "-i", f"sine=frequency=261:duration={d}",
         "-f", "lavfi", "-i", f"sine=frequency=329:duration={d}",
         "-filter_complex",
         f"[0:a]volume=0.012[a0];[1:a]volume=0.007[a1];[2:a]volume=0.005[a2];"
         f"[a0][a1][a2]amix=inputs=3:duration=longest,"
         f"lowpass=f=350,highpass=f=120,"
         f"afade=t=in:st=0:d=3,afade=t=out:st={d-4}:d=4[out]",
         "-map", "[out]", "-ar", "44100", bg])

    mixed = os.path.join(DEMO_DIR, "mixed_audio.mp3")
    run(["ffmpeg", "-y",
         "-i", narration_path, "-i", bg,
         "-filter_complex",
         "[0:a]volume=1.0[v];[1:a]volume=0.15[m];"
         "[v][m]amix=inputs=2:duration=first:dropout_transition=3",
         "-c:a", "libmp3lame", "-b:a", "256k", mixed])

    print(f"  Mixed: {get_duration(mixed):.1f}s")
    return mixed

def step5_record_video():
    print("\n[5/6] Recording video...")
    r = subprocess.run(
        ["npx", "tsx", os.path.join(SCRIPT_DIR, "record-demo-synced.ts")],
        cwd=PROJECT_DIR, capture_output=True, text=True, timeout=600)
    print(r.stdout[-600:] if r.stdout else "")
    if r.returncode != 0:
        print(f"  ERROR: {r.stderr[-300:]}")
        return False

    vids = [f for f in os.listdir(DEMO_DIR) if f.endswith('.webm')]
    if not vids:
        print("  No .webm found!")
        return False
    vid = os.path.join(DEMO_DIR, vids[0])
    print(f"  Video: {get_duration(vid):.1f}s")
    return True

def step6_merge(srt_path):
    print("\n[6/6] Merging video + audio + subtitles...")
    vids = [f for f in os.listdir(DEMO_DIR) if f.endswith('.webm')]
    vid = os.path.join(DEMO_DIR, vids[0])
    mixed = os.path.join(DEMO_DIR, "mixed_audio.mp3")
    out = os.path.join(DEMO_DIR, "Qocent-FinOps-Demo.mp4")

    vid_dur = get_duration(vid)
    aud_dur = get_duration(mixed)
    drift = abs(vid_dur - aud_dur)
    print(f"  Video: {vid_dur:.1f}s | Audio: {aud_dur:.1f}s | Drift: {drift:.1f}s")

    # Build video filter: speed adjust if needed + burn subtitles
    speed = vid_dur / aud_dur if drift > 5 else 1.0
    if speed != 1.0:
        print(f"  Adjusting video speed: {speed:.3f}x")

    # Step A: Speed-adjust video if needed (without subtitles first)
    adjusted_vid = os.path.join(DEMO_DIR, "_adjusted.mp4")
    if speed != 1.0:
        print(f"  Adjusting video speed: {speed:.3f}x")
        run(["ffmpeg", "-y", "-i", vid,
             "-vf", f"setpts={1/speed}*PTS",
             "-c:v", "libx264", "-preset", "slow", "-crf", "14",
             "-pix_fmt", "yuv420p", "-an", adjusted_vid])
    else:
        adjusted_vid = vid

    # Step B: Merge adjusted video + audio
    merged_no_subs = os.path.join(DEMO_DIR, "_merged.mp4")
    run(["ffmpeg", "-y",
         "-i", adjusted_vid, "-i", mixed,
         "-c:v", "copy", "-c:a", "aac", "-b:a", "256k",
         "-shortest", "-movflags", "+faststart", merged_no_subs])

    # Step C: Burn subtitles onto merged video
    # Copy SRT to a simple path to avoid escaping issues
    simple_srt = os.path.join(DEMO_DIR, "subs.srt")
    shutil.copy2(srt_path, simple_srt)

    vf_sub = "subtitles=subs.srt:force_style='FontName=Arial,FontSize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=2,Shadow=0,MarginV=40'"
    r = subprocess.run(
        f'ffmpeg -y -i _merged.mp4 -vf "{vf_sub}" -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p -c:a copy -movflags +faststart Qocent-FinOps-Demo.mp4',
        shell=True, capture_output=True, text=True, cwd=DEMO_DIR)

    if r.returncode != 0 or not os.path.exists(out):
        print("  Subtitle burn failed, using video without subtitles...")
        shutil.copy2(merged_no_subs, out)

    # Cleanup temp
    for tmp in [adjusted_vid, merged_no_subs, simple_srt]:
        if os.path.exists(tmp) and tmp != vid:
            try: os.remove(tmp)
            except: pass

    size = os.path.getsize(out) / (1024*1024)
    final_dur = get_duration(out)
    print(f"\n  FINAL: {out}")
    print(f"  Duration: {final_dur:.1f}s ({final_dur/60:.1f} min)")
    print(f"  Size: {size:.1f} MB")
    return out

def cleanup():
    for f in os.listdir(DEMO_DIR):
        if f.startswith('_') or f.startswith('seg_') or f in [
            'mixed_audio.mp3', 'full_narration.mp3', 'timings.json',
        ]:
            os.remove(os.path.join(DEMO_DIR, f))

async def main():
    with open(SEGMENTS_FILE) as f:
        segments = json.load(f)

    if os.path.exists(DEMO_DIR):
        shutil.rmtree(DEMO_DIR)
    os.makedirs(DEMO_DIR)

    print("=== Qucent FinOps Demo Builder v2.1 ===")
    print(f"Segments: {len(segments)} | Voice: {VOICE} | No scrolling\n")

    durations = await step1_generate_audio(segments)
    narration, nar_dur, timings = step2_build_audio_and_timings(segments, durations)
    srt_path = step3_generate_subtitles(timings)
    mixed = step4_add_music(narration, nar_dur)
    ok = step5_record_video()
    if not ok:
        print("\nRecording failed!")
        return
    final = step6_merge(srt_path)
    cleanup()
    print(f"\nDone!")

asyncio.run(main())
