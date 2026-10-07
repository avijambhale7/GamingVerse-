# 🌿 CropGuard AI — AI-Based Crop Disease Detection (Android)

CropGuard AI is an offline Android app that finds crop diseases from a photo of a leaf.
It runs a **MobileNetV2 deep-learning model (TensorFlow Lite)** on the phone. The model was
trained on the **PlantVillage** dataset and recognises **38 classes (26 diseases + healthy) across 14 crops**.

> Built with Kotlin · Jetpack Compose · Material 3 · CameraX · TensorFlow Lite

---

## ✨ Features

| Feature | Description |
|---|---|
| 📷 **Live camera scan** | Real-time diagnosis in the CameraX viewfinder, with an animated scan frame, colour-coded results (green = healthy, red = diseased) and a flashlight toggle |
| 🖼️ **Gallery upload** | Analyse any leaf photo from the gallery (Android photo picker, so no storage permission is needed) |
| 🧠 **On-device deep learning** | MobileNetV2 TFLite model with test-time augmentation; shows top-3 predictions with confidence |
| 🔥 **Disease heatmap** | Computer-vision HSV segmentation marks infected tissue in red on the photo |
| 📊 **Severity estimation** | Affected leaf area %, a leaf health score (0-100) and a Healthy / Mild / Moderate / Severe rating |
| 💊 **Treatment advice** | Symptoms, causes, **organic** and **chemical** treatments (with doses), and prevention for every disease |
| 📚 **Disease library** | Searchable guide to all 38 classes, filterable by crop |
| 🕑 **Scan history** | Every scan is saved with its image. Filter healthy/diseased, reopen, delete |
| 📈 **Farm insights** | Health distribution donut chart, most frequent diseases, and scans per crop |
| 🌦️ **Weather disease risk** | Enter temperature, humidity and rain/dew to see the infection risk for 8 major diseases |
| 🔊 **Voice read-out** | Text-to-speech reads the diagnosis aloud, which helps farmers with low literacy |
| 📄 **PDF report & share** | Export a PDF report (photo + heatmap + treatment) or share a text summary on WhatsApp etc. |
| 🌐 **Multilingual** | English, हिन्दी (Hindi), मराठी (Marathi), switchable inside the app |
| 🌙 **Dark mode** | System / Light / Dark themes |
| ✈️ **100% offline** | No internet and no account needed. Data stays on the device |
| 👋 **Onboarding** | 3-page introduction on first launch |

### Supported crops
Apple · Blueberry · Cherry · Corn · Grape · Orange · Peach · Bell Pepper · Potato · Raspberry · Soybean · Squash · Strawberry · Tomato

---

## 🚀 How to run

**Requirements:** [Android Studio](https://developer.android.com/studio) (Ladybug 2024.2 or newer) with JDK 17+ (bundled with Android Studio).

1. Unzip `CropGuardAI.zip`.
2. Open Android Studio → **File → Open** → select the `CropGuardAI` folder.
3. Wait for Gradle sync to finish. The first sync downloads dependencies, so it needs internet.
4. Connect an Android phone (Android 7.0+, USB debugging on) or start an emulator.
5. Press ▶ **Run**.

To build an APK from the command line:
```bash
./gradlew assembleDebug        # → app/build/outputs/apk/debug/app-debug.apk
```

> 💡 For the best results, test on a real phone with a camera. On an emulator, use **Upload from Gallery**
> with leaf images (e.g. drag images from the PlantVillage dataset into the emulator).

---

## 🧠 The AI model

| | |
|---|---|
| Architecture | MobileNetV2 (ImageNet pre-trained) + softmax classifier, transfer learning |
| Input | 224×224 RGB, float32 pixel values 0-255 (normalisation is inside the model) |
| Output | 38 softmax probabilities (order = `assets/labels.txt`) |
| Size | ~9 MB |
| Inference | ~50-150 ms on a mid-range phone (4 CPU threads) |
| Held-out test accuracy | see `ml/MODEL_CARD.md` |

The app combines two kinds of AI:
1. A **CNN classifier**, which answers "what disease is it?"
2. **Classical computer vision** (HSV colour segmentation with an integral-image neighbourhood filter),
   which answers "how much of the leaf is infected?" and draws the heatmap.

Safety checks: if confidence is below the threshold you set (default 50%), the result is marked
*uncertain*. If too little leaf is visible, the app asks for a better photo.

### Retrain or improve the model
```bash
cd ml
pip install tensorflow pillow
git clone --depth 1 https://github.com/spMohanty/PlantVillage-Dataset
python train_model.py --data PlantVillage-Dataset/raw/color --out ../app/src/main/assets --finetune 3
```
This overwrites `app/src/main/assets/plant_disease_model.tflite` and `labels.txt`. Rebuild the app afterwards.
`ml/build_knowledge_base.py` regenerates the disease knowledge base (`assets/diseases.json`).

---

## 🗂️ Project structure

```
CropGuardAI/
├── app/src/main/
│   ├── assets/
│   │   ├── plant_disease_model.tflite   # trained MobileNetV2 model
│   │   ├── labels.txt                   # 38 class labels
│   │   └── diseases.json                # offline knowledge base (symptoms, treatment…)
│   ├── java/com/cropguard/ai/
│   │   ├── MainActivity.kt              # navigation + bottom bar
│   │   ├── MainViewModel.kt             # analysis pipeline & state
│   │   ├── CropGuardApp.kt              # app container (DI)
│   │   ├── ml/
│   │   │   ├── DiseaseClassifier.kt     # TensorFlow Lite inference
│   │   │   ├── LeafAnalyzer.kt          # severity + heatmap (computer vision)
│   │   │   └── RiskCalculator.kt        # weather-based disease risk model
│   │   ├── data/                        # knowledge base, history, settings repositories
│   │   ├── util/                        # image loading, PDF report, text-to-speech
│   │   └── ui/                          # Compose theme, components, screens
│   └── res/                             # strings (en / hi / mr), icons, themes
└── ml/
    ├── train_model.py                   # model training & TFLite export
    ├── build_knowledge_base.py          # generates diseases.json
    └── MODEL_CARD.md                    # training details & accuracy
```

## ⚙️ Tech stack
Kotlin 2.0 · Jetpack Compose (BOM 2024.10) · Material 3 · Navigation Compose · CameraX 1.4 ·
TensorFlow Lite 2.16 · Coil · Kotlin Coroutines/Flow · MVVM · min SDK 24, target SDK 35.

## ⚠️ Disclaimer
AI predictions are for guidance only. Talk to a local agricultural expert or Krishi Vigyan Kendra
before you apply any chemical, and always follow the pesticide label.

## 📜 Credits
Dataset: *PlantVillage* (Hughes & Salathé, 2015, arXiv:1511.08060), CC BY-SA licensed images.
