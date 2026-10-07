"""
CropGuard AI - model training script.

Trains a MobileNetV2 transfer-learning classifier on the PlantVillage dataset
(38 classes, 14 crops) and exports a TensorFlow Lite model that the Android
app loads from app/src/main/assets/.

Usage:
    pip install tensorflow pillow
    git clone --depth 1 https://github.com/spMohanty/PlantVillage-Dataset
    python train_model.py --data PlantVillage-Dataset/raw/color --out ../app/src/main/assets

Options:
    --per-class N   use at most N images per class (default: all)
    --epochs N      epochs for the classifier head (default 25)
    --finetune N    extra epochs fine-tuning the top of the backbone (default 0)

The exported model takes a float32 tensor [1, 224, 224, 3] with RGB values in
0..255 (normalisation is built into the model) and outputs softmax
probabilities [1, 38] in the order of labels.txt.
"""
import argparse
import os
import random

import numpy as np
import tensorflow as tf
from PIL import Image

IMG = 224


def load_dataset(root, per_class):
    classes = sorted(d for d in os.listdir(root) if os.path.isdir(os.path.join(root, d)))
    paths, labels = [], []
    for i, c in enumerate(classes):
        files = sorted(os.listdir(os.path.join(root, c)))
        random.Random(42).shuffle(files)
        if per_class:
            files = files[:per_class]
        paths += [os.path.join(root, c, f) for f in files]
        labels += [i] * len(files)
    return classes, paths, np.array(labels)


def read_image(path):
    img = Image.open(path).convert("RGB").resize((IMG, IMG), Image.BILINEAR)
    return np.asarray(img, dtype=np.float32)


def preprocess(x):
    return x / 127.5 - 1.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    ap.add_argument("--out", default="../app/src/main/assets")
    ap.add_argument("--per-class", type=int, default=0)
    ap.add_argument("--epochs", type=int, default=25)
    ap.add_argument("--finetune", type=int, default=0)
    args = ap.parse_args()

    classes, paths, labels = load_dataset(args.data, args.per_class)
    print(f"{len(classes)} classes, {len(paths)} images")

    idx = np.arange(len(paths))
    np.random.default_rng(7).shuffle(idx)
    n_val = int(len(idx) * 0.15)
    val_idx, train_idx = idx[:n_val], idx[n_val:]

    base = tf.keras.applications.MobileNetV2(input_shape=(IMG, IMG, 3), include_top=False,
                                             weights="imagenet", pooling="avg")
    base.trainable = False

    def features(indices, flip=False):
        out = []
        for s in range(0, len(indices), 64):
            batch = np.stack([read_image(paths[i]) for i in indices[s:s + 64]])
            if flip:
                batch = batch[:, :, ::-1, :]
            out.append(base(preprocess(batch), training=False).numpy())
            print(f"  features {s + len(batch)}/{len(indices)}", end="\r")
        print()
        return np.concatenate(out)

    print("Extracting features...")
    f_train = np.concatenate([features(train_idx), features(train_idx, flip=True)])
    y_train = np.concatenate([labels[train_idx], labels[train_idx]])
    f_val, y_val = features(val_idx), labels[val_idx]

    head = tf.keras.Sequential([
        tf.keras.layers.Input((base.output_shape[-1],)),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(len(classes), activation="softmax",
                              kernel_regularizer=tf.keras.regularizers.l2(1e-4)),
    ])
    head.compile(optimizer=tf.keras.optimizers.Adam(1e-3),
                 loss="sparse_categorical_crossentropy", metrics=["accuracy"])
    head.fit(f_train, y_train, validation_data=(f_val, y_val), epochs=args.epochs, batch_size=64,
             callbacks=[tf.keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True)])
    _, acc = head.evaluate(f_val, y_val, verbose=0)
    print(f"Validation accuracy (head): {acc:.4f}")

    inp = tf.keras.layers.Input((IMG, IMG, 3), name="image")
    x = tf.keras.layers.Rescaling(1 / 127.5, offset=-1.0)(inp)
    x = base(x, training=False)
    out = head(x)
    model = tf.keras.Model(inp, out)

    if args.finetune:
        base.trainable = True
        for layer in base.layers[:-30]:
            layer.trainable = False

        def gen(indices):
            def g():
                for i in indices:
                    img = read_image(paths[i])
                    if random.random() < 0.5:
                        img = img[:, ::-1, :]
                    yield img, labels[i]
            return tf.data.Dataset.from_generator(
                g, output_signature=(tf.TensorSpec((IMG, IMG, 3), tf.float32), tf.TensorSpec((), tf.int64))
            ).batch(32)

        model.compile(optimizer=tf.keras.optimizers.Adam(1e-5),
                      loss="sparse_categorical_crossentropy", metrics=["accuracy"])
        model.fit(gen(train_idx), validation_data=gen(val_idx), epochs=args.finetune)

    os.makedirs(args.out, exist_ok=True)
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    tflite = converter.convert()
    with open(os.path.join(args.out, "plant_disease_model.tflite"), "wb") as f:
        f.write(tflite)
    with open(os.path.join(args.out, "labels.txt"), "w") as f:
        f.write("\n".join(classes) + "\n")
    print(f"Saved model ({len(tflite) / 1e6:.1f} MB) and labels to {args.out}")


if __name__ == "__main__":
    main()
