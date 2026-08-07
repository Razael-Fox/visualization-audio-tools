# VANT Visualizer Design Specification

## Overview
This document outlines the visual style and technical implementation of the audio visualizer used in the VANT bot, leveraging FFmpeg's `showfreqs` filter for a sleek, "unidirectional" equalizer effect.

## Style: "Seamless Pastel Pink & Purple"

This new theme is explicitly tailored to the user's preference for a cute, seamless, and buttery-smooth animation. It features a soft pink and purple color palette with high-fidelity interpolation.

### Visual Elements
- **Background**: Deep warm blackberry/purple (`#2b112c`). This creates a cozy, cute contrast without being completely harsh black.
- **Visualizer Type**: Frequency spectrum bars (`showfreqs=mode=bar`), generating a unidirectional equalizer growing from the bottom.
- **Color Palette**: 
  - Dual-channel glowing pastel colors: Soft Pink (`0xff99cc`) for the left channel and Light Purple (`0xcc99ff`) for the right channel. The bars overlap beautifully to create a cute, glowing aesthetic.
- **Scaling**:
  - **Amplitude (Vertical)**: Logarithmic (`ascale=log`). Ensures all notes, even quiet melodies, are visible and punchy.
  - **Frequency (Horizontal)**: Logarithmic (`fscale=log`). Spreads out the most active frequencies (mids/bass) for a more balanced spread across the screen.
- **Seamless Animation & Smoothness**: 
  - **Window Size**: Ultra-high resolution processing (`win_size=4096`).
  - **Overlap**: High frame interpolation (`overlap=0.8`).
  - **Averaging**: Temporal smoothing (`averaging=3`) ensures the bars glide up and down seamlessly without aggressive jumping or jittering, creating a very "buttery" and smooth fluid animation.

### FFmpeg Filter Chain
```text
color=c=#2b112c:r=${fps}:s=${size}:d=1[bg];
[0:a]showfreqs=s=${size}:mode=bar:ascale=log:fscale=log:colors=0xff99cc|0xcc99ff:win_size=4096:overlap=0.8:averaging=3:cmode=separate[fg];
[bg][fg]overlay=shortest=0:format=auto[out]
```

### Review & Revisions
Feel free to review this design. If you'd like it tweaked (e.g., changing the background color to something lighter, or increasing/decreasing the smoothness), leave a comment and I can adjust the parameters!
