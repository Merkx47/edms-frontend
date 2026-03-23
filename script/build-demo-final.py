"""
Demo Builder - Final approach.
1. Record video with generous fixed time per segment (no sync attempt)
2. Log exact timestamps when each segment starts/ends
3. Generate audio segments
4. Stitch audio to match video timestamps exactly
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
VOICE = "en-US-AndrewNeural"

def dur(path):
    r = subprocess.run(["ffprobe","-v","error","-show_entries","format=duration",
        "-of","default=noprint_wrappers=1:nokey=1",path], capture_output=True, text=True)
    return float(r.stdout.strip())

def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)

def srt_time(s):
    h=int(s//3600); m=int((s%3600)//60); sec=int(s%60); ms=int((s%1)*1000)
    return f"{h:02d}:{m:02d}:{sec:02d},{ms:03d}"

async def main():
    with open(SEGMENTS_FILE) as f:
        segments = json.load(f)

    if os.path.exists(DEMO_DIR):
        shutil.rmtree(DEMO_DIR)
    os.makedirs(DEMO_DIR)

    print("=== Qocent FinOps Demo - Final Build ===\n")

    # STEP 1: Record video, capture timestamps
    print("[1/4] Recording video...")
    ts_file = os.path.join(DEMO_DIR, "timestamps.json")
    r = subprocess.run(
        ["npx", "tsx", os.path.join(SCRIPT_DIR, "record-demo-synced.ts")],
        cwd=PROJECT_DIR, capture_output=True, text=True, timeout=600)
    print(r.stdout[-800:] if r.stdout else "")
    if r.returncode != 0:
        print(f"ERROR: {r.stderr[-300:]}")
        return

    # Read timestamps written by Playwright
    if not os.path.exists(ts_file):
        print("No timestamps file! Using estimated timing.")
        return

    with open(ts_file) as f:
        timestamps = json.load(f)

    vid_files = [f for f in os.listdir(DEMO_DIR) if f.endswith('.webm')]
    video_path = os.path.join(DEMO_DIR, vid_files[0])
    video_dur = dur(video_path)
    print(f"  Video: {video_dur:.1f}s ({len(timestamps)} segments)")

    # STEP 2: Generate audio per segment
    print("\n[2/4] Generating voiceover...")
    for seg in segments:
        out = os.path.join(DEMO_DIR, f"seg_{seg['id']}.mp3")
        communicate = edge_tts.Communicate(seg['narration'].strip(), VOICE, rate="+0%")
        await communicate.save(out)
        d = dur(out)
        print(f"  {seg['id']:25s} audio:{d:5.1f}s  video_slot:{timestamps[seg['id']]['duration']:.1f}s")

    # STEP 3: Build full audio track aligned to video timestamps
    print("\n[3/4] Building synced audio track...")

    # For each segment: silence from previous end to this segment's start, then speech
    # If speech is longer than video slot, speed it up. If shorter, pad with silence.
    concat_list = os.path.join(DEMO_DIR, "_concat.txt")
    srt_entries = []
    idx = 0

    with open(concat_list, 'w') as f:
        for seg in segments:
            ts = timestamps[seg['id']]
            seg_start = ts['start']  # seconds into video
            seg_end = ts['end']
            slot_dur = seg_end - seg_start
            pre_pause = seg.get('preSpeechPause', 2)

            audio_path = os.path.join(DEMO_DIR, f"seg_{seg['id']}.mp3")
            speech_dur = dur(audio_path)

            # Time available for speech = slot - pre_pause - 0.5s buffer
            speech_slot = max(1, slot_dur - pre_pause - 0.5)

            # If speech is too long, speed it up
            adjusted_path = os.path.join(DEMO_DIR, f"_adj_{seg['id']}.mp3")
            if speech_dur > speech_slot + 0.5:
                tempo = speech_dur / speech_slot
                tempo = min(tempo, 1.5)  # Never speed up more than 1.5x
                run(["ffmpeg", "-y", "-i", audio_path,
                     "-filter:a", f"atempo={tempo}",
                     "-c:a", "libmp3lame", "-b:a", "256k", adjusted_path])
                speech_dur = dur(adjusted_path)
            else:
                shutil.copy2(audio_path, adjusted_path)

            # Pre-speech silence
            sil_pre = os.path.join(DEMO_DIR, f"_silpre_{seg['id']}.mp3")
            run(["ffmpeg","-y","-f","lavfi","-i",f"anullsrc=r=44100:cl=stereo",
                 "-t",str(pre_pause),"-c:a","libmp3lame","-b:a","128k",sil_pre])
            f.write(f"file '{sil_pre}'\n")

            # Speech
            f.write(f"file '{adjusted_path}'\n")

            # Post-speech silence to fill remaining slot
            remaining = max(0, slot_dur - pre_pause - speech_dur)
            if remaining > 0.1:
                sil_post = os.path.join(DEMO_DIR, f"_silpost_{seg['id']}.mp3")
                run(["ffmpeg","-y","-f","lavfi","-i",f"anullsrc=r=44100:cl=stereo",
                     "-t",str(remaining),"-c:a","libmp3lame","-b:a","128k",sil_post])
                f.write(f"file '{sil_post}'\n")

            # SRT subtitle entry
            sub_start = seg_start + pre_pause
            sub_end = sub_start + speech_dur
            idx += 1
            words = seg['narration'].strip().split()
            text = seg['narration'].strip()
            if len(words) > 12:
                mid = len(words) // 2
                text = ' '.join(words[:mid]) + '\n' + ' '.join(words[mid:])
            srt_entries.append(f"{idx}\n{srt_time(sub_start)} --> {srt_time(sub_end)}\n{text}\n")

    # Concatenate
    full_audio = os.path.join(DEMO_DIR, "full_narration.mp3")
    run(["ffmpeg","-y","-f","concat","-safe","0",
         "-i",concat_list,"-c:a","libmp3lame","-b:a","256k",full_audio])
    audio_dur = dur(full_audio)
    print(f"  Audio: {audio_dur:.1f}s | Video: {video_dur:.1f}s | Diff: {abs(audio_dur-video_dur):.1f}s")

    # Write SRT
    srt_path = os.path.join(DEMO_DIR, "subtitles.srt")
    with open(srt_path, 'w') as f:
        f.write('\n'.join(srt_entries))
    print(f"  Subtitles: {srt_path}")

    # Add background music
    bg = os.path.join(DEMO_DIR, "_bg.wav")
    d = audio_dur + 5
    run(["ffmpeg","-y",
         "-f","lavfi","-i",f"sine=frequency=174:duration={d}",
         "-f","lavfi","-i",f"sine=frequency=261:duration={d}",
         "-f","lavfi","-i",f"sine=frequency=329:duration={d}",
         "-filter_complex",
         f"[0:a]volume=0.012[a0];[1:a]volume=0.007[a1];[2:a]volume=0.005[a2];"
         f"[a0][a1][a2]amix=inputs=3:duration=longest,"
         f"lowpass=f=350,highpass=f=120,"
         f"afade=t=in:st=0:d=3,afade=t=out:st={d-4}:d=4[out]",
         "-map","[out]","-ar","44100",bg])

    mixed = os.path.join(DEMO_DIR, "mixed_audio.mp3")
    run(["ffmpeg","-y","-i",full_audio,"-i",bg,
         "-filter_complex",
         "[0:a]volume=1.0[v];[1:a]volume=0.15[m];"
         "[v][m]amix=inputs=2:duration=first:dropout_transition=3",
         "-c:a","libmp3lame","-b:a","256k",mixed])

    # STEP 4: Merge video + audio + subtitles
    print("\n[4/4] Merging final video...")
    out = os.path.join(DEMO_DIR, "Qocent-FinOps-Demo.mp4")

    # Embed soft subtitles
    run(["ffmpeg","-y",
         "-i",video_path,"-i",mixed,"-i",srt_path,
         "-c:v","libx264","-preset","slow","-crf","14","-pix_fmt","yuv420p",
         "-c:a","aac","-b:a","256k",
         "-c:s","mov_text","-metadata:s:s:0","language=eng",
         "-shortest","-movflags","+faststart",out])

    size = os.path.getsize(out)/(1024*1024)
    final_dur = dur(out)
    print(f"\n  FINAL: {out}")
    print(f"  Duration: {final_dur:.1f}s ({final_dur/60:.1f} min)")
    print(f"  Size: {size:.1f} MB")

    # Cleanup
    for f in os.listdir(DEMO_DIR):
        if f.startswith('_') or f.startswith('seg_') or f in ['full_narration.mp3','mixed_audio.mp3','timestamps.json']:
            os.remove(os.path.join(DEMO_DIR, f))

    print("\nDone!")

asyncio.run(main())
