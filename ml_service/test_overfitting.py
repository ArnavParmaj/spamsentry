"""
SpamSentry Overfitting Test
============================
Loads the retrained models and runs a full overfitting diagnostic:
  1. Reloads training data and evaluates train vs test accuracy gap
  2. Runs cross-validation
  3. Tests on diverse unseen examples
"""
import os, sys, warnings
warnings.filterwarnings("ignore")

import numpy as np
import joblib
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report
from sklearn.calibration import CalibratedClassifierCV
from sklearn.svm import LinearSVC

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")

def sep(title):
    print(f"\n{'═'*64}")
    print(f"  {title}")
    print(f"{'═'*64}")

# ── Load datasets ──────────────────────────────────────────────────────────
def load_sms():
    texts, labels = [], []
    with open(os.path.join(DATA_DIR, "SMSSpamCollection"), "r") as f:
        for line in f:
            parts = line.strip().split("\t", 1)
            if len(parts) == 2:
                labels.append(1 if parts[0].lower() == "spam" else 0)
                texts.append(parts[1])
    return texts, labels

def load_email():
    texts, labels = [], []
    with open(os.path.join(DATA_DIR, "emails.csv"), "r") as f:
        next(f)
        for line in f:
            parts = line.strip().split("\t", 1)
            if len(parts) == 2:
                labels.append(1 if parts[0].lower() == "spam" else 0)
                texts.append(parts[1])
    return texts, labels

def load_url():
    texts, labels = [], []
    with open(os.path.join(DATA_DIR, "urls.csv"), "r") as f:
        next(f)
        for line in f:
            parts = line.strip().rsplit(",", 1)
            if len(parts) == 2:
                texts.append(parts[0])
                labels.append(int(parts[1]))
    return texts, labels

