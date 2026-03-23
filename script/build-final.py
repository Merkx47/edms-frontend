"""
Final demo builder.
1. Generate audio per segment, measure durations
2. Record video driven by audio durations (voice leads, screen follows)
3. Concatenate audio with exact timing
4. Merge video + audio (they match because video was timed to audio)
"""
import asyncio, edge_tts, subprocess, json, os, shutil

DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(DIR)
OUT = os.path.join(ROOT, 'demo-recordings')
SEGS = os.path.join(DIR, 'demo-segments.json')
VOICE = "en-US-AndrewNeural"

def d(p):
    r=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",p],capture_output=True,text=True)
    return float(r.stdout.strip())

def srt_t(s):
    return f"{int(s//3600):02d}:{int((s%3600)//60):02d}:{int(s%60):02d},{int((s%1)*1000):03d}"

async def main():
    with open(SEGS) as f: segments = json.load(f)
    if os.path.exists(OUT): shutil.rmtree(OUT)
    os.makedirs(OUT)

    print("=== Qocent FinOps Demo ===\n")

    # 1. Generate audio clips + measure durations
    print("[1/5] Generating voiceover...")
    durations = {}
    for seg in segments:
        p = os.path.join(OUT, f"seg_{seg['id']}.mp3")
        c = edge_tts.Communicate(seg['narration'].strip(), VOICE, rate="+0%")
        await c.save(p)
        durations[seg['id']] = d(p)
        print(f"  {seg['id']:25s} {durations[seg['id']]:5.1f}s")

    # Write durations file for Playwright
    with open(os.path.join(OUT, 'audio_durations.json'), 'w') as f:
        json.dump(durations, f, indent=2)

    # 2. Record video (Playwright reads durations and paces to match)
    print("\n[2/5] Recording video (paced by audio durations)...")
    r = subprocess.run(
        ["npx", "tsx", os.path.join(DIR, "record-narrated.ts")],
        cwd=ROOT, capture_output=True, text=True, timeout=600)
    print(r.stdout if r.stdout else "")
    if r.returncode != 0:
        print(f"ERROR: {r.stderr[-300:]}")
        return

    video = os.path.join(OUT, 'raw_4k.mp4')
    if not os.path.exists(video):
        # Fallback to webm
        vids = [f for f in os.listdir(OUT) if f.endswith('.webm')]
        video = os.path.join(OUT, vids[0])
    vid_dur = d(video)

    # Read timestamps from Playwright
    with open(os.path.join(OUT, 'timestamps.json')) as f:
        ts = json.load(f)

    # 3. Build concatenated audio track matching video timestamps
    print("\n[3/5] Building synced audio...")
    concat = os.path.join(OUT, '_concat.txt')
    srt = []
    cursor = 0.0

    with open(concat, 'w') as f:
        for i, seg in enumerate(segments):
            seg_ts = ts[seg['id']]
            seg_video_start = seg_ts['start']
            pre_pause = seg.get('preSpeechPause', 2)
            speech_dur = durations[seg['id']]

            # Silence to align to video segment start
            gap = seg_video_start - cursor
            if gap > 0.05:
                sil = os.path.join(OUT, f'_gap{i}.mp3')
                subprocess.run(["ffmpeg","-y","-f","lavfi","-i",f"anullsrc=r=44100:cl=stereo",
                    "-t",str(gap),"-c:a","libmp3lame","-b:a","128k",sil], capture_output=True)
                f.write(f"file '{sil}'\n")
                cursor += gap

            # Pre-speech silence
            if pre_pause > 0:
                sil = os.path.join(OUT, f'_pre{i}.mp3')
                subprocess.run(["ffmpeg","-y","-f","lavfi","-i",f"anullsrc=r=44100:cl=stereo",
                    "-t",str(pre_pause),"-c:a","libmp3lame","-b:a","128k",sil], capture_output=True)
                f.write(f"file '{sil}'\n")
                cursor += pre_pause

            # Speech
            speech_path = os.path.join(OUT, f"seg_{seg['id']}.mp3")
            f.write(f"file '{speech_path}'\n")

            # SRT entry
            sub_start = cursor
            sub_end = cursor + speech_dur
            words = seg['narration'].strip().split()
            txt = seg['narration'].strip()
            if len(words) > 12:
                mid = len(words)//2
                txt = ' '.join(words[:mid]) + '\n' + ' '.join(words[mid:])
            srt.append(f"{len(srt)+1}\n{srt_t(sub_start)} --> {srt_t(sub_end)}\n{txt}\n")

            cursor += speech_dur

    # Pad to video length
    if cursor < vid_dur:
        pad = os.path.join(OUT, '_pad.mp3')
        subprocess.run(["ffmpeg","-y","-f","lavfi","-i",f"anullsrc=r=44100:cl=stereo",
            "-t",str(vid_dur - cursor),"-c:a","libmp3lame","-b:a","128k",pad], capture_output=True)
        with open(concat, 'a') as f:
            f.write(f"file '{pad}'\n")

    full = os.path.join(OUT, 'full.mp3')
    subprocess.run(["ffmpeg","-y","-f","concat","-safe","0","-i",concat,
        "-c:a","libmp3lame","-b:a","256k",full], capture_output=True)

    audio_dur = d(full)
    print(f"  Audio: {audio_dur:.1f}s | Video: {vid_dur:.1f}s | Diff: {abs(audio_dur-vid_dur):.1f}s")

    # Write SRT
    srt_path = os.path.join(OUT, 'subtitles.srt')
    with open(srt_path, 'w') as f: f.write('\n'.join(srt))

    # 4. Generate warm ambient background music
    print("\n[4/5] Generating therapeutic ambient background...")
    bg = os.path.join(OUT, '_bg.wav')
    dd = audio_dur + 5
    # Rich ambient pad: C major 7th chord with warm harmonics + gentle tremolo
    # Frequencies: C3(130.8), E3(164.8), G3(196), B3(246.9), C4(261.6), G4(392)
    subprocess.run(["ffmpeg","-y",
        "-f","lavfi","-i",f"sine=frequency=130.8:duration={dd}",
        "-f","lavfi","-i",f"sine=frequency=164.8:duration={dd}",
        "-f","lavfi","-i",f"sine=frequency=196:duration={dd}",
        "-f","lavfi","-i",f"sine=frequency=246.9:duration={dd}",
        "-f","lavfi","-i",f"sine=frequency=261.6:duration={dd}",
        "-f","lavfi","-i",f"sine=frequency=392:duration={dd}",
        "-filter_complex",
        # Mix with varying volumes, apply warmth + gentle tremolo
        f"[0:a]volume=0.04[c3];[1:a]volume=0.03[e3];[2:a]volume=0.035[g3];"
        f"[3:a]volume=0.02[b3];[4:a]volume=0.025[c4];[5:a]volume=0.015[g4];"
        f"[c3][e3][g3][b3][c4][g4]amix=inputs=6:duration=longest,"
        # Warm lowpass + gentle tremolo for movement
        f"lowpass=f=400,highpass=f=80,"
        f"tremolo=f=0.15:d=0.3,"
        # Fade in/out
        f"afade=t=in:st=0:d=5,afade=t=out:st={dd-5}:d=5[out]",
        "-map","[out]","-ar","44100",bg], capture_output=True)

    mixed = os.path.join(OUT, 'mixed.mp3')
    subprocess.run(["ffmpeg","-y","-i",full,"-i",bg,
        "-filter_complex","[0:a]volume=1.0[v];[1:a]volume=0.25[m];"
        "[v][m]amix=inputs=2:duration=first:dropout_transition=3",
        "-c:a","libmp3lame","-b:a","256k",mixed], capture_output=True)

    # 5. Merge video + audio + burn subtitles at 4K quality
    print("\n[5/5] Final merge (4K, burned-in subtitles)...")
    out = os.path.join(OUT, 'Qocent-FinOps-Demo.mp4')
    # Use soft subtitle track (libass not available for burn-in)
    r = subprocess.run(["ffmpeg","-y",
        "-i",video,"-i",mixed,"-i",srt_path,
        "-c:v","libx264","-preset","slow","-crf","1",
        "-pix_fmt","yuv420p",
        "-c:a","aac","-b:a","320k",
        "-c:s","mov_text","-metadata:s:s:0","language=eng",
        "-shortest","-movflags","+faststart",out], capture_output=True)
    if r.returncode != 0:
        err = r.stderr.decode() if isinstance(r.stderr, bytes) else r.stderr
        print(f"FFmpeg error: {err[-500:]}")
        return

    sz = os.path.getsize(out)/(1024*1024)
    fd = d(out)
    print(f"\n  FINAL: {out}")
    print(f"  Duration: {fd:.1f}s ({fd/60:.1f} min) | Size: {sz:.1f} MB")

    # Cleanup
    for f in os.listdir(OUT):
        if f.startswith('_') or f.startswith('seg_') or f in ['full.mp3','mixed.mp3','audio_durations.json','timestamps.json']:
            os.remove(os.path.join(OUT, f))
    print("\nDone!")

asyncio.run(main())
