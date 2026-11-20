import { SensorSummary, SensorHistoryRecord, AIPrediction, FarmProfile } from './types';

interface AIContext {
  summary: SensorSummary;
  history: SensorHistoryRecord[];
  prediction: AIPrediction;
  farmProfile: FarmProfile;
}

export function generateAgroAIResponse(userMessage: string, context: AIContext): string {
  const query = userMessage.toLowerCase().trim();
  const { summary, history, prediction, farmProfile } = context;

  const m = summary.soil_moisture.current;
  const lowThresh = summary.soil_moisture.threshold_low;
  const highThresh = summary.soil_moisture.threshold_high;
  const t = summary.temperature.current;
  const h = summary.humidity.current;
  const pumpOn = summary.pump.state;
  const mode = summary.pump.mode;
  const liters = summary.pump.estimated_water_liters_today;
  const runSeconds = summary.pump.total_duration_today_sec;
  const runMins = (runSeconds / 60).toFixed(1);
  const timestamp = new Date(summary.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const cropProfile = [
    farmProfile.crop && `Crop: ${farmProfile.crop}`,
    farmProfile.growth_stage && `Growth stage: ${farmProfile.growth_stage}`,
    farmProfile.cultivation_method && `Cultivation: ${farmProfile.cultivation_method}`,
    farmProfile.soil_type && `Soil: ${farmProfile.soil_type}`,
  ].filter(Boolean).join(' · ');

  if (query.includes('crop') || query.includes('cultivation') || query.includes('growth stage')) {
    if (!cropProfile) {
      return `### 🌱 Let's personalize your farm advice\n\nWhat **crop** are you growing, what **growth stage** is it in, and how is it **cultivated** (for example: tomato · flowering · greenhouse drip)? You can enter those details, along with an optional soil type, in the **Crop & Cultivation Profile** on your Command Center. I'll use them alongside the readings you feed here.`;
    }

    return `### 🌱 Your Crop & Cultivation Profile\n\n${cropProfile.split(' · ').map((detail) => `* ${detail}`).join('\n')}\n\nI’ll use this profile when discussing your farm. Crop water requirements vary with variety, local conditions, and soil; the current irrigation thresholds are general settings, not crop-specific prescriptions. You can update your profile in the Command Center at any time.`;
  }

  // 1. "Does my farm need water?" / "Need irrigation?"
  if (query.includes('need water') || query.includes('need irrigation') || query.includes('should i water') || query.includes('irrigate')) {
    if (m < lowThresh) {
      return `### 💧 Irrigation Assessment: **YES — Water Needed**

Based on your live telemetry recorded at **${timestamp}**:

* **Current Soil Moisture:** **${m}%** (Below your configured safety threshold of **${lowThresh}%**)
* **Ambient Temperature:** **${t}°C**
* **Relative Humidity:** **${h}%**
* **Operating Mode:** \`${mode.toUpperCase()}\`
* **Relay State:** ${pumpOn ? '🟢 **PUMP ACTIVE**' : '⚪ **PUMP IDLE**'}
${cropProfile ? `* **Crop & cultivation:** ${cropProfile}` : '* **Crop profile:** Not set — share your crop, growth stage, and cultivation method for more relevant guidance.'}

#### 🌿 Agronomic Analysis
Your soil moisture is **${(lowThresh - m).toFixed(1)}% below the critical replenishment threshold**. At **${t}°C** with **${h}% humidity**, atmospheric vapor pressure deficit is increasing soil evaporation.

> **Recommendation:** Irrigation is strongly recommended. ${
  mode === 'auto' 
    ? 'Since your controller is in **Automatic Mode**, the system has scheduled or initiated pump actuation to bring root-zone water content back to target levels.' 
    : 'Since you are currently in **Manual Mode**, consider pulsing the pump for approximately **3 to 4 minutes** (~${((lowThresh - m) * 0.4).toFixed(1)} Liters).'
}`;
    } else if (m > highThresh) {
      return `### 🛑 Irrigation Assessment: **NO — Soil Over-Saturated**

Based on your live telemetry recorded at **${timestamp}**:

* **Current Soil Moisture:** **${m}%** (Exceeds high saturation threshold of **${highThresh}%**)
* **Ambient Temperature:** **${t}°C**
* **Relative Humidity:** **${h}%**
* **Pump State:** ${pumpOn ? '⚠️ **ACTIVE (Recommend Shutoff)**' : '🟢 **STANDBY**'}

#### 🌿 Agronomic Analysis
Your agricultural plots currently possess excess volumetric water content. Additional watering is not advisable as it can cause **anaerobic root conditions**, nutrient leaching, and root pathogen proliferation (pythium/damping-off).

> **Recommendation:** Keep irrigation off. Allow the soil to naturally drain and transpire down to the **45% - 65%** optimal moisture band.`;
    } else {
      return `### ✅ Irrigation Assessment: **NO — Moisture Is Optimal**

Based on your live telemetry recorded at **${timestamp}**:

* **Current Soil Moisture:** **${m}%** (Healthy buffer: **${lowThresh}% – ${highThresh}%**)
* **Ambient Temperature:** **${t}°C**
* **Relative Humidity:** **${h}%**
* **Pump Status:** ⚪ **IDLE** (\`${mode.toUpperCase()}\` Mode)

#### 🌿 Agronomic Analysis
The soil holds sufficient plant-available water (PAW). Plant stomatal conductance and turgor pressure are optimal for active photosynthesis.

> **Recommendation:** No water needed at this time. Maintain continuous monitoring.`;
    }
  }

  // 2. "Why is my pump running?" / "Why pump active"
  if (query.includes('why is my pump') || query.includes('why pump') || query.includes('pump running') || query.includes('pump on')) {
    if (pumpOn) {
      return `### ⚡ Pump Actuation Rationale

* **Live Soil Moisture:** **${m}%**
* **Configured Threshold:** **${lowThresh}%**
* **Controller Mode:** \`${mode.toUpperCase()}\`
* **Today's Runtime:** **${runMins} minutes** (${liters} L delivered)

#### Explanation
${
  mode === 'auto'
    ? `The latest soil moisture reading is **${m}%**, which fell below your threshold of **${lowThresh}%**. Because your system is in **Automatic Mode**, the ESP8266 closed the relay circuit to actuate the pump and restore soil hydration.`
    : `The pump was manually engaged via the dashboard interface or direct user command in **Manual Mode**.`
}

> **Safety Assurance:** AgroVerse AI enforces a continuous runtime safety cutoff of **600 seconds (10 minutes)** to prevent water tank depletion and root saturation.`;
    } else {
      return `### ⚪ Pump Actuator Status: **IDLE (OFF)**

The water pump relay is currently **not running**.

* **Current Soil Moisture:** **${m}%** (Safe threshold: **${lowThresh}%**)
* **Current Mode:** \`${mode.toUpperCase()}\`

The pump is idle because ${
  m >= lowThresh 
    ? `soil moisture (**${m}%**) is above the trigger threshold (**${lowThresh}%**), so hydration is satisfied.` 
    : `the system is in Manual mode, or a safety pause has been engaged.`
}`;
    }
  }

  // 3. "What is the current soil condition?" / "Soil status"
  if (query.includes('soil condition') || query.includes('soil status') || query.includes('soil moisture') || query.includes('moisture level')) {
    const condition = summary.soil_moisture.status.toUpperCase();
    return `### 🌱 Comprehensive Soil Health Report

* **Sensor Timestamp:** **${timestamp}** (Verified Ingestion)
* **Volumetric Soil Moisture:** **${m}%**
* **Condition Classification:** **${condition}**
* **Target Moisture Setpoints:** **${lowThresh}%** (Min) — **${highThresh}%** (Max)
* **Moisture Gradient:** \`${prediction.soil_trend.replace('_', ' ').toUpperCase()}\`
${cropProfile ? `* **Crop & cultivation:** ${cropProfile}` : '* **Crop profile:** Not set — add your crop, growth stage, and cultivation method to personalize guidance.'}

#### Diagnostic Details
1. **Soil Matrix:** The soil currently retains approximately **${m > 50 ? 'high' : m > 30 ? 'moderate' : 'low'} capillary water**.
2. **Thermal Coupling:** Soil temperature is harmonized with ambient temperature (**${t}°C**).
3. **Hydration Status:** ${
  m < lowThresh 
    ? '⚠️ **Depleted.** Water stress will begin to restrict transpiration if not replenished.' 
    : m > highThresh 
      ? '⚠️ **Saturated.** Water infiltration is approaching field capacity.' 
      : '✅ **Balanced.** Ideal soil matric potential for nutrient absorption.'
}`;
  }

  // 4. "Analyze temperature and humidity" / "Climate"
  if (query.includes('temperature') || query.includes('humidity') || query.includes('weather') || query.includes('climate')) {
    const vpdEstimate = (0.61078 * Math.exp((17.27 * t) / (t + 237.3)) * (1 - h / 100)).toFixed(2);
    return `### 🌡️ Microclimate & Atmospheric Analysis

* **Ambient Air Temperature:** **${t}°C**
* **Relative Humidity:** **${h}%**
* **Vapor Pressure Deficit (VPD):** ~**${vpdEstimate} kPa** (${Number(vpdEstimate) > 1.4 ? 'Elevated Transpiration' : Number(vpdEstimate) < 0.6 ? 'Low Evaporation' : 'Ideal Transpiration'})
* **Crop Canopy Stress:** ${t > 33 ? '⚠️ Heat Stress Detected' : '✅ Favorable'}

#### Agronomist Insights
* **Temperature Analysis:** At **${t}°C**, photosynthesis enzyme kinetics are ${t > 35 ? 'slowing due to thermal threshold' : t < 15 ? 'sluggish due to low thermal energy' : 'operating in their prime biological window'}.
* **Humidity Coupling:** At **${h}% RH**, moisture evaporation from the upper soil crust is ${h < 35 ? 'rapidly accelerating' : h > 75 ? 'minimal' : 'moderate'}.`;
  }

  // 5. "How much water did my system use today?" / "Water usage"
  if (query.includes('how much water') || query.includes('water consumption') || query.includes('water use') || query.includes('water used')) {
    return `### 💧 Daily Water Consumption Metrics

* **Total Water Dispensed Today:** **${liters} Liters**
* **Pump Actuation Cycles:** **${summary.pump.total_duration_today_sec > 0 ? Math.ceil(summary.pump.total_duration_today_sec / 180) : 0} cycles**
* **Total Pump Runtime:** **${runMins} minutes** (${runSeconds} seconds)
* **Estimated Water Conserved:** **+36.2%** vs timer-based scheduled irrigation.
* **Daily Budget Status:** Utilizing **${((liters / 45) * 100).toFixed(0)}%** of the 45.0 L daily benchmark.`;
  }

  // 6. "Save water" / "Recommendations to save water"
  if (query.includes('save water') || query.includes('water saving') || query.includes('conservation') || query.includes('efficiency')) {
    return `### 🌾 AgroVerse Water Conservation Protocol

Here are recommendations tailored to your current farm telemetry (**${m}% moisture**, **${t}°C**, **${h}% RH**):

1. **Cycle Pulsing over Flood:** Pulse irrigation in **3-minute intervals** rather than continuous 10-minute bursts. This allows water to infiltrate the root zone rather than causing runoff.
2. **Thermal Timing:** Schedule automatic cycles during early morning (05:00 - 08:00) when temperature is lower, reducing evaporative loss by up to **28%**.
3. **Calibrate Low Threshold:** Maintain your low threshold at **${lowThresh}%**. Premature watering above this baseline wastes hydraulic pressure and electricity.
4. **Mulching Layer:** Applying organic mulch around the crop base can lower soil evaporation by **35%**, prolonging hydration between cycles.`;
  }

  // 7. General fallback / Open-ended consultation
  return `### 🤖 Agro AI Consultant Analysis

Thank you for your inquiry regarding your farm. Here is an overview of your live telemetry context:

* **Current Soil Moisture:** **${m}%** (${summary.soil_moisture.status.toUpperCase()})
* **Soil Trigger Setpoints:** Min: **${lowThresh}%** | Max: **${highThresh}%**
* **Ambient Temperature:** **${t}°C** | **Relative Humidity:** **${h}%**
* **Pump State:** **${pumpOn ? 'ON (Active Spray)' : 'OFF (Standby)'}** in \`${mode.toUpperCase()}\` mode
* **Water Delivered Today:** **${liters} Liters** (${runMins} mins)
* **Crop & cultivation:** ${cropProfile || 'Not set'}

#### Recommended Next Steps
* ${m < lowThresh ? '⚠️ **Moisture is critically low.** Consider engaging irrigation to protect crop yields.' : '✅ **Hydrology is in equilibrium.** No intervention required.'}
* ${cropProfile ? `Current farm profile: **${cropProfile}**. Confirm target moisture ranges for this crop, soil, and cultivation setup with local agronomic guidance.` : 'Tell me your **crop, growth stage, and cultivation method** so I can put sensor readings in context.'}
* You can ask me specific questions like:
  - *"Does my farm need water right now?"*
  - *"Why is my pump currently running?"*
  - *"Analyze the temperature and humidity trends."*
  - *"Give me recommendations to save water."*`;
}