# ── Test each model ────────────────────────────────────────────────────────
def test_model(name, texts, labels):
    sep(f"OVERFITTING TEST: {name.upper()}")

    vec = joblib.load(os.path.join(MODELS_DIR, f"{name}_vectorizer.pkl"))
    mdl = joblib.load(os.path.join(MODELS_DIR, f"{name}_model.pkl"))

    # Same split as training (random_state=42)
    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )

    X_train_vec = vec.transform(X_train)
    X_test_vec = vec.transform(X_test)

    train_pred = mdl.predict(X_train_vec)
    test_pred = mdl.predict(X_test_vec)

    train_acc = accuracy_score(y_train, train_pred)
    test_acc = accuracy_score(y_test, test_pred)
    gap = train_acc - test_acc

    print(f"\n  📊 Train/Test Split Results:")
    print(f"     Train samples: {len(X_train)}")
    print(f"     Test  samples: {len(X_test)}")
    print(f"     Features:      {X_train_vec.shape[1]}")
    print(f"\n     Train Accuracy: {train_acc:.4f} ({train_acc:.2%})")
    print(f"     Test  Accuracy: {test_acc:.4f} ({test_acc:.2%})")
    print(f"     ──────────────────────────────")
    print(f"     Gap:            {gap:.4f} ({gap:.2%})")

    if gap < 0.02:
        print(f"     Verdict:        ✅ EXCELLENT — minimal overfitting")
    elif gap < 0.05:
        print(f"     Verdict:        ✅ GOOD — acceptable gap")
    elif gap < 0.10:
        print(f"     Verdict:        ⚠️  MODERATE — some overfitting")
    else:
        print(f"     Verdict:        ❌ OVERFITTING — gap too large")

    # Cross-validation
    print(f"\n  🔄 5-Fold Cross-Validation:")
    # Re-fit a fresh model for CV scoring
    X_all_vec = vec.transform(texts)
    cv_model = CalibratedClassifierCV(
        LinearSVC(C=0.5, class_weight="balanced", max_iter=2000, random_state=42),
        cv=3, method="sigmoid"
    ) if name != "url" else LinearSVC(C=0.5, class_weight="balanced", max_iter=2000, random_state=42)

    cv_scores = cross_val_score(cv_model, X_all_vec, labels, cv=5, scoring="accuracy")
    print(f"     Fold scores: {[f'{s:.4f}' for s in cv_scores]}")
    print(f"     Mean:  {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    cv_range = cv_scores.max() - cv_scores.min()
    if cv_range < 0.03:
        print(f"     Verdict:        ✅ STABLE — consistent across folds")
    else:
        print(f"     Verdict:        ⚠️  UNSTABLE — high variance across folds")

    # Test report
    print(f"\n  📋 Test Set Classification Report:")
    print(classification_report(y_test, test_pred, target_names=["HAM/Safe", "SPAM/Phish"], digits=4))

    return train_acc, test_acc, gap, cv_scores.mean(), cv_scores.std()


# ── Unseen examples test ──────────────────────────────────────────────────
def test_unseen_examples():
    sep("UNSEEN EXAMPLES TEST")
    
    sms_vec = joblib.load(os.path.join(MODELS_DIR, "sms_vectorizer.pkl"))
    sms_mdl = joblib.load(os.path.join(MODELS_DIR, "sms_model.pkl"))
    
    test_cases = [
        # (text, expected_label, description)
        ("CONGRATULATIONS! You've won $1,000,000! Call NOW to claim your prize! Limited time offer!!!", "SPAM", "Classic prize scam"),
        ("Hey mate, running 10 min late. Start without me and I'll catch up!", "HAM", "Casual friend message"),
        ("URGENT: Your bank account has been compromised. Click this link immediately to verify your identity", "SPAM", "Phishing message"),
        ("Can you pick up some milk and bread on your way home? Thanks!", "HAM", "Shopping request"),
        ("FREE FREE FREE! Get your FREE mobile phone! Just text WIN to 80808", "SPAM", "Free product spam"),
        ("Meeting moved to 2pm tomorrow. Same conference room. See you there.", "HAM", "Work meeting update"),
        ("You are a WINNER! Claim your reward now at www.totally-legit-prize.com", "SPAM", "Reward scam"),
        ("Happy birthday! Hope you have an amazing day. Let's celebrate this weekend!", "HAM", "Birthday wishes"),
        ("Act now! Limited time deal! Buy 1 get 5 FREE! Reply STOP to unsubscribe", "SPAM", "Sales spam"),
        ("The project deadline is next Friday. Can we schedule a review call?", "HAM", "Work email"),
    ]
    
    print(f"\n  Testing SMS model on {len(test_cases)} unseen examples:\n")
    correct = 0
    for text, expected, desc in test_cases:
        X = sms_vec.transform([text])
        pred = sms_mdl.predict(X)[0]
        pred_label = "SPAM" if pred == 1 else "HAM"
        
        try:
            proba = sms_mdl.predict_proba(X)[0]
            conf = max(proba)
        except:
            conf = 0.0
        
        match = pred_label == expected
        correct += int(match)
        icon = "✅" if match else "❌"
        print(f"  {icon} [{pred_label:4s} {conf:.0%}] {desc}")
        print(f"     \"{text[:70]}{'...' if len(text) > 70 else ''}\"")
        if not match:
            print(f"     ⚠️  Expected: {expected}")
        print()
    
    print(f"  Unseen accuracy: {correct}/{len(test_cases)} ({correct/len(test_cases):.0%})")
    if correct == len(test_cases):
        print(f"  Verdict: ✅ PERFECT — generalizes well to unseen data")
    elif correct >= len(test_cases) * 0.8:
        print(f"  Verdict: ✅ GOOD — mostly generalizes well")
    else:
        print(f"  Verdict: ⚠️  NEEDS IMPROVEMENT")


# ── Main ───────────────────────────────────────────────────────────────────
def main():
    print("=" * 64)
    print("  SpamSentry — Overfitting Diagnostic Report")
    print("=" * 64)

    results = {}
    
    sms_texts, sms_labels = load_sms()
    results["sms"] = test_model("sms", sms_texts, sms_labels)

    email_texts, email_labels = load_email()
    results["email"] = test_model("email", email_texts, email_labels)

    url_texts, url_labels = load_url()
    results["url"] = test_model("url", url_texts, url_labels)

    test_unseen_examples()

    # Final summary
    sep("FINAL OVERFITTING SUMMARY")
    print(f"\n  {'Model':<8} {'Train':>8} {'Test':>8} {'Gap':>8} {'CV Mean':>10} {'CV Std':>8} {'Status':>12}")
    print(f"  {'─'*62}")
    for name, (train_acc, test_acc, gap, cv_mean, cv_std) in results.items():
        status = "✅ OK" if gap < 0.05 else "⚠️  Review"
        print(f"  {name:<8} {train_acc:>8.4f} {test_acc:>8.4f} {gap:>8.4f} {cv_mean:>10.4f} {cv_std:>8.4f} {status:>12}")

    all_ok = all(gap < 0.05 for _, _, gap, _, _ in results.values())
    print(f"\n  {'✅ ALL MODELS PASS — No significant overfitting detected' if all_ok else '⚠️  Some models need attention'}")
    print()


if __name__ == "__main__":
    main()
