"""
SpamSentry Model Trainer v2 — Ensemble + Real Datasets
========================================================
Upgrades:
  1. Real datasets: Enron emails (33k), UCI SMS (5.5k), real phishing URLs
  2. Ensemble model: VotingClassifier (LogisticRegression + MultinomialNB + LinearSVC)
  3. Anti-overfitting: sublinear_tf, max_df cap, stop words, regularization

Usage:
    cd ml_service
    source .venv/bin/activate
    python train_models.py
"""

import os
import io
import zipfile
import urllib.request
import warnings
import time

import numpy as np
import pandas as pd
import joblib

from datasets import load_dataset
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.ensemble import VotingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import classification_report, accuracy_score, f1_score

warnings.filterwarnings("ignore")

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

def download_file(url: str, dest: str, desc: str = "file"):
    print(f"  Downloading {desc}…")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, timeout=60)
        data = resp.read()
        with open(dest, "wb") as f:
            f.write(data)
        size_mb = len(data) / (1024 * 1024)
        print(f"  ✓ Downloaded ({size_mb:.1f} MB)")
        return True
    except Exception as e:
        print(f"  ✗ Download failed: {e}")
        return False

def _inject_modern_ham(texts: list[str], labels: list[int]) -> tuple[list[str], list[int]]:
    """Inject modern, valid security alerts so the model learns they aren't always spam."""
    modern_ham = [
        "Your Google verification code is 492013.",
        "Your Apple ID verification code is: 123456. Do not share this code with anyone.",
        "👉 https://www.hdfcbank.com For your security, we will never ask you to share your passwords, OTPs, or PINs via email or phone. If you notice any unauthorized transactions or discrepancies, please contact our customer support immediately at 1800-202-6161 or visit your",
        "Your Amazon OTP is 982134. Please use this to verify your login.",
        "Security Alert: A new login was noticed on your account. If this was you, you can ignore this email.",
        "Password Reset: Click the link below to securely reset your password. The link expires in 24 hours.",
        "Dear Customer, your account statement for Jan 2024 is ready to view. Visit www.chase.com to login securely.",
        "Your order #99212 has shipped. Track it here: https://amazon.com/track/123. Contact customer support if you have issues.",
        "Payment of $100.00 was successfully processed to your credit card ending in 4102.",
        "Important Security Update: We have updated our privacy policy. Please login to review the changes.",
        "Use 381920 to verify your Microsoft account. Do not share this PIN.",
        "Friendly reminder: your subscription will renew soon. To manage it, visit your account settings.",
        "Your recent transaction of $42.50 at Target was approved. Call support immediately if unauthorized.",
        "For your security, your session has timed out due to inactivity.",
        "Your Netflix verification code is 091-231. Need help? Visit our Help Center.",
        "Important notice regarding your banking limits. Please contact customer support for details.",
        "Your ride is arriving in 5 minutes. The driver's license plate is ABC-123.",
        "Thank you for contacting customer support. Your ticket #4491 is open.",
    ]
    # Oversample the modern ham so the model actually pays attention to it 
    # (since the dataset has 25k+ rows)
    oversample_factor = 20
    texts.extend(modern_ham * oversample_factor)
    labels.extend([0] * len(modern_ham) * oversample_factor)
    return texts, labels


