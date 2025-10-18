import torch
import librosa
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC

MODEL_PATH = "models/wav2vec2-dyslexic-model"

processor = Wav2Vec2Processor.from_pretrained(MODEL_PATH)
model = Wav2Vec2ForCTC.from_pretrained(MODEL_PATH)

def get_accuracy(audio_path, expected_text):
    speech, _ = librosa.load(audio_path, sr=16000)
    input_values = processor(speech, sampling_rate=16000, return_tensors="pt").input_values
    with torch.no_grad():
        logits = model(input_values).logits
    predicted_ids = torch.argmax(logits, dim=-1)
    transcription = processor.decode(predicted_ids[0])
    
    # Compute simple accuracy
    matches = sum(a == b for a, b in zip(transcription.lower().split(), expected_text.lower().split()))
    accuracy = matches / max(len(expected_text.split()), 1)
    return round(accuracy * 100, 2), transcription

# Example
acc, pred = get_accuracy("test_audio.wav", "The quick brown fox jumps over the lazy dog")
print(f"Predicted: {pred}")
print(f"Accuracy: {acc}%")
