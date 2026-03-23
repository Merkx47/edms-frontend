import asyncio
import edge_tts
import subprocess
import os

DEMO_DIR = os.path.join(os.path.dirname(__file__), '..', 'demo-recordings')

NARRATION = """
Welcome to the Qucent FinOps Platform — the only enterprise-grade cost management solution purpose-built for Huawei Cloud Stack.

Whether you manage one tenant or fifty, across Lagos, Johannesburg, or Nairobi, this platform gives you complete financial visibility and control over your cloud infrastructure.

Let's begin with the Overview Dashboard. The moment you log in, four KPI cards show you what matters most: your month-to-date spend with trend indicators, budget utilization percentage, total active resources, and the dollar value of savings waiting to be captured. Below that, a thirty-day cost trend chart with a seven-day AI forecast helps you anticipate upcoming spend before it happens.

Now, Cost Analytics. This is where your finance and engineering teams will spend most of their time. Break down costs five different ways — by service, by region, by tenant, by resource type, or view everything as a trend over time. The comparison mode is particularly powerful: compare spending across time periods, across tenants, or across regions in a single view. Every chart is interactive — click any service to drill down into its regional breakdown, cost drivers, and growth rate.

The Resources module reimagines how you explore cloud infrastructure. Resources are organized inside Virtual Data Centers, just like they are in HCS. Toggle between card view and table view. Each resource shows its CPU, memory, network, and disk utilization alongside its cost. Click any resource for a detailed panel showing specs, tags, dependencies, and historical cost data. Advanced filters let you narrow down by service, category, region, or status.

Recommendations is your optimization command center. The platform identifies six types of savings opportunities: rightsizing, idle resources, storage optimization, network cleanup, reserved capacity, and database tuning. Each recommendation shows estimated monthly savings, confidence score, and a clear action plan. Track implementation progress and review your optimization history over time. One-click easy wins let you implement low-effort, high-impact changes instantly.

Tenant Management provides a bird's-eye view of your entire customer base. Each tenant card shows their spend, resource count, efficiency score, and budget status. Click into any tenant for a deep dive — you'll see resource allocation, cost trends over six months, a real-time activity log, and a complete access visibility panel showing who has permissions at each VDC level.

Tag Governance is critical for enterprises. Create standardized tag groups with enforced data types — strings, numbers, dates, enumerations, even JSON key-value pairs. The compliance dashboard shows your overall tagging score, highlights resources missing required tags, and tracks violations with export capabilities. This is how you ensure every resource is properly categorized for cost allocation and compliance.

Budget Management puts you in control. Create budgets scoped to any level — entire tenants, specific VDCs, or geographic zones. A three-color system — green for on track, amber for at risk, red for over budget — makes status instantly clear. Progress bars show exact utilization percentages, and the breadcrumb path shows exactly where each budget sits in your hierarchy.

Cost Allocation uses dual treemap visualizations to show how spending is distributed. On the left, cost by service — see at a glance whether compute, storage, or networking dominates your bill. On the right, cost by tenant — instantly identify which customers are driving the most spend. Expandable legends show exact dollar values.

The Reports module is built for enterprise workflows. Choose from nine pre-built report types covering costs, budgets, savings, and idle resources — or build a custom report with your own filters. Schedule reports to run daily, weekly, or monthly. Export to CSV, PDF, or Excel. Share directly with stakeholders via email.

Waste Detection is your cost recovery tool. It scans for idle compute instances, orphaned storage volumes, and unused network resources. Every wasted resource gets a zero-to-hundred waste score based on utilization and cost impact. The trend chart shows waste reduction over six months — proof that your optimization efforts are working.

Notifications are organized by what matters. Budget alerts, cost anomalies, optimization recommendations, and savings opportunities — each with its own severity level. Critical issues surface immediately. Filter by category, read status, or severity.

The Support Center integrates three channels. Submit tickets with priority levels and file attachments. Start a live chat session with human support agents. Or pick up the phone with twenty-four-seven coverage for critical issues.

The HCS Architecture Guide is an interactive learning tool. A visual diagram shows the complete Huawei Cloud Stack hierarchy — from the root ManageOne platform, through availability zones, tenants, and all five VDC levels down to deployed resources.

Settings gives you full platform control. Manage your profile, set your preferred currency with custom exchange rates, choose your display language, and configure your timezone. The Users tab provides role-based access management. Connect your Huawei Cloud API credentials. Enable two-factor authentication for security.

And yes — everything you've seen works beautifully in dark mode. Toggle with one click for comfortable viewing in any environment.

This is the Qucent FinOps Platform. Two hundred and eighteen features across fourteen modules. Built for Huawei Cloud Stack. Built for Africa. Built for enterprise.
"""