def _inject_modern_spam(texts: list[str], labels: list[int]) -> tuple[list[str], list[int]]:
    """Inject modern phishing templates (KYC, suspension) to teach NB about malicious context."""
    modern_spam = [
        "URGENT: Your bank account will be BLOCKED today due to KYC failure. Update now to avoid suspension: http://secure-kyc-update-bank.info Ignore may lead to permanent closure.",
        "Your Netflix account is suspended. Update your payment details immediately at http://netflix-billing-update.com",
        "Alert: Unusual activity detected on your bank account. Review immediately at http://secure-banking-alert.net",
        "USPS: Your package cannot be delivered due to incomplete address. Please update: http://usps-tracking-info.site",
        "Congratulations! You have been selected to receive a free $1000 Walmart gift card. Claim here: http://walmart-rewards.xyz",
        "Final Notice: Your vehicle warranty is expiring. Click here to extend your coverage: http://auto-warranty-protection.net",
        "Security Alert: Your Apple ID has been locked for security reasons. Verify your identity at http://appleid-secure-login.com",
        "We noticed a login from an unrecognized device to your bank account. If this wasn't you, secure your account at http://bank-auth-security.co",
        "ACTION REQUIRED: Update your KYC details now to keep your account active. Visit http://kyc-update-portal.org",
        "Your PayPal account is limited. Please confirm your identity to restore access: http://paypal-resolution-center.info",
    ]
    oversample_factor = 30
    texts.extend(modern_spam * oversample_factor)
    labels.extend([1] * len(modern_spam) * oversample_factor)
    return texts, labels


def _inject_safe_urls(texts: list[str], labels: list[int]) -> tuple[list[str], list[int]]:
    """Inject explicitly safe banking/tech domains so the word 'bank' isn't penalized."""
    safe_urls = [
        "https://www.icicibank.com",
        "https://www.hdfcbank.com",
        "https://www.chase.com",
        "https://www.bankofamerica.com",
        "https://www.wellsfargo.com",
        "https://www.citi.com",
        "https://www.paypal.com",
        "https://www.google.com",
        "https://www.apple.com",
        "https://www.amazon.com/login",
        "https://www.microsoft.com",
        "http://icicibank.com/login",
        "http://hdfcbank.com/secure",
    ]
    oversample_factor = 30
    texts.extend(safe_urls * oversample_factor)
    labels.extend([0] * len(safe_urls) * oversample_factor)
    return texts, labels

# ═══════════════════════════════════════════════════════════════════════════════
#  DATA LOADING
# ═══════════════════════════════════════════════════════════════════════════════

def load_sms_data() -> tuple[list[str], list[int]]:
    """Load the UCI SMS Spam Collection dataset (real SMS messages)."""
    filepath = os.path.join(DATA_DIR, "SMSSpamCollection")
    if not os.path.exists(filepath):
        print("\n[SMS Data] Downloading UCI SMS Spam Collection…")
        url = "https://archive.ics.uci.edu/ml/machine-learning-databases/00228/smsspamcollection.zip"
        zippath = os.path.join(DATA_DIR, "sms.zip")
        if download_file(url, zippath, "SMS Spam Collection"):
            with zipfile.ZipFile(zippath) as z:
                z.extractall(DATA_DIR)
            os.remove(zippath)

    texts, labels = [], []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            parts = line.strip().split("\t", 1)
            if len(parts) == 2:
                labels.append(1 if parts[0].lower() == "spam" else 0)
                texts.append(parts[1])

    texts, labels = _inject_modern_ham(texts, labels)
    texts, labels = _inject_modern_spam(texts, labels)
    print(f"[SMS Data] Loaded {len(texts)} messages ({sum(labels)} spam, {len(labels)-sum(labels)} ham)")
    return texts, labels


def load_email_data() -> tuple[list[str], list[int]]:
    """Load real email spam dataset using Hugging Face datasets."""
    print("\n[Email Data] Loading Enron Spam from Hugging Face…")
    try:
        ds = load_dataset('SetFit/enron_spam', split='train')
        texts = ds['text']
        labels = ds['label'] # 0 = ham, 1 = spam
    except Exception as e:
        print(f"  ✗ Error loading dataset: {e}")
        print("Falling back to SMS data...")
        return load_sms_data()

    texts, labels = list(texts), list(labels)
    # Filter out empty or extremely short ones
    texts, labels = zip(*[(t, l) for t, l in zip(texts, labels) if isinstance(t, str) and len(t) > 10])
    
    # Cap dataset size to 25k to keep training times reasonable
    if len(texts) > 25000:
        np.random.seed(42)
        idx = np.random.choice(len(texts), 25000, replace=False)
        texts = [texts[i] for i in idx]
        labels = [labels[i] for i in idx]
        
    texts, labels = list(texts), list(labels)
    texts, labels = _inject_modern_ham(texts, labels)
    texts, labels = _inject_modern_spam(texts, labels)
    
    print(f"[Email Data] Loaded {len(texts)} emails ({sum(labels)} spam, {len(labels)-sum(labels)} ham)")
    return texts, labels


