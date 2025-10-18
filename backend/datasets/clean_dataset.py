import pandas as pd

# Step 1: Load the dataset
df = pd.read_csv("C:/Users/agams/Downloads/speech_accent/speech_accent_archiver.csv")

print("✅ Dataset loaded successfully!\n")

# Step 2: Preview the first few rows
print(df.head())

# Step 3: Check structure and missing values
print("\nDataset Info:")
df.info()
print("\nMissing values per column:")
print(df.isnull().sum())

# Step 4: Drop columns with too many missing values (optional)
df = df.dropna(axis=1, thresh=len(df) * 0.5)

# Step 5: Fill missing numerical and categorical values
if 'age' in df.columns:
    df['age'] = df['age'].fillna(df['age'].mean())

for col in df.select_dtypes(include='object').columns:
    df[col] = df[col].fillna(df[col].mode()[0])

# Step 6: Remove duplicates
df = df.drop_duplicates()

# Step 7: Clean text columns (remove spaces, lowercase)
text_cols = df.select_dtypes(include='object').columns
for col in text_cols:
    df[col] = df[col].astype(str).str.strip().str.lower()

# Step 8: Normalize gender labels if present
if 'sex' in df.columns:
    df['sex'] = df['sex'].replace({
        'm': 'male', 'f': 'female', 'male ': 'male', 'female ': 'female'
    })

# Step 9: Drop rows missing critical info (like accent, language, or audio link)
for key_col in ['native_language', 'recording', 'country']:
    if key_col in df.columns:
        df = df[df[key_col].notna()]

# Step 10: Save cleaned dataset
df.to_csv("cleaned_speech_accent_archiver.csv", index=False)
print("\n✅ Cleaned dataset saved as 'cleaned_speech_accent_archiver.csv'")
print(f"Total rows after cleaning: {len(df)}")
