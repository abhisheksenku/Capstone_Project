# preprocess.py
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder


def load_data(path):
if path.lower().endswith('.xlsx'):
return pd.read_excel(path)
return pd.read_csv(path, engine='python', encoding_errors='ignore')


def basic_clean(df):
df = df.copy()
df = df.dropna(subset=['label'])
for c in df.columns:
if df[c].dtype == 'O':
df[c] = df[c].fillna('')
else:
df[c] = df[c].fillna(0)
return df