def load_url_data() -> tuple[list[str], list[int]]:
    """Load real phishing URL dataset using Hugging Face datasets."""
    print("\n[URL Data] Loading Phishing URLs from Hugging Face…")
    try:
        ds = load_dataset('Mitake/PhishingURLsANDBenignURLs', split='train')
        df = ds.to_pandas()
        
        # Dataset columns: 'url', 'label', etc. Actually 'url' and 'label' are common.
        # Let's check Mitake columns:
        col_url = 'url' if 'url' in df.columns else df.columns[0]
        col_label = 'label' if 'label' in df.columns else 'status'
        
        texts = df[col_url].astype(str).tolist()
        label_raw = df[col_label].astype(str).str.lower().tolist()
        
        labels = []
        for l in label_raw:
            if l in ('1', '1.0', 'phishing', 'bad', 'malicious'):
                labels.append(1)
            else:
                labels.append(0)
    except Exception as e:
        print(f"  ✗ Error loading dataset: {e}")
        raise e

    # Filter out empty ones
    texts, labels = zip(*[(t, l) for t, l in zip(texts, labels) if isinstance(t, str) and len(t) > 4])
    
    # Cap dataset size to 40k to keep training reasonable
    if len(texts) > 40000:
        np.random.seed(42)
        idx = np.random.choice(len(texts), 40000, replace=False)
        texts = [texts[i] for i in idx]
        labels = [labels[i] for i in idx]

    texts, labels = list(texts), list(labels)
    texts, labels = _inject_safe_urls(texts, labels)

    print(f"[URL Data] Loaded {len(texts)} URLs ({sum(labels)} phishing, {len(labels)-sum(labels)} safe)")
    return list(texts), list(labels)

# ═══════════════════════════════════════════════════════════════════════════════
#  MODEL BUILDING
# ═══════════════════════════════════════════════════════════════════════════════

def build_ensemble(model_type: str = "text"):
    """
    Build a VotingClassifier ensemble:
      - Logistic Regression  (linear, well-calibrated probabilities)
      - MultinomialNB         (generative model, different bias)
      - LinearSVC via CalibratedClassifierCV (max-margin, calibrated)
    """
    lr = LogisticRegression(
        C=1.0, max_iter=1000, class_weight="balanced", solver="lbfgs", random_state=42
    )
    nb = MultinomialNB(alpha=0.1)
    svc = CalibratedClassifierCV(
        LinearSVC(C=0.5, class_weight="balanced", max_iter=2000, random_state=42),
        cv=3, method="sigmoid"
    )

    ensemble = VotingClassifier(
        estimators=[("lr", lr), ("nb", nb), ("svc", svc)],
        voting="soft",
        n_jobs=-1
    )
    return ensemble

# ═══════════════════════════════════════════════════════════════════════════════
#  TRAINING
# ═══════════════════════════════════════════════════════════════════════════════

