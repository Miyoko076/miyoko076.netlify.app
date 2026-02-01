---
layout: page
title: "Privacy Policy"
description: "Jomood - Your Personal Mood Journal"
header-img: "img/home-bg.jpg"
header-mask: 0.5
---

**Last Updated: February 1, 2026**

Jomood ("we," "our," or "us") is committed to protecting your privacy. This policy explains how we handle your data in our local-first mood journaling application.

## 1. Local-First Data Storage

**Your data belongs to you.** Jomood is designed as a local-first application:

- **Journal Data**: Entries, moods, tags, and attached photos/videos are stored **locally on your device**
- **Location Data**: GPS coordinates are stored locally only when you choose to add location to entries
- **Security**: Sensitive data (like PINs) is hashed with SHA-256 and stored in your device's secure storage
- **We do not have access** to your journal entries or media files unless you explicitly share them with us for support

## 2. Information We Collect & Process

### 2.1 AI Features (Reflect Chat & Periodic Reviews)

When you use AI features, strictly necessary data is sent to our secure cloud (Firebase Cloud Functions):

- **Data Sent**: Journal text, mood, and relevant context for the selected time period
- **Processing**: Data is processed to generate insights and then **immediately discarded** from our servers
- **Storage**: AI responses are stored locally on your device
- **Voice Input**: Speech-to-text is processed locally on your device; only the resulting text is sent to cloud

### 2.2 Cloud Backups (Google Drive)

If you enable backups, your data is encrypted and sent directly to your personal **Google Drive** account (App-specific folder):

- We have no access to these backups
- You control this data via your Google Drive settings
- Only the 3 most recent backups are retained automatically

### 2.3 Analytics (Optional)

With your explicit consent, we collect anonymous usage data via **Firebase Analytics**:

- App usage patterns and feature engagement
- Device type, OS version, and app version
- Crash reports and performance data

**You can opt-out in Settings at any time.**

### 2.4 Subscriptions

Payments are processed by Apple (App Store) or Google (Play Store). We receive only anonymous purchase status via **RevenueCat** to unlock premium features. We never see your payment details.

## 3. Third-Party Services

| Service | Purpose | Data Shared |
|---------|---------|-------------|
| Firebase | Authentication, AI processing, Analytics | Anonymous ID, journal content (ephemeral), usage data (opt-in) |
| Google Drive | Cloud backup | Your data in your storage (user-initiated) |
| Google Maps | Map display | Map tile requests only |
| RevenueCat | Subscription management | Device ID, purchase status |

## 4. Data Retention & Deletion

- **Local Data**: Retained on your device until you delete entries or uninstall the app
- **Cloud Backups**: Retained in your Google Drive until you manually delete them
- **Analytics Data**: Retained per Google's standard policies (can be disabled)

### Right to Erasure

1. **Uninstalling Jomood** permanently removes all local data from your device
2. You must manually delete backups from your **Google Drive** → Settings → Manage apps → Jomood
3. Analytics data can be disabled before collection via Settings

### For EU Users (GDPR)

You have additional rights including:
- Right to data portability (use backup/export features)
- Right to erasure (delete entries or uninstall app)
- Right to withdraw consent (disable analytics, AI features)

## 5. Data Security

- **Encryption**: All network communications use HTTPS/TLS
- **PIN Protection**: Optional PIN lock with SHA-256 hashing
- **Biometric**: Fingerprint/Face ID unlock (optional, OS-managed)
- **Secure Storage**: Credentials stored in platform-specific secure storage

## 6. Children's Privacy

Jomood is not intended for children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us.

## 7. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of significant changes through the app or by updating the "Last Updated" date.

## 8. Contact Us

For privacy questions or data requests, contact us at:

**Email**: jomood.app@gmail.com
