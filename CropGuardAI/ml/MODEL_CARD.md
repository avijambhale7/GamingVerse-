# Model card — `plant_disease_model.tflite`

- **Task:** classify a single leaf image into 38 PlantVillage classes (14 crops, 26 diseases + healthy).
- **Architecture:** MobileNetV2 (α=1.0, 224×224, ImageNet weights) → global average pooling → dropout 0.3 → dense softmax (38).
- **Training data:** up to 550 images per class sampled from PlantVillage `raw/color` (19,423 images total).
  85/15 train/validation split. Horizontal-flip augmentation.
- **Training:** the classifier head was trained on frozen features (Adam 1e-3, early stopping). Then the top 30 backbone
  layers were fine-tuned for 2 epochs (Adam 1e-5).
- **Held-out test set:** 1,200 PlantVillage images that were never used in training (40 per class, for every class with more than 590 images).

| Metric | Value |
|---|---|
| Top-1 accuracy (held-out test) | **94.3 %** |
| Top-3 accuracy (held-out test) | **98.7 %** |
| Validation accuracy | 94.3 % |
| Model size | 9.1 MB (float32) |
| TFLite ops | CONV_2D, DEPTHWISE_CONV_2D, ADD, MUL, MEAN, FULLY_CONNECTED, SOFTMAX (all version 1) |

## Limitations
- PlantVillage photos show single leaves on a plain background under lab-like lighting. Accuracy on cluttered
  field photos will be lower. Photograph one leaf against a plain background for the best results.
- The model only knows these 14 crops. Leaves of other plants are forced into the nearest known class, so watch the
  confidence value and the *uncertain* warning.
- Retrain on the full dataset (`python train_model.py --data … --finetune 3`) to gain a few more points of accuracy.
