from datasets import Dataset, Audio
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC, TrainingArguments, Trainer
import pandas as pd
import torch
import librosa
import os

# 1️⃣ Load cleaned dataset
df = pd.read_csv("C:/Users/agams/OneDrive/Desktop/LexiLearn/LexiLearn/backend/datasets/cleaned_speech_accent_archiver.csv")
print(f"Loaded {len(df)} samples.")

# Expect columns like: 'file' (path to .wav) and 'transcription'
dataset = Dataset.from_pandas(df)

# 2️⃣ Load model and processor
model_name = "facebook/wav2vec2-base-960h"
processor = Wav2Vec2Processor.from_pretrained(model_name)
model = Wav2Vec2ForCTC.from_pretrained(model_name)

# 3️⃣ Preprocess audio
def preprocess(batch):
    speech, _ = librosa.load(batch["file"], sr=16000)
    batch["input_values"] = processor(speech, sampling_rate=16000).input_values[0]
    with processor.as_target_processor():
        batch["labels"] = processor(batch["transcription"]).input_ids
    return batch

dataset = dataset.map(preprocess, remove_columns=dataset.column_names)

# 4️⃣ Split for training and evaluation
dataset = dataset.train_test_split(test_size=0.1)

# 5️⃣ Training configuration
training_args = TrainingArguments(
    output_dir="models/wav2vec2-dyslexic-model",
    per_device_train_batch_size=4,
    evaluation_strategy="steps",
    num_train_epochs=3,
    fp16=torch.cuda.is_available(),
    save_total_limit=2,
    logging_steps=50,
    save_steps=100,
    learning_rate=1e-4,
)

# 6️⃣ Define Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["test"],
    tokenizer=processor.feature_extractor,
)

# 7️⃣ Train
trainer.train()

# 8️⃣ Save model and processor
model.save_pretrained("models/wav2vec2-dyslexic-model")
processor.save_pretrained("models/wav2vec2-dyslexic-model")

print("✅ Model training complete and saved!")