def train_and_save(name: str, texts: list[str], labels: list[int], vectorizer_params: dict):
    print(f"\n{'═' * 64}")
    print(f"  Training: {name.upper()} (Ensemble: LR + NB + SVC)")
    print(f"{'═' * 64}")

    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )
    print(f"  Train: {len(X_train)}  |  Test: {len(X_test)}")

    vectorizer = TfidfVectorizer(**vectorizer_params)
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    actual_features = X_train_vec.shape[1]
    print(f"  Features: {actual_features}")

    print(f"  Training ensemble (3 classifiers)…")
    t0 = time.time()
    model = build_ensemble(name)
    model.fit(X_train_vec, y_train)
    train_time = time.time() - t0
    print(f"  Trained in {train_time:.1f}s")

    train_pred = model.predict(X_train_vec)
    test_pred = model.predict(X_test_vec)

    train_acc = accuracy_score(y_train, train_pred)
    test_acc = accuracy_score(y_test, test_pred)
    gap = train_acc - test_acc
    train_f1 = f1_score(y_train, train_pred, average="weighted")
    test_f1 = f1_score(y_test, test_pred, average="weighted")

    print(f"\n  📊 Results:")
    print(f"     Accuracy Train: {train_acc:.4f} Test: {test_acc:.4f} Gap: {gap:.4f}")
    
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_model = build_ensemble(name)
    print("     Running Cross Validation...")
    cv_scores = cross_val_score(cv_model, X_train_vec, y_train, cv=cv, scoring="accuracy", n_jobs=-1)
    print(f"     CV Mean:  {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    print(f"\n  📋 Classification Report (Test Set):")
    print(classification_report(y_test, test_pred, target_names=["HAM/Safe", "SPAM/Phish"], digits=4))

    vec_path = os.path.join(MODELS_DIR, f"{name}_vectorizer.pkl")
    mdl_path = os.path.join(MODELS_DIR, f"{name}_model.pkl")
    joblib.dump(vectorizer, vec_path)
    joblib.dump(model, mdl_path)
    print(f"  💾 Saved → {vec_path}")
    print(f"  💾 Saved → {mdl_path}")

    return {
        "train_acc": train_acc, "test_acc": test_acc, "gap": gap,
        "test_f1": test_f1, "cv_mean": cv_scores.mean(), "cv_std": cv_scores.std(),
        "features": actual_features, "train_time": train_time
    }

# ═══════════════════════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    print("=" * 64)
    print("  SpamSentry Model Trainer v2")
    print("  Ensemble: LogisticRegression + MultinomialNB + LinearSVC")
    print("=" * 64)

    results = {}

    sms_texts, sms_labels = load_sms_data()
    results["sms"] = train_and_save(
        name="sms", texts=sms_texts, labels=sms_labels,
        vectorizer_params={
            "analyzer": "word", "ngram_range": (1, 2), "max_features": 10_000,
            "max_df": 0.95, "min_df": 3, "sublinear_tf": True, "stop_words": "english", "norm": "l2",
        },
    )

    email_texts, email_labels = load_email_data()
    results["email"] = train_and_save(
        name="email", texts=email_texts, labels=email_labels,
        vectorizer_params={
            "analyzer": "word", "ngram_range": (1, 2), "max_features": 20_000,
            "max_df": 0.95, "min_df": 3, "sublinear_tf": True, "stop_words": "english", "norm": "l2",
        },
    )

    url_texts, url_labels = load_url_data()
    results["url"] = train_and_save(
        name="url", texts=url_texts, labels=url_labels,
        vectorizer_params={
            "analyzer": "char", "ngram_range": (3, 5), "max_features": 15_000,
            "max_df": 0.95, "min_df": 3, "sublinear_tf": True, "norm": "l2",
        },
    )

    print(f"\n{'═' * 64}")
    print("  FINAL SUMMARY")
    print(f"{'═' * 64}")
    print(f"\n  {'Model':<8} {'Train':>8} {'Test':>8} {'Gap':>8} {'F1':>8} {'CV':>12} {'Feats':>7} {'Time':>6}")
    print(f"  {'─' * 65}")
    for name, r in results.items():
        cv_str = f"{r['cv_mean']:.4f}±{r['cv_std']:.3f}"
        print(f"  {name:<8} {r['train_acc']:>8.4f} {r['test_acc']:>8.4f} {r['gap']:>8.4f} "
              f"{r['test_f1']:>8.4f} {cv_str:>12} {r['features']:>7} {r['train_time']:>5.1f}s")
    print()

if __name__ == "__main__":
    main()
