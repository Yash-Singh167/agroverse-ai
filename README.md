# 🌾 AgroVerse AI — Smart Irrigation & Precision Agriculture Platform

AgroVerse AI is an IoT-based smart agriculture platform featuring an **interactive 3D farm digital twin**, real-time **sensor command center**, and an intelligent **conversational AI assistant ("Agro AI")** with direct memory of your soil and microclimate telemetry.

---

## 🚀 Key Features

1. **Direct Webapp Data Feeder & Simulator**:
   - Zero physical hardware required to test! Feed customized sensor data directly inside the webapp.
   - 1-Click agricultural scenario presets:
     - 🌵 *Drought Stress* (18.4% Moisture, 35.8°C, 24% RH)
     - 🌾 *Optimal Spring Bloom* (48.0% Moisture, 24.5°C, 62% RH)
     - 🌊 *Saturated Soil* (82.5% Moisture, 21.0°C, 85% RH)
     - 🔥 *Heatwave Evapotranspiration* (27.2% Moisture, 39.5°C, 19% RH)
     - 💧 *Active Pump Actuation* (25.0% Moisture, Pump: ON)
   - Fine-tuning sliders and editable numeric inputs for Soil Moisture %, Ambient Temperature °C, and Relative Humidity %.
   - A locally saved crop profile (crop, growth stage, cultivation method, and optional soil type) used by Agro AI for farm-specific context.

2. **Interactive 3D Farm Digital Twin (WebGL / Three.js / React Three Fiber)**:
   - Dynamic soil color mapping reacting in real time (Clay Brown for Dry, Fertile Loam for Optimal, Damp Blue/Teal for Saturated).
   - Animated water sprinkler particles spraying over crop beds when the pump is active.
   - Procedural crops with natural wind movement.
   - Water tank and industrial pump with vibration and status LEDs.
   - Clickable 3D sensor markers and OrbitControls with viewpoint presets.
   - Low-power 2D Schematic Fallback view for low-end hardware.

3. **Conversational "Agro AI" Consultant**:
   - Ingests the exact live numbers fed into the platform.
   - Answers questions like:
     - *"Does my farm need water?"*
     - *"What is the current soil condition?"*
     - *"Why is my pump currently running?"*
     - *"Analyze the temperature and humidity."*
     - *"Give me recommendations to save water."*
   - Markdown formatting with copy and clear tools.

4. **Irrigation Actuator Command Center**:
   - Automatic mode vs Manual override.
   - Safety confirmation modal before energizing the pump.
   - Continuous runtime fail-safe cutoff (10-minute auto shutoff).
   - Low and High threshold setpoint sliders.

5. **Historical Analytics & Audit Logs**:
   - Interactive Recharts area graphs for soil moisture, temperature, and humidity.
   - Critical 30% trigger threshold benchmark line.
   - Export history to CSV.

---

## 🛠️ Quick Start

### Frontend (Next.js 14)
```bash
cd frontend
pnpm dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

- Sign up or click **"⚡ Auto-fill Demo Agronomist Credentials"** on the login page.
- Navigate to the **Command Center**, enter your own sensor readings and crop/cultivation details in the **Direct Telemetry Feeder**, then consult **Agro AI**. The assistant asks about your crop and uses the saved profile alongside your telemetry.

### Enable Google sign-in

Google sign-in uses Supabase Auth. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `frontend/.env.local`, then restart the frontend. In Supabase, enable the Google provider and enter the Google OAuth client ID and client secret. Set the Google OAuth redirect URI to `https://<your-project-ref>.supabase.co/auth/v1/callback`, and allow `http://localhost:3000/dashboard` as a redirect URL in Supabase Auth.

The Google client ID is configured in Supabase, not in frontend source. Never put the Google client secret in the frontend or commit it.

### Backend (Python FastAPI - Optional)
```bash
python -m pip install -r backend/requirements.txt
python backend/run.py
```
API Documentation: **[http://localhost:8000/docs](http://localhost:8000/docs)**

### Enable Gemini chat

1. Copy the root `.env.example` to `.env`.
2. Set `AI_PROVIDER=gemini` and replace `GEMINI_API_KEY` with your key from [Google AI Studio](https://aistudio.google.com/app/apikey). Keep this key in the backend `.env` file; do not put it in `frontend/.env.local` or share it in chat.
3. Start or restart the backend from the project root with `python backend/run.py`.

The default model is `gemini-3-flash-preview`; change `LLM_MODEL` in `.env` if you select a different model available to your API key.

The chat sends your current sensor readings, crop profile, and recent conversation to the backend. Without Gemini configured, set `AI_PROVIDER=local` to use the built-in rule-based assistant. Gemini connection/configuration errors are shown in the chat rather than silently switching providers.