async def generate():
    voice = "en-NG-AbeoNeural"
    output_audio = os.path.join(DEMO_DIR, "narration.mp3")

    print("Step 1/4: Generating voiceover...")
    communicate = edge_tts.Communicate(NARRATION.strip(), voice, rate="-8%", pitch="-2Hz")
    await communicate.save(output_audio)
    print(f"  Narration saved: {output_audio}")

    # Step 2: Generate soft ambient background music using ffmpeg sine waves
    print("Step 2/4: Generating soft background music...")
    bg_music = os.path.join(DEMO_DIR, "bg_music.wav")

    # Get narration duration
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", output_audio],
        capture_output=True, text=True
    )
    duration = float(probe.stdout.strip())
    print(f"  Narration duration: {duration:.1f}s")

    # Create a soft ambient pad: layered sine tones with low volume
    subprocess.run([
        "ffmpeg", "-y",
        "-f", "lavfi", "-i",
        f"sine=frequency=174:duration={duration}",  # Low hum
        "-f", "lavfi", "-i",
        f"sine=frequency=261:duration={duration}",  # Middle C
        "-f", "lavfi", "-i",
        f"sine=frequency=329:duration={duration}",  # E note
        "-filter_complex",
        "[0:a]volume=0.015[a0];"
        "[1:a]volume=0.008[a1];"
        "[2:a]volume=0.006[a2];"
        "[a0][a1][a2]amix=inputs=3:duration=longest,"
        "lowpass=f=400,highpass=f=100,"
        "afade=t=in:st=0:d=3,afade=t=out:st=" + str(duration - 4) + ":d=4[out]",
        "-map", "[out]",
        "-ar", "44100",
        bg_music
    ], capture_output=True, text=True)
    print(f"  Background music saved: {bg_music}")

    # Step 3: Mix narration + background music
    print("Step 3/4: Mixing narration with background music...")
    mixed_audio = os.path.join(DEMO_DIR, "mixed_audio.mp3")
    subprocess.run([
        "ffmpeg", "-y",
        "-i", output_audio,
        "-i", bg_music,
        "-filter_complex",
        "[0:a]volume=1.0[voice];"
        "[1:a]volume=0.25[music];"
        "[voice][music]amix=inputs=2:duration=longest:dropout_transition=3",
        "-c:a", "libmp3lame", "-b:a", "256k",
        mixed_audio
    ], capture_output=True, text=True)
    print(f"  Mixed audio saved: {mixed_audio}")

    # Step 4: Find video and merge with mixed audio
    video_files = [f for f in os.listdir(DEMO_DIR) if f.endswith('.webm')]
    if not video_files:
        print("No video file found! Run record-demo.ts first.")
        return

    video_path = os.path.join(DEMO_DIR, video_files[0])
    output_video = os.path.join(DEMO_DIR, "Qucent-FinOps-Demo.mp4")

    # Get video duration
    vprobe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", video_path],
        capture_output=True, text=True
    )
    vid_duration = float(vprobe.stdout.strip())
    print(f"  Video duration: {vid_duration:.1f}s | Audio duration: {duration:.1f}s")

    print("Step 4/4: Merging video + audio (high quality)...")

    # High quality encode: CRF 12, slow preset, no size limit
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-i", mixed_audio,
        "-c:v", "libx264",
        "-preset", "slow",
        "-crf", "12",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "256k",
        "-shortest",
        "-movflags", "+faststart",
        output_video
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        size_mb = os.path.getsize(output_video) / (1024 * 1024)
        print(f"\n✅ Final video: {output_video}")
        print(f"   Size: {size_mb:.1f} MB")
        print(f"   Resolution: 1920x1080 (2x retina)")
        print(f"   Quality: CRF 12 (near-lossless)")
        print(f"   Audio: Narration + soft ambient background")
    else:
        print(f"ffmpeg error: {result.stderr[-500:]}")

    # Cleanup intermediate files
    for f in ["bg_music.wav", "mixed_audio.mp3"]:
        p = os.path.join(DEMO_DIR, f)
        if os.path.exists(p):
            os.remove(p)

asyncio.run(generate())
