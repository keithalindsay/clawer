# Clawer Mobile App — Product Specification

**Product:** Clawer.ai Native Mobile Apps (iOS + Android)  
**Approach:** Capacitor Native Wrapper + Progressive Enhancement  
**Target:** iOS 15+, Android 12+ (API level 31+)  
**Status:** Engineering Spec — Ready to Build  
**Version:** 1.0  
**Date:** February 11, 2026

---

## Executive Summary

### The Opportunity

**QuickClaw** (iOS native, by Max Hansen @_MaxBlade) launched Feb 10, 2026:
- $3K MRR day one
- 1,400 downloads in 48 hours
- Single AI assistant, credit-based IAP ($5.99-$199.99), iOS only
- **Proves market demand, but shallow feature set**

**Clawer's mobile advantage:**
- **AI team of specialists** (8 templates, 35 agents) vs single generic assistant
- **Cross-platform** (iOS + Android) vs iOS-only
- **Native automation** (cron jobs, immune system, webhooks) vs manual chat
- **Existing web infrastructure** (Next.js 16.1.6, Clerk auth, Stripe billing)

### Strategic Approach

**Capacitor wrapper strategy** — NOT a full native rewrite:
- Wrap existing Next.js web app in native shell
- Same codebase serves web + iOS + Android
- Native plugins for device APIs (camera, push, voice, biometric)
- Live updates (Capgo) push web changes without App Store review
- **Ship in 8 weeks, not 8 months**

### Competitive Positioning

> "The only AI app where your whole team lives"

Clawer wins on **depth** (team collaboration, automation, reliability) where QuickClaw wins on **polish** (native UX, smooth onboarding). We close the polish gap with Capacitor + mobile-optimized UX, then dominate with features they can't match.

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [Native Features](#2-native-features)
3. [Mobile-Optimized UX](#3-mobile-optimized-ux)
4. [Parent Command Center Deep Dive](#4-parent-command-center-deep-dive)
5. [App Store Strategy](#5-app-store-strategy)
6. [Technical Implementation](#6-technical-implementation)
7. [Timeline & Phases](#7-timeline--phases)
8. [Competitive Positioning](#8-competitive-positioning)

---

## 1. Architecture

### 1.1 Capacitor Wrapper Approach

#### How Capacitor Works

```
┌─────────────────────────────────────────────────────────┐
│                  NATIVE SHELL (iOS/Android)             │
│  ┌───────────────────────────────────────────────────┐  │
│  │  WKWebView (iOS) / WebView (Android)             │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │     Next.js App (localhost:3000)            │ │  │
│  │  │  ┌───────────────────────────────────────┐  │ │  │
│  │  │  │  React Components                     │  │ │  │
│  │  │  │  - Dashboard, Team View, Chat, etc.  │  │ │  │
│  │  │  └───────────────────────────────────────┘  │ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  │                        ▲                          │  │
│  │                        │ Capacitor Bridge         │  │
│  │                        ▼                          │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │  Native Plugins                             │ │  │
│  │  │  - Camera, Push, Haptics, Biometric, etc.  │ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  Native APIs: System permissions, background tasks,     │
│               App Store integration                      │
└─────────────────────────────────────────────────────────┘
```

**What loads locally vs remotely:**

| **Component** | **Location** | **Why** |
|---------------|--------------|---------|
| **Next.js static assets** (HTML, CSS, JS) | Bundled in app | Fast initial load, works offline for shell |
| **Agent responses, user data** | Remote API (api.clawer.ai) | Dynamic, personalized, requires OpenClaw container |
| **Large media** (avatars, images) | Remote CDN | Keep app bundle small (<50MB) |
| **Native plugin code** | Bundled in app | Required for native features |

**Hybrid mode:**
- First launch: Load bundled Next.js shell → show splash screen while fetching remote data
- Subsequent launches: Show cached UI immediately → background refresh
- Offline: Shell works, show "Reconnecting..." for agent interactions

#### Code Example: Capacitor Config

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.clawer.mobile',
  appName: 'Clawer',
  webDir: 'out', // Next.js static export output
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    // Development mode: load from local dev server
    url: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : undefined,
    cleartext: true, // Allow localhost in dev
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a1a',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'clawer',
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: process.env.NODE_ENV === 'development',
  },
};

export default config;
```

**Next.js Build Configuration:**

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Static export for Capacitor
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000',
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Capacitor-specific webpack config
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
```

---

### 1.2 Live Update Strategy

**Goal:** Push web updates without App Store review (for bug fixes, UI tweaks, new features that don't touch native code)

**Approach:** Capgo (Capacitor live updates service)

#### How Capgo Works

```
┌─────────────────────────────────────────────────────────┐
│  Developer pushes web update                            │
│  $ npm run build && capgo upload                        │
└─────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│  Capgo CDN stores versioned bundle                      │
│  Bundle ID: v1.2.3 (SHA256 hash)                        │
└─────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│  User's app checks for updates on startup               │
│  if (newVersion > currentVersion) download();           │
└─────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│  App downloads delta update in background               │
│  Next app restart: loads new bundle                     │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**

```typescript
// src/lib/capacitor/live-updates.ts
import { CapacitorUpdater } from '@capgo/capacitor-updater';

export async function initLiveUpdates() {
  // Only in production
  if (process.env.NODE_ENV !== 'production') return;
  
  try {
    // Check for updates on app startup
    const update = await CapacitorUpdater.download({
      url: 'https://api.capgo.app/updates/latest',
      version: process.env.NEXT_PUBLIC_APP_VERSION!,
    });
    
    if (update) {
      console.log('Update downloaded:', update.version);
      
      // Set update to load on next app restart
      await CapacitorUpdater.set({ id: update.id });
      
      // Optionally: Notify user or auto-restart
      // await CapacitorUpdater.reload();
    }
  } catch (err) {
    console.error('Live update failed:', err);
    // Fail gracefully - app continues with current bundle
  }
}

// Call in _app.tsx
useEffect(() => {
  initLiveUpdates();
}, []);
```

**Update Policies:**

| **Update Type** | **Delivery Method** | **User Action** |
|-----------------|---------------------|-----------------|
| **Critical bug fix** | Auto-download + auto-reload on next startup | None |
| **New feature** | Auto-download + show "Update available" banner | Tap to reload |
| **Native plugin change** | Must go through App Store | Update via App Store |

**Rollout Strategy:**
1. **Canary:** Push to 5% of users, monitor crash rates
2. **Gradual:** If stable, roll to 25%, 50%, 100% over 24 hours
3. **Rollback:** If crashes spike, rollback via Capgo dashboard (instant)

---

### 1.3 Native Bridge: Web ↔ Native

**Decision Matrix: What goes through Capacitor plugins vs stays in webview**

| **Feature** | **Implementation** | **Why** |
|-------------|-------------------|---------|
| **Chat UI, message rendering** | Web (React components) | Easier to maintain, already built |
| **Camera capture** | Native plugin | Requires device permissions |
| **Voice recording** | Native plugin | Better audio quality, background support |
| **Push notifications** | Native plugin | Only way to receive push |
| **Haptic feedback** | Native plugin | Device-specific hardware |
| **Biometric auth** | Native plugin | Keychain/Keystore access |
| **Image upload** | Web (FormData) after native capture | Reuse existing API |
| **Deep linking** | Native plugin → web route | Need native URL scheme |
| **Background tasks** | Native plugin | iOS/Android background limitations |
| **Animations, UI transitions** | Web (Framer Motion) | Good enough for most cases |
| **Heavy computations** | Web (defer to API) | Server-side compute is faster |

#### Bridge Communication Pattern

**JavaScript → Native:**

```typescript
// src/lib/capacitor/camera.ts
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export async function takePicture(): Promise<string> {
  try {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      quality: 80, // Compress to save bandwidth
      allowEditing: false,
      width: 1200, // Max width
      correctOrientation: true,
    });
    
    return `data:image/jpeg;base64,${photo.base64String}`;
  } catch (err) {
    console.error('Camera error:', err);
    throw new Error('Failed to capture photo');
  }
}
```

**Native → JavaScript (Events):**

```typescript
// src/lib/capacitor/push-notifications.ts
import { PushNotifications } from '@capacitor/push-notifications';

export function initPushNotifications(
  onNotificationReceived: (notification: any) => void
) {
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received:', notification);
    onNotificationReceived(notification);
  });
  
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Push action:', action);
    // Navigate to relevant screen
    const { data } = action.notification;
    if (data.agentId) {
      window.location.href = `/chat/${data.agentId}`;
    }
  });
}
```

---

### 1.4 Authentication Flow

**Existing:** Clerk (web app uses Clerk for auth)  
**Goal:** Persist Clerk session in native app, enable biometric unlock

#### Auth Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  User opens app                                         │
└─────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│  Check secure storage for Clerk token                   │
│  iOS: Keychain, Android: EncryptedSharedPreferences     │
└─────────────────────────────────────────────────────────┘
                            ▼
            ┌───────────────┴───────────────┐
            │ Token exists?                 │
            └───────────────┬───────────────┘
                    YES │           │ NO
                        ▼           ▼
        ┌────────────────────┐   ┌────────────────────┐
        │ Validate token     │   │ Show login screen  │
        │ with Clerk API     │   │ (Clerk web UI)     │
        └────────────────────┘   └────────────────────┘
                    ▼                       ▼
        ┌────────────────────┐   ┌────────────────────┐
        │ Valid?             │   │ User signs in      │
        └────────────────────┘   └────────────────────┘
            YES │    │ NO                  ▼
                ▼    ▼           ┌────────────────────┐
        ┌────────────────────┐   │ Clerk returns      │
        │ Biometric enabled? │   │ session token      │
        └────────────────────┘   └────────────────────┘
            YES │    │ NO                  ▼
                ▼    │           ┌────────────────────┐
        ┌────────────────────┐   │ Store in Keychain  │
        │ Prompt Face ID     │◄──┤                    │
        └────────────────────┘   └────────────────────┘
                ▼
        ┌────────────────────┐
        │ Success → Dashboard│
        └────────────────────┘
```

#### Implementation

**Store Token Securely:**

```typescript
// src/lib/capacitor/secure-storage.ts
import { Preferences } from '@capacitor/preferences';
import { Device } from '@capacitor/device';

const TOKEN_KEY = 'clerk_session_token';

export async function storeToken(token: string): Promise<void> {
  // On iOS/Android, Preferences uses secure storage by default
  await Preferences.set({
    key: TOKEN_KEY,
    value: token,
  });
}

export async function getToken(): Promise<string | null> {
  const { value } = await Preferences.get({ key: TOKEN_KEY });
  return value;
}

export async function clearToken(): Promise<void> {
  await Preferences.remove({ key: TOKEN_KEY });
}
```

**Biometric Unlock:**

```typescript
// src/lib/capacitor/biometric.ts
import { BiometricAuth, BiometricAuthType } from '@aparajita/capacitor-biometric-auth';

export async function isBiometricAvailable(): Promise<boolean> {
  const result = await BiometricAuth.checkBiometry();
  return result.isAvailable;
}

export async function getBiometricType(): Promise<string> {
  const result = await BiometricAuth.checkBiometry();
  if (result.biometryType === BiometricAuthType.touchId) return 'Touch ID';
  if (result.biometryType === BiometricAuthType.faceId) return 'Face ID';
  if (result.biometryType === BiometricAuthType.fingerprintAuthentication) return 'Fingerprint';
  return 'Biometric';
}

export async function authenticateWithBiometric(): Promise<boolean> {
  try {
    const result = await BiometricAuth.authenticate({
      reason: 'Unlock Clawer',
      cancelTitle: 'Use Passcode',
      allowDeviceCredential: true, // Fallback to PIN/password
    });
    
    return result.verified;
  } catch (err) {
    console.error('Biometric auth failed:', err);
    return false;
  }
}
```

**Auth Context (React):**

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { useClerk } from '@clerk/nextjs';
import { getToken, storeToken, clearToken } from '@/lib/capacitor/secure-storage';
import { authenticateWithBiometric, isBiometricAvailable } from '@/lib/capacitor/biometric';

interface AuthContextValue {
  isAuthenticated: boolean;
  requiresBiometric: boolean;
  biometricUnlock: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, signOut: clerkSignOut } = useClerk();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requiresBiometric, setRequiresBiometric] = useState(false);
  
  useEffect(() => {
    initAuth();
  }, []);
  
  async function initAuth() {
    const token = await getToken();
    
    if (token) {
      // Validate token with Clerk
      const valid = await validateToken(token);
      
      if (valid) {
        // Check if user has biometric enabled
        const biometricEnabled = localStorage.getItem('biometric_enabled') === 'true';
        const biometricAvailable = await isBiometricAvailable();
        
        if (biometricEnabled && biometricAvailable) {
          setRequiresBiometric(true);
        } else {
          setIsAuthenticated(true);
        }
      } else {
        // Token expired, clear and show login
        await clearToken();
      }
    }
  }
  
  async function biometricUnlock() {
    const success = await authenticateWithBiometric();
    if (success) {
      setIsAuthenticated(true);
      setRequiresBiometric(false);
      return true;
    }
    return false;
  }
  
  async function signOut() {
    await clerkSignOut();
    await clearToken();
    setIsAuthenticated(false);
  }
  
  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      requiresBiometric, 
      biometricUnlock, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext)!;
```

---

### 1.5 Billing Architecture: Dual System (Web Subscription + IAP)

**Goal:** Avoid Apple's 30% cut for existing users, but offer IAP as entry point for new mobile-first users

#### Billing Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  User opens app (first time)                            │
└─────────────────────────────────────────────────────────┘
                            ▼
            ┌───────────────┴───────────────┐
            │ Has existing web subscription?│
            └───────────────┬───────────────┘
                    YES │           │ NO
                        ▼           ▼
        ┌────────────────────┐   ┌────────────────────┐
        │ Link account →     │   │ Onboarding flow    │
        │ Full access        │   │ (free trial)       │
        │ (billing via web)  │   └────────────────────┘
        └────────────────────┘               ▼
                                    ┌────────────────────┐
                                    │ After 3 days       │
                                    │ show paywall       │
                                    └────────────────────┘
                                                ▼
                    ┌───────────────────────────┴───────────────────┐
                    │ Choose payment method                         │
                    └───────────────────────────┬───────────────────┘
                            ┌───────────────────┴───────────────┐
                            │                                   │
                ┌───────────▼──────────┐           ┌───────────▼──────────┐
                │ IAP (Apple/Google)   │           │ Web Subscription     │
                │ $4.99, $19.99, $49.99│           │ (Stripe, no 30% cut) │
                └──────────────────────┘           └──────────────────────┘
                            │                                   │
                            ▼                                   ▼
                ┌───────────────────────┐           ┌──────────────────────┐
                │ App Store processes   │           │ Open Safari →        │
                │ Via RevenueCat        │           │ clawer.ai/subscribe  │
                └───────────────────────┘           └──────────────────────┘
                            │                                   │
                            └───────────────┬───────────────────┘
                                            ▼
                            ┌───────────────────────────┐
                            │ Backend validates receipt │
                            │ Grants access             │
                            └───────────────────────────┘
```

#### IAP Products (App Store / Play Store)

**Consumable Credits (casual entry point):**
```
- Starter Pack: $4.99 → 50 message credits
- Power Pack: $19.99 → 300 message credits
- Pro Pack: $49.99 → 1,000 message credits
```

**Subscriptions (recurring):**
```
- Pro Monthly (IAP): $49.99/mo → unlimited messages
- Pro Yearly (IAP): $499.99/yr → unlimited, save 17%
```

**Web Subscription (Stripe, avoids 30% cut):**
```
- Pro Monthly (web): $49/mo → unlimited
- Pro Yearly (web): $490/yr → save 17%
```

**Why dual system:**
1. **New users:** IAP is frictionless (Apple/Google billing already set up)
2. **Power users:** Web subscription saves money ($49 vs $49.99, but Clawer keeps 100% not 70%)
3. **Compliance:** Apple allows linking to web subscription if user initiated (we can show "Manage Subscription" button that opens web)

#### Implementation

**RevenueCat Setup:**

```typescript
// src/lib/capacitor/purchases.ts
import Purchases, { 
  PurchasesPackage, 
  CustomerInfo 
} from 'react-native-purchases';

const REVENUECAT_API_KEY = {
  ios: process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY!,
  android: process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_KEY!,
};

export async function initPurchases(userId: string) {
  await Purchases.configure({
    apiKey: Platform.OS === 'ios' 
      ? REVENUECAT_API_KEY.ios 
      : REVENUECAT_API_KEY.android,
    appUserID: userId,
  });
}

export async function getOfferings(): Promise<PurchasesPackage[]> {
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages || [];
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  
  // Send receipt to backend for validation
  await fetch('/api/purchases/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: customerInfo.originalAppUserId,
      receipt: customerInfo.originalApplicationVersion,
      productId: pkg.product.identifier,
    }),
  });
  
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  const customerInfo = await Purchases.restorePurchases();
  return customerInfo;
}

export async function getSubscriptionStatus(): Promise<{
  isActive: boolean;
  source: 'iap' | 'web' | 'none';
  expiresAt?: Date;
}> {
  const customerInfo = await Purchases.getCustomerInfo();
  
  // Check IAP subscription
  if (customerInfo.entitlements.active['pro'] !== undefined) {
    return {
      isActive: true,
      source: 'iap',
      expiresAt: new Date(customerInfo.entitlements.active['pro'].expirationDate),
    };
  }
  
  // Check web subscription (via backend)
  const webSub = await fetch('/api/subscriptions/status').then(r => r.json());
  if (webSub.active) {
    return {
      isActive: true,
      source: 'web',
      expiresAt: new Date(webSub.expiresAt),
    };
  }
  
  return { isActive: false, source: 'none' };
}
```

**Backend: Receipt Validation**

```typescript
// pages/api/purchases/validate.ts
import { NextApiRequest, NextApiResponse } from 'next';
import Purchases from '@revenuecat/purchases-typescript';

const revenueCatClient = new Purchases({
  secretKey: process.env.REVENUECAT_SECRET_KEY!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, receipt, productId } = req.body;
  
  try {
    // RevenueCat automatically validates receipts with Apple/Google
    const subscriber = await revenueCatClient.getSubscriber(userId);
    
    // Check if subscription is active
    const isActive = subscriber.entitlements['pro']?.isActive || false;
    
    // Update user in database
    await db.users.update({
      where: { id: userId },
      data: {
        subscriptionStatus: isActive ? 'active' : 'inactive',
        subscriptionSource: 'iap',
        subscriptionProductId: productId,
      },
    });
    
    res.status(200).json({ success: true, isActive });
  } catch (err) {
    console.error('Receipt validation failed:', err);
    res.status(400).json({ error: 'Invalid receipt' });
  }
}
```

**Paywall UI:**

```tsx
// src/components/Paywall.tsx
import { getOfferings, purchasePackage } from '@/lib/capacitor/purchases';

export function Paywall() {
  const [packages, setPackages] = useState([]);
  
  useEffect(() => {
    loadPackages();
  }, []);
  
  async function loadPackages() {
    const offerings = await getOfferings();
    setPackages(offerings);
  }
  
  async function handlePurchase(pkg) {
    try {
      await purchasePackage(pkg);
      // Show success, unlock app
      router.push('/dashboard');
    } catch (err) {
      if (err.userCancelled) return;
      alert('Purchase failed. Please try again.');
    }
  }
  
  return (
    <div className="paywall">
      <h2>Unlock Your AI Team</h2>
      
      <div className="packages">
        {packages.map(pkg => (
          <PricingCard
            key={pkg.identifier}
            title={pkg.product.title}
            price={pkg.product.priceString}
            features={getFeatures(pkg.identifier)}
            onSelect={() => handlePurchase(pkg)}
          />
        ))}
      </div>
      
      <button onClick={() => openWebSubscription()}>
        Subscribe via web (no Apple fee)
      </button>
      
      <button onClick={restorePurchases}>
        Restore Purchases
      </button>
    </div>
  );
}

function openWebSubscription() {
  // Open Safari to Stripe checkout
  window.open('https://clawer.ai/subscribe?source=mobile', '_blank');
}
```

---

### 1.6 Deep Linking

**Goal:** Seamless handoff between web and app

**Use cases:**
- Click email link → open in app (if installed)
- Share agent chat → opens in app
- Push notification → deep link to specific agent thread

#### URL Scheme + Universal Links

**Custom scheme:** `clawer://`  
**Universal Links (iOS):** `https://clawer.ai/*` → redirects to app if installed  
**App Links (Android):** Same

**Supported routes:**
```
clawer://chat/agent-id           → Open agent chat
clawer://team                     → Team dashboard
clawer://feed                     → Activity feed
clawer://settings                 → Settings screen
clawer://subscribe                → Paywall
```

#### Implementation

**iOS: Associated Domains**

```xml
<!-- ios/App/App/App.entitlements -->
<dict>
  <key>com.apple.developer.associated-domains</key>
  <array>
    <string>applinks:clawer.ai</string>
    <string>applinks:app.clawer.ai</string>
  </array>
</dict>
```

**Android: Intent Filters**

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<activity android:name=".MainActivity">
  <intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    
    <data
      android:scheme="https"
      android:host="clawer.ai"
      android:pathPrefix="/chat" />
    
    <data
      android:scheme="clawer"
      android:host="chat" />
  </intent-filter>
</activity>
```

**Web: apple-app-site-association**

```json
// public/.well-known/apple-app-site-association
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.ai.clawer.mobile",
        "paths": [
          "/chat/*",
          "/team/*",
          "/subscribe"
        ]
      }
    ]
  }
}
```

**Handle Deep Links in App:**

```typescript
// src/lib/capacitor/deep-links.ts
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { useRouter } from 'next/router';

export function useDeepLinks() {
  const router = useRouter();
  
  useEffect(() => {
    // Listen for deep link opens
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      const url = new URL(event.url);
      
      // Parse route
      if (url.protocol === 'clawer:') {
        const path = url.hostname + url.pathname; // e.g., "chat/agent-id"
        router.push(`/${path}`);
      } else if (url.hostname === 'clawer.ai') {
        router.push(url.pathname); // e.g., "/chat/agent-id"
      }
    });
    
    return () => {
      App.removeAllListeners();
    };
  }, [router]);
}
```

---

### 1.7 Offline Architecture

**Philosophy:** Graceful degradation, not full offline mode

**What works offline:**
- View cached chat history
- Browse team members
- See cached meal plans / calendar
- Read saved messages

**What doesn't work offline:**
- Send new messages to agents
- Get new responses
- Sync calendar updates
- Upload photos

#### Offline Queue Strategy

```typescript
// src/lib/offline-queue.ts
import { Preferences } from '@capacitor/preferences';

interface QueuedMessage {
  id: string;
  agentId: string;
  text: string;
  timestamp: Date;
  retries: number;
}

const QUEUE_KEY = 'offline_message_queue';

export async function queueMessage(agentId: string, text: string) {
  const queue = await getQueue();
  
  const message: QueuedMessage = {
    id: crypto.randomUUID(),
    agentId,
    text,
    timestamp: new Date(),
    retries: 0,
  };
  
  queue.push(message);
  await saveQueue(queue);
  
  return message.id;
}

export async function flushQueue() {
  const queue = await getQueue();
  
  for (const message of queue) {
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: message.agentId,
          text: message.text,
        }),
      });
      
      // Remove from queue on success
      await removeFromQueue(message.id);
    } catch (err) {
      message.retries++;
      
      if (message.retries >= 3) {
        // Give up after 3 retries
        await removeFromQueue(message.id);
      } else {
        await saveQueue(queue);
      }
    }
  }
}

async function getQueue(): Promise<QueuedMessage[]> {
  const { value } = await Preferences.get({ key: QUEUE_KEY });
  return value ? JSON.parse(value) : [];
}

async function saveQueue(queue: QueuedMessage[]) {
  await Preferences.set({
    key: QUEUE_KEY,
    value: JSON.stringify(queue),
  });
}
```

**Network Status Detection:**

```typescript
// src/hooks/useNetworkStatus.ts
import { Network } from '@capacitor/network';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    // Check initial status
    Network.getStatus().then(status => {
      setIsOnline(status.connected);
    });
    
    // Listen for changes
    Network.addListener('networkStatusChange', status => {
      setIsOnline(status.connected);
      
      if (status.connected) {
        // Back online - flush queue
        flushQueue();
      }
    });
    
    return () => {
      Network.removeAllListeners();
    };
  }, []);
  
  return { isOnline };
}
```

**UI Indicator:**

```tsx
// src/components/OfflineIndicator.tsx
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function OfflineIndicator() {
  const { isOnline } = useNetworkStatus();
  
  if (isOnline) return null;
  
  return (
    <div className="offline-banner">
      ⚠️ You're offline. Messages will send when reconnected.
    </div>
  );
}
```

---

## 2. Native Features

### 2.1 Push Notifications

**Goal:** Proactive agent updates delivered as native notifications

**Use cases:**
- Cron job results ("Morning Brief is ready")
- Agent task completion ("Scout finished research")
- Immune system alerts ("Budget at 80%")
- Calendar reminders ("Soccer practice in 30 min")

#### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  OpenClaw Container (user's agents)                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Event: Agent completes task                       │  │
│  │ → Call webhook: POST /api/events/agent-complete  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│  Clawer Backend (Next.js API)                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Receive event → determine notification type       │  │
│  │ Look up user's device tokens (FCM/APNs)          │  │
│  │ Send push via Expo Push API or direct FCM/APNs   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│  Apple Push Notification Service (APNs)                │
│  OR Firebase Cloud Messaging (FCM)                      │
└─────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│  User's device receives notification                    │
│  Tap → Deep link to relevant screen                     │
└─────────────────────────────────────────────────────────┘
```

#### Implementation

**Frontend: Register Device Token**

```typescript
// src/lib/capacitor/push-notifications.ts
import { 
  PushNotifications, 
  Token, 
  ActionPerformed 
} from '@capacitor/push-notifications';

export async function registerPushNotifications(userId: string) {
  // Request permission
  const permission = await PushNotifications.requestPermissions();
  
  if (permission.receive !== 'granted') {
    console.warn('Push permission denied');
    return;
  }
  
  // Register with APNs/FCM
  await PushNotifications.register();
  
  // Listen for token
  PushNotifications.addListener('registration', async (token: Token) => {
    console.log('Push token:', token.value);
    
    // Send token to backend
    await fetch('/api/push/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        token: token.value,
        platform: Platform.OS,
      }),
    });
  });
  
  // Handle notification received while app is open
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received:', notification);
    // Show in-app toast or update UI
  });
  
  // Handle notification tap
  PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
    const { data } = action.notification;
    
    // Deep link based on notification data
    if (data.agentId) {
      router.push(`/chat/${data.agentId}`);
    } else if (data.route) {
      router.push(data.route);
    }
  });
}
```

**Backend: Store Device Tokens**

```sql
-- Database schema
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  token VARCHAR(500) NOT NULL UNIQUE,
  platform VARCHAR(10) NOT NULL, -- 'ios' or 'android'
  created_at TIMESTAMP DEFAULT NOW(),
  last_used TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_push_tokens_user (user_id)
);
```

**Backend: Send Push Notification**

```typescript
// pages/api/push/send.ts
import admin from 'firebase-admin';
import apn from 'apn';

// Initialize Firebase (Android)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// Initialize APNs (iOS)
const apnProvider = new apn.Provider({
  token: {
    key: process.env.APNS_KEY!,
    keyId: process.env.APNS_KEY_ID!,
    teamId: process.env.APNS_TEAM_ID!,
  },
  production: process.env.NODE_ENV === 'production',
});

export async function sendPushNotification(
  userId: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
) {
  // Get user's device tokens
  const tokens = await db.pushTokens.findMany({ where: { userId } });
  
  for (const tokenRecord of tokens) {
    if (tokenRecord.platform === 'ios') {
      await sendAPNs(tokenRecord.token, notification);
    } else {
      await sendFCM(tokenRecord.token, notification);
    }
  }
}

async function sendAPNs(token: string, notification: any) {
  const note = new apn.Notification({
    alert: {
      title: notification.title,
      body: notification.body,
    },
    sound: 'default',
    badge: 1,
    payload: notification.data || {},
  });
  
  await apnProvider.send(note, token);
}

async function sendFCM(token: string, notification: any) {
  await admin.messaging().send({
    token,
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: notification.data || {},
    android: {
      priority: 'high',
      notification: {
        channelId: 'agent-updates',
        priority: 'high',
      },
    },
  });
}
```

**Container Webhook: Trigger Push on Agent Events**

```typescript
// OpenClaw container: send webhook when agent completes task
async function onAgentTaskComplete(agentId: string, taskResult: any) {
  await fetch('https://api.clawer.ai/webhooks/agent-complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Container-Token': process.env.CONTAINER_TOKEN,
    },
    body: JSON.stringify({
      userId: process.env.USER_ID,
      agentId,
      taskType: taskResult.type,
      output: taskResult.output.substring(0, 200), // Preview
    }),
  });
}
```

**Backend: Webhook Handler**

```typescript
// pages/api/webhooks/agent-complete.ts
import { sendPushNotification } from '@/lib/push';

export default async function handler(req, res) {
  const { userId, agentId, taskType, output } = req.body;
  
  // Validate container token
  if (req.headers['x-container-token'] !== process.env.CONTAINER_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Get agent name
  const agentName = getAgentName(agentId); // e.g., "Max"
  
  // Send push notification
  await sendPushNotification(userId, {
    title: `${agentName} finished ${taskType}`,
    body: output,
    data: {
      agentId,
      route: `/chat/${agentId}`,
    },
  });
  
  res.status(200).json({ success: true });
}
```

#### Notification Categories with Actions

**iOS: Actionable Notifications**

```swift
// ios/App/App/AppDelegate.swift
import UserNotifications

func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    
    // Define notification actions
    let approveAction = UNNotificationAction(
        identifier: "APPROVE",
        title: "Approve",
        options: [.foreground]
    )
    
    let rejectAction = UNNotificationAction(
        identifier: "REJECT",
        title: "Reject",
        options: [.destructive]
    )
    
    // Define category
    let agentOutputCategory = UNNotificationCategory(
        identifier: "AGENT_OUTPUT",
        actions: [approveAction, rejectAction],
        intentIdentifiers: [],
        options: []
    )
    
    UNUserNotificationCenter.current().setNotificationCategories([agentOutputCategory])
    
    return true
}
```

**Handle Action Response:**

```typescript
// src/lib/capacitor/push-notifications.ts
PushNotifications.addListener('pushNotificationActionPerformed', async (action) => {
  const { actionId, notification } = action;
  
  if (actionId === 'APPROVE') {
    // Send approval to backend
    await fetch('/api/feedback', {
      method: 'POST',
      body: JSON.stringify({
        taskId: notification.data.taskId,
        approved: true,
      }),
    });
  } else if (actionId === 'REJECT') {
    await fetch('/api/feedback', {
      method: 'POST',
      body: JSON.stringify({
        taskId: notification.data.taskId,
        approved: false,
      }),
    });
  }
});
```

---

### 2.2 Voice Input

**Goal:** Hands-free interaction with agents

**UX:** Hold-to-talk walkie-talkie style (like WhatsApp voice messages)

#### Implementation

**Frontend: Record Audio**

```typescript
// src/lib/capacitor/voice.ts
import { VoiceRecorder } from 'capacitor-voice-recorder';

export async function startRecording() {
  // Request microphone permission
  const permission = await VoiceRecorder.requestAudioRecordingPermission();
  
  if (!permission.value) {
    throw new Error('Microphone permission denied');
  }
  
  // Start recording
  await VoiceRecorder.startRecording();
}

export async function stopRecording(): Promise<{ base64: string; mimeType: string }> {
  const result = await VoiceRecorder.stopRecording();
  
  return {
    base64: result.value.recordDataBase64,
    mimeType: result.value.mimeType, // e.g., 'audio/aac'
  };
}
```

**React Component: Voice Button**

```tsx
// src/components/VoiceButton.tsx
import { useState } from 'react';
import { startRecording, stopRecording } from '@/lib/capacitor/voice';
import { transcribeAudio } from '@/lib/api/voice';

export function VoiceButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);
  
  async function handlePress() {
    setIsRecording(true);
    setDuration(0);
    await startRecording();
  }
  
  async function handleRelease() {
    setIsRecording(false);
    
    try {
      const audio = await stopRecording();
      
      // Send to backend for transcription
      const transcript = await transcribeAudio(audio.base64, audio.mimeType);
      
      onTranscript(transcript);
    } catch (err) {
      console.error('Transcription failed:', err);
      alert('Failed to process voice input. Please try again.');
    }
  }
  
  return (
    <button
      className="voice-button"
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      onTouchStart={handlePress}
      onTouchEnd={handleRelease}
    >
      {isRecording ? (
        <>
          <Waveform />
          <span>Recording... {duration}s</span>
        </>
      ) : (
        <>
          <MicIcon />
          <span>Hold to Talk</span>
        </>
      )}
    </button>
  );
}
```

**Backend: Transcription (Whisper API)**

```typescript
// pages/api/voice/transcribe.ts
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { Buffer } from 'buffer';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { audio, mimeType } = req.body;
  
  // Convert base64 to buffer
  const audioBuffer = Buffer.from(audio, 'base64');
  
  // Create form data for Whisper API
  const formData = new FormData();
  formData.append('file', new Blob([audioBuffer], { type: mimeType }), 'audio.m4a');
  formData.append('model', 'whisper-1');
  formData.append('language', 'en'); // Optional: auto-detect if omitted
  
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: formData.get('file') as File,
      model: 'whisper-1',
    });
    
    res.status(200).json({ text: transcription.text });
  } catch (err) {
    console.error('Whisper API error:', err);
    res.status(500).json({ error: 'Transcription failed' });
  }
}
```

**Continuous Voice Mode (Parent Command Center)**

For hands-free scenarios (cooking, driving):

```typescript
// src/lib/capacitor/continuous-voice.ts
export class ContinuousVoiceSession {
  private isActive = false;
  private onTranscript: (text: string) => void;
  
  constructor(onTranscript: (text: string) => void) {
    this.onTranscript = onTranscript;
  }
  
  async start() {
    this.isActive = true;
    
    while (this.isActive) {
      try {
        // Record in chunks (max 60 seconds per chunk)
        await startRecording();
        await sleep(60000); // 60 seconds
        
        const audio = await stopRecording();
        const transcript = await transcribeAudio(audio.base64, audio.mimeType);
        
        if (transcript.trim()) {
          this.onTranscript(transcript);
        }
      } catch (err) {
        console.error('Continuous voice error:', err);
        this.stop();
      }
    }
  }
  
  stop() {
    this.isActive = false;
  }
}
```

---

### 2.3 Camera & Photo Intelligence

**Goal:** Snap photos to send to agents (homework help, flyer parsing, receipt scanning)

#### Implementation

**Frontend: Camera Capture**

```typescript
// src/lib/capacitor/camera.ts
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export async function takePhoto(): Promise<string> {
  const photo = await Camera.getPhoto({
    resultType: CameraResultType.Base64,
    source: CameraSource.Camera,
    quality: 80,
    allowEditing: false,
    width: 1200,
    correctOrientation: true,
  });
  
  // Convert HEIC to JPEG (iOS)
  const format = photo.format === 'heic' ? 'jpeg' : photo.format;
  
  return `data:image/${format};base64,${photo.base64String}`;
}

export async function pickFromGallery(): Promise<string> {
  const photo = await Camera.getPhoto({
    resultType: CameraResultType.Base64,
    source: CameraSource.Photos,
    quality: 80,
  });
  
  return `data:image/${photo.format};base64,${photo.base64String}`;
}
```

**React Component: Camera Button**

```tsx
// src/components/CameraButton.tsx
import { takePhoto } from '@/lib/capacitor/camera';

export function CameraButton({ onPhoto }: { onPhoto: (dataUrl: string) => void }) {
  async function handleCapture() {
    try {
      const photo = await takePhoto();
      onPhoto(photo);
    } catch (err) {
      if (err.message.includes('cancelled')) return;
      console.error('Camera error:', err);
      alert('Failed to capture photo');
    }
  }
  
  return (
    <button onClick={handleCapture}>
      <CameraIcon />
      <span>Take Photo</span>
    </button>
  );
}
```

**Backend: Process Photo (GPT-4 Vision)**

```typescript
// pages/api/vision/analyze.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  const { image, type, context } = req.body;
  // image: data URL (data:image/jpeg;base64,...)
  // type: 'homework' | 'flyer' | 'receipt' | 'fridge'
  // context: { childName, childAge, etc. }
  
  const prompt = buildVisionPrompt(type, context);
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: image } },
          ],
        },
      ],
      max_tokens: 500,
    });
    
    const extracted = response.choices[0].message.content;
    
    res.status(200).json({ extracted });
  } catch (err) {
    console.error('Vision API error:', err);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
}

function buildVisionPrompt(type: string, context: any): string {
  if (type === 'homework') {
    return `This is a homework problem for a ${context.childAge}-year-old child. Extract the problem text and identify the subject (math, reading, science, etc.). Return JSON: { "problem": "...", "subject": "..." }`;
  }
  
  if (type === 'flyer') {
    return `This is a school flyer. Extract: event name, date, time, location, deadline, and any action items. Return JSON: { "event": "...", "date": "YYYY-MM-DD", "time": "HH:MM AM/PM", "location": "...", "deadline": "...", "notes": "..." }`;
  }
  
  if (type === 'receipt') {
    return `This is a receipt. Extract: store name, date, items (name and price), and total. Return JSON: { "store": "...", "date": "YYYY-MM-DD", "items": [{ "name": "...", "price": 0.00 }], "total": 0.00 }`;
  }
  
  if (type === 'fridge') {
    return `This is a photo of a fridge/pantry. Identify visible food items. Return JSON: { "ingredients": ["item1", "item2", ...] }`;
  }
  
  return 'Describe what you see in this image.';
}
```

---

### 2.4 Share Sheet / Share Extension

**Goal:** Share content FROM other apps into Clawer (e.g., "Share to Scout" for research)

#### iOS: Share Extension

**Create Share Extension Target:**

```bash
# In Xcode:
# File → New → Target → Share Extension
# Name: ClawerShare
```

**ShareViewController.swift:**

```swift
import UIKit
import Social
import MobileCoreServices

class ShareViewController: SLComposeServiceViewController {
    override func isContentValid() -> Bool {
        return true
    }
    
    override func didSelectPost() {
        if let item = extensionContext?.inputItems.first as? NSExtensionItem {
            if let attachments = item.attachments {
                for attachment in attachments {
                    if attachment.hasItemConformingToTypeIdentifier(kUTTypeURL as String) {
                        attachment.loadItem(forTypeIdentifier: kUTTypeURL as String, options: nil) { (url, error) in
                            if let shareURL = url as? URL {
                                self.sendToApp(type: "url", content: shareURL.absoluteString)
                            }
                        }
                    } else if attachment.hasItemConformingToTypeIdentifier(kUTTypeText as String) {
                        attachment.loadItem(forTypeIdentifier: kUTTypeText as String, options: nil) { (text, error) in
                            if let shareText = text as? String {
                                self.sendToApp(type: "text", content: shareText)
                            }
                        }
                    }
                }
            }
        }
        
        self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
    
    func sendToApp(type: String, content: String) {
        // Store in shared UserDefaults (app group)
        let sharedDefaults = UserDefaults(suiteName: "group.ai.clawer.mobile")
        sharedDefaults?.set([
            "type": type,
            "content": content,
            "agentId": "researcher", // Default to Scout
            "timestamp": Date().timeIntervalSince1970
        ], forKey: "pendingShare")
        
        // Open main app
        let url = URL(string: "clawer://share")!
        var responder: UIResponder? = self
        while responder != nil {
            if let application = responder as? UIApplication {
                application.perform(#selector(openURL(_:)), with: url)
                break
            }
            responder = responder?.next
        }
    }
}
```

**Handle in Main App:**

```typescript
// src/lib/capacitor/share.ts
import { Preferences } from '@capacitor/preferences';

export async function checkPendingShare(): Promise<{
  type: 'url' | 'text';
  content: string;
  agentId: string;
} | null> {
  // Read from shared preferences
  const { value } = await Preferences.get({ key: 'pendingShare' });
  
  if (value) {
    const share = JSON.parse(value);
    
    // Clear after reading
    await Preferences.remove({ key: 'pendingShare' });
    
    return share;
  }
  
  return null;
}
```

**Use in App:**

```tsx
// pages/_app.tsx
useEffect(() => {
  const handlePendingShare = async () => {
    const share = await checkPendingShare();
    
    if (share) {
      // Navigate to agent chat with pre-filled message
      router.push(`/chat/${share.agentId}?share=${encodeURIComponent(share.content)}`);
    }
  };
  
  handlePendingShare();
}, []);
```

#### Android: Share Target

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<activity android:name=".MainActivity">
  <intent-filter>
    <action android:name="android.intent.action.SEND" />
    <category android:name="android.intent.category.DEFAULT" />
    <data android:mimeType="text/plain" />
  </intent-filter>
  
  <intent-filter>
    <action android:name="android.intent.action.SEND" />
    <category android:name="android.intent.category.DEFAULT" />
    <data android:mimeType="image/*" />
  </intent-filter>
</activity>
```

**Handle in Capacitor:**

```typescript
// src/lib/capacitor/share.ts
import { App } from '@capacitor/app';

App.addListener('appRestoredResult', (data) => {
  // Android share intent data
  if (data.pluginId === 'ShareExtension') {
    const { text, image } = data.data;
    
    if (text) {
      router.push(`/chat/researcher?share=${encodeURIComponent(text)}`);
    } else if (image) {
      // Handle shared image
      router.push(`/chat/researcher?image=${image}`);
    }
  }
});
```

---

### 2.5 Haptics

**Goal:** Tactile feedback for agent responses, button presses, alerts

**Haptic Patterns:**
- **Light tap:** Button press, message sent
- **Medium tap:** Agent response received
- **Strong tap:** Alert, error, important notification
- **Success pattern:** Task completed (light-medium-light)
- **Warning pattern:** Budget warning (medium-medium)

#### Implementation

```typescript
// src/lib/capacitor/haptics.ts
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export async function hapticLight() {
  await Haptics.impact({ style: ImpactStyle.Light });
}

export async function hapticMedium() {
  await Haptics.impact({ style: ImpactStyle.Medium });
}

export async function hapticHeavy() {
  await Haptics.impact({ style: ImpactStyle.Heavy });
}

export async function hapticSuccess() {
  await Haptics.notification({ type: 'success' });
}

export async function hapticWarning() {
  await Haptics.notification({ type: 'warning' });
}

export async function hapticError() {
  await Haptics.notification({ type: 'error' });
}

// Custom patterns
export async function hapticTaskComplete() {
  await hapticLight();
  await sleep(100);
  await hapticMedium();
  await sleep(100);
  await hapticLight();
}
```

**Use in Components:**

```tsx
// When agent sends response
function onAgentResponse(response) {
  hapticMedium();
  displayMessage(response);
}

// When user sends message
function onUserSendMessage() {
  hapticLight();
  submitMessage();
}

// When budget warning
function onBudgetWarning() {
  hapticWarning();
  showAlert('Budget at 80%');
}
```

---

### 2.6 Background Refresh

**Goal:** Update agent status, fetch new messages, update notification badges while app is backgrounded

#### iOS: Background Fetch

```swift
// ios/App/App/AppDelegate.swift
import UIKit
import BackgroundTasks

func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    
    // Register background task
    BGTaskScheduler.shared.register(
        forTaskWithIdentifier: "ai.clawer.mobile.refresh",
        using: nil
    ) { task in
        self.handleBackgroundRefresh(task: task as! BGAppRefreshTask)
    }
    
    return true
}

func applicationDidEnterBackground(_ application: UIApplication) {
    scheduleBackgroundRefresh()
}

func scheduleBackgroundRefresh() {
    let request = BGAppRefreshTaskRequest(identifier: "ai.clawer.mobile.refresh")
    request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes
    
    try? BGTaskScheduler.shared.submit(request)
}

func handleBackgroundRefresh(task: BGAppRefreshTask) {
    scheduleBackgroundRefresh() // Reschedule for next time
    
    task.expirationHandler = {
        task.setTaskCompleted(success: false)
    }
    
    // Call API to fetch new data
    fetchAgentUpdates { success in
        task.setTaskCompleted(success: success)
    }
}
```

**Capacitor Bridge:**

```typescript
// src/lib/capacitor/background-refresh.ts
import { BackgroundTask } from '@capacitor/background-task';

export async function performBackgroundRefresh() {
  const taskId = await BackgroundTask.beforeExit(async () => {
    try {
      // Fetch latest agent activity
      const updates = await fetch('/api/agents/updates').then(r => r.json());
      
      // Update badge count
      if (updates.unreadCount > 0) {
        await Badge.set({ count: updates.unreadCount });
      }
      
      // Store in local cache
      await Preferences.set({
        key: 'latestUpdates',
        value: JSON.stringify(updates),
      });
      
      BackgroundTask.finish({ taskId });
    } catch (err) {
      BackgroundTask.finish({ taskId });
    }
  });
}
```

#### Android: WorkManager

```kotlin
// android/app/src/main/java/ai/clawer/mobile/BackgroundRefreshWorker.kt
package ai.clawer.mobile

import android.content.Context
import androidx.work.*
import java.util.concurrent.TimeUnit

class BackgroundRefreshWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result {
        return try {
            // Fetch updates from API
            val response = apiClient.getAgentUpdates()
            
            // Update notification badge
            if (response.unreadCount > 0) {
                setBadgeCount(response.unreadCount)
            }
            
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
    
    companion object {
        fun schedule(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
            
            val request = PeriodicWorkRequestBuilder<BackgroundRefreshWorker>(
                15, TimeUnit.MINUTES
            ).setConstraints(constraints).build()
            
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                "background-refresh",
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )
        }
    }
}
```

---

### 2.7 Biometric Authentication

**Goal:** Optional Face ID / Touch ID / fingerprint lock for app

**UX:** After X minutes of inactivity, require biometric to unlock

#### Implementation

Already covered in [1.4 Authentication Flow](#14-authentication-flow)

**Settings Toggle:**

```tsx
// pages/settings.tsx
import { isBiometricAvailable, getBiometricType } from '@/lib/capacitor/biometric';

export function SettingsScreen() {
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  
  useEffect(() => {
    checkBiometric();
  }, []);
  
  async function checkBiometric() {
    const available = await isBiometricAvailable();
    setBiometricAvailable(available);
    
    if (available) {
      const type = await getBiometricType();
      setBiometricType(type);
      
      const enabled = localStorage.getItem('biometric_enabled') === 'true';
      setBiometricEnabled(enabled);
    }
  }
  
  async function toggleBiometric(enabled: boolean) {
    if (enabled) {
      // Test biometric before enabling
      const success = await authenticateWithBiometric();
      
      if (success) {
        localStorage.setItem('biometric_enabled', 'true');
        setBiometricEnabled(true);
      }
    } else {
      localStorage.setItem('biometric_enabled', 'false');
      setBiometricEnabled(false);
    }
  }
  
  return (
    <div className="settings">
      <h2>Security</h2>
      
      {biometricAvailable && (
        <Toggle
          label={`Unlock with ${biometricType}`}
          checked={biometricEnabled}
          onChange={toggleBiometric}
        />
      )}
    </div>
  );
}
```

---

### 2.8 Widget Support

**Goal:** iOS home screen widget showing latest agent activity

#### iOS Widget (SwiftUI)

```swift
// ios/ClawerWidget/ClawerWidget.swift
import WidgetKit
import SwiftUI

struct AgentActivityEntry: TimelineEntry {
    let date: Date
    let agentName: String
    let lastActivity: String
    let emoji: String
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> AgentActivityEntry {
        AgentActivityEntry(
            date: Date(),
            agentName: "Max",
            lastActivity: "Morning Brief ready",
            emoji: "📋"
        )
    }
    
    func getSnapshot(in context: Context, completion: @escaping (AgentActivityEntry) -> ()) {
        let entry = AgentActivityEntry(
            date: Date(),
            agentName: "Max",
            lastActivity: "Morning Brief ready",
            emoji: "📋"
        )
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        // Fetch latest activity from API
        fetchLatestActivity { activity in
            let entry = AgentActivityEntry(
                date: Date(),
                agentName: activity.agentName,
                lastActivity: activity.description,
                emoji: activity.emoji
            )
            
            let timeline = Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(15 * 60)))
            completion(timeline)
        }
    }
}

struct ClawerWidgetEntryView : View {
    var entry: Provider.Entry
    
    var body: some View {
        VStack(alignment: .leading) {
            HStack {
                Text(entry.emoji)
                    .font(.system(size: 24))
                Text(entry.agentName)
                    .font(.headline)
            }
            
            Text(entry.lastActivity)
                .font(.caption)
                .lineLimit(2)
            
            Spacer()
            
            Text(entry.date, style: .relative)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding()
    }
}

@main
struct ClawerWidget: Widget {
    let kind: String = "ClawerWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            ClawerWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Agent Activity")
        .description("See your latest agent updates")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

**API Endpoint for Widget:**

```typescript
// pages/api/widgets/latest-activity.ts
export default async function handler(req, res) {
  const { userId } = req.query;
  
  // Fetch latest agent activity
  const activity = await db.agentActivity.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { agent: true },
  });
  
  if (!activity) {
    return res.status(200).json({
      agentName: 'No Activity',
      description: 'No recent updates',
      emoji: '💤',
    });
  }
  
  res.status(200).json({
    agentName: activity.agent.name,
    description: activity.title,
    emoji: activity.agent.emoji,
    timestamp: activity.createdAt,
  });
}
```

---

## 3. Mobile-Optimized UX

### 3.1 Navigation: Bottom Tab Bar

**4 tabs (not hamburger menu):**

```
┌─────────────────────────────────────────────────────────┐
│  Content Area (switches based on active tab)            │
│                                                          │
│                                                          │
│                                                          │
│                                                          │
│                                                          │
│                                                          │
│                                                          │
│                                                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
┌──────────┬──────────┬──────────┬──────────┐
│ 🏠 Feed  │ 👥 Team  │ 💬 Chat  │ ⚙️ More  │
└──────────┴──────────┴──────────┴──────────┘
```

**Implementation:**

```tsx
// src/components/TabBar.tsx
import { useRouter } from 'next/router';
import { HomeIcon, UsersIcon, ChatIcon, CogIcon } from '@heroicons/react/outline';

export function TabBar() {
  const router = useRouter();
  const currentPath = router.pathname;
  
  const tabs = [
    { id: 'feed', label: 'Feed', icon: HomeIcon, path: '/feed' },
    { id: 'team', label: 'Team', icon: UsersIcon, path: '/team' },
    { id: 'chat', label: 'Chat', icon: ChatIcon, path: '/chat' },
    { id: 'more', label: 'More', icon: CogIcon, path: '/more' },
  ];
  
  return (
    <div className="tab-bar">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = currentPath.startsWith(tab.path);
        
        return (
          <button
            key={tab.id}
            className={`tab ${isActive ? 'active' : ''}`}
            onClick={() => router.push(tab.path)}
          >
            <Icon className="tab-icon" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
```

**Responsive CSS:**

```css
/* styles/tab-bar.css */
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--background);
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-around;
  padding-bottom: env(safe-area-inset-bottom); /* iOS notch */
  z-index: 1000;
}

.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.tab.active {
  color: var(--primary);
}

.tab-icon {
  width: 24px;
  height: 24px;
}

.tab span {
  font-size: 10px;
  font-weight: 500;
}
```

---

### 3.2 Feed Tab: Activity Timeline

**Wireframe:**

```
┌─────────────────────────────────────────────────────────┐
│  Feed                                        [Filter 🔽] │
├─────────────────────────────────────────────────────────┤
│  Today                                                   │
│  ────────────────────────────────────────────────────  │
│  📋 Max completed Morning Brief                         │
│  2 hours ago                                   [View →] │
│  ────────────────────────────────────────────────────  │
│  🔍 Scout finished research on "AI tools"              │
│  4 hours ago                                   [View →] │
│  ────────────────────────────────────────────────────  │
│                                                          │
│  Yesterday                                               │
│  ────────────────────────────────────────────────────  │
│  💪 Zen sent evening wind-down                          │
│  Yesterday at 8:00 PM                          [View →] │
│  ────────────────────────────────────────────────────  │
│  ⚡ Dash completed 5 tasks                               │
│  Yesterday at 3:45 PM                          [View →] │
│  ────────────────────────────────────────────────────  │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**

```tsx
// pages/feed.tsx
import { useEffect, useState } from 'react';
import { formatRelative } from 'date-fns';

export default function FeedPage() {
  const [activities, setActivities] = useState([]);
  
  useEffect(() => {
    fetchActivities();
  }, []);
  
  async function fetchActivities() {
    const res = await fetch('/api/activities/feed');
    const data = await res.json();
    setActivities(data.activities);
  }
  
  return (
    <div className="feed-page">
      <header>
        <h1>Feed</h1>
        <button>Filter</button>
      </header>
      
      <div className="activity-list">
        {groupByDate(activities).map(group => (
          <div key={group.date} className="activity-group">
            <h3>{group.label}</h3>
            
            {group.items.map(activity => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onClick={() => router.push(`/chat/${activity.agentId}`)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityCard({ activity, onClick }) {
  return (
    <div className="activity-card" onClick={onClick}>
      <div className="activity-header">
        <span className="agent-emoji">{activity.agentEmoji}</span>
        <div className="activity-info">
          <strong>{activity.agentName}</strong>
          <span> {activity.type}</span>
        </div>
      </div>
      
      <p className="activity-description">{activity.description}</p>
      
      <div className="activity-footer">
        <time>{formatRelative(new Date(activity.timestamp), new Date())}</time>
        <button>View →</button>
      </div>
    </div>
  );
}
```

---

### 3.3 Team Tab: Agent Grid

**Wireframe:**

```
┌─────────────────────────────────────────────────────────┐
│  Your Team                                [Edit Team →] │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  📋          │  │  🎯          │  │  🔍          │  │
│  │  Max         │  │  North       │  │  Scout       │  │
│  │  Chief of    │  │  Goal        │  │  Research    │  │
│  │  Staff       │  │  Tracker     │  │              │  │
│  │              │  │              │  │              │  │
│  │  🟢 Active   │  │  ⚪ Idle     │  │  🟢 Active   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │  ⚡          │  │  💪          │                    │
│  │  Dash        │  │  Zen         │                    │
│  │  Task        │  │  Wellness    │                    │
│  │  Runner      │  │  Coach       │                    │
│  │              │  │              │                    │
│  │  ⚪ Idle     │  │  🟢 Active   │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**

```tsx
// pages/team.tsx
import { useTeam } from '@/hooks/useTeam';

export default function TeamPage() {
  const { team, loading } = useTeam();
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="team-page">
      <header>
        <h1>Your Team</h1>
        <button>Edit Team →</button>
      </header>
      
      <div className="team-grid">
        {team.members.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onClick={() => router.push(`/chat/${agent.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

function AgentCard({ agent, onClick }) {
  return (
    <div className="agent-card" onClick={onClick}>
      <div className="agent-emoji">{agent.emoji}</div>
      <h3>{agent.name}</h3>
      <p className="agent-role">{agent.role}</p>
      
      <div className="agent-status">
        <span className={`status-indicator ${agent.status}`}></span>
        <span>{agent.status === 'active' ? 'Active' : 'Idle'}</span>
      </div>
    </div>
  );
}
```

**CSS Grid:**

```css
.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  padding: 16px;
}

.agent-card {
  background: var(--card-background);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.agent-card:active {
  transform: scale(0.95);
}

.agent-emoji {
  font-size: 48px;
  margin-bottom: 8px;
}

.agent-role {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.agent-status {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.active {
  background: #22c55e;
}

.status-indicator.idle {
  background: #94a3b8;
}
```

---

### 3.4 Chat Tab: Conversation UI

**Wireframe:**

```
┌─────────────────────────────────────────────────────────┐
│  ← 📋 Max (Chief of Staff)                   [Info ℹ️]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Max is thinking... 3s                              │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [Max's response]                                        │
│  Morning Brief — Feb 11, 2026                            │
│  ✓ Top priority: Finish mobile spec                     │
│  ✓ Meetings: None                                        │
│  ✓ Reminders: Call dentist by 5pm                       │
│                                                  9:05 AM │
│  ┌──────────────────┐                                   │
│  │ 👍 Approve       │ 👎 Reject                         │
│  └──────────────────┘                                   │
│                                                          │
│                                         [Your message]   │
│                                         What should I    │
│                                         focus on today?  │
│                                                  8:58 AM │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [📷] [Type message...]              [🎤 Hold to talk]  │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**

```tsx
// pages/chat/[agentId].tsx
import { useRouter } from 'next/router';
import { useChat } from '@/hooks/useChat';
import { VoiceButton } from '@/components/VoiceButton';
import { CameraButton } from '@/components/CameraButton';

export default function ChatPage() {
  const router = useRouter();
  const { agentId } = router.query;
  
  const {
    messages,
    agent,
    isTyping,
    sendMessage,
    sendVoice,
    sendPhoto,
  } = useChat(agentId as string);
  
  return (
    <div className="chat-page">
      <header>
        <button onClick={() => router.back()}>←</button>
        <div className="agent-info">
          <span className="agent-emoji">{agent?.emoji}</span>
          <div>
            <h2>{agent?.name}</h2>
            <p>{agent?.role}</p>
          </div>
        </div>
        <button>ℹ️</button>
      </header>
      
      <div className="messages">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} agent={agent} />
        ))}
        
        {isTyping && (
          <div className="typing-indicator">
            <span>{agent?.name} is thinking...</span>
            <Timer />
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="input-bar">
        <CameraButton onPhoto={sendPhoto} />
        <input
          type="text"
          placeholder="Type message..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
        />
        <VoiceButton onTranscript={sendVoice} />
      </div>
    </div>
  );
}

function MessageBubble({ message, agent }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`message ${isUser ? 'user' : 'agent'}`}>
      {!isUser && <span className="message-avatar">{agent?.emoji}</span>}
      
      <div className="message-content">
        <ReactMarkdown>{message.text}</ReactMarkdown>
        
        {message.verification && (
          <VerificationBadge {...message.verification} />
        )}
        
        {!isUser && (
          <div className="message-actions">
            <button onClick={() => approveFeedback(message.id)}>
              👍 Approve
            </button>
            <button onClick={() => rejectFeedback(message.id)}>
              👎 Reject
            </button>
          </div>
        )}
      </div>
      
      <time>{formatTime(message.timestamp)}</time>
    </div>
  );
}
```

---

### 3.5 Onboarding Flow

**Goal:** Get user to first value moment in <2 minutes

**Screens:**

1. **Welcome (Splash):**
   - Clawer logo + tagline
   - "Your AI team, ready to work"
   - Button: "Get Started"

2. **Team Selection:**
   - Show 8 team templates as cards
   - Personal HQ, Solopreneur, E-commerce, Content Creator, Parent Command Center, Fitness, Finance, Growth Ops
   - Each card shows: Template name, 3-4 agent avatars, key use cases
   - Select one → Continue

3. **Agent Introduction (Interactive):**
   - After team selected, each agent "introduces" themselves in a chat bubble
   - Max: "Hey! I'm Max, your Chief of Staff. I'll handle planning and prioritization."
   - Scout: "I'm Scout, your researcher. Need me to dig into something? Just ask!"
   - Auto-scroll through intros (2 seconds each)
   - Button: "Meet My Team" (skip to dashboard)

4. **Permissions:**
   - Request notifications: "Get notified when your team completes tasks"
   - Request camera: "Snap photos to send to your agents"
   - Request microphone: "Talk to your team hands-free"
   - Can skip all, will ask again when needed

5. **First Task Prompt:**
   - Pre-filled example based on team template:
     - Personal HQ: "What should I focus on today?"
     - Parent Command Center: "Plan dinners for this week"
     - Solopreneur: "Draft a cold email to a potential client"
   - Send message → agent responds → hook moment

**Implementation:**

```tsx
// pages/onboarding/index.tsx
export default function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [selectedTeam, setSelectedTeam] = useState(null);
  
  return (
    <div className="onboarding">
      {step === 1 && <WelcomeScreen onContinue={() => setStep(2)} />}
      
      {step === 2 && (
        <TeamSelectionScreen
          onSelect={team => {
            setSelectedTeam(team);
            setStep(3);
          }}
        />
      )}
      
      {step === 3 && (
        <AgentIntroScreen
          team={selectedTeam}
          onComplete={() => setStep(4)}
        />
      )}
      
      {step === 4 && <PermissionsScreen onContinue={() => setStep(5)} />}
      
      {step === 5 && (
        <FirstTaskScreen
          team={selectedTeam}
          onComplete={() => router.push('/dashboard')}
        />
      )}
    </div>
  );
}
```

---

### 3.6 Responsive Breakpoints

**CSS Media Queries:**

```css
/* Mobile-first approach */

/* Base styles (mobile, 375px+) */
.container {
  padding: 16px;
}

.team-grid {
  grid-template-columns: repeat(2, 1fr);
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .container {
    padding: 24px;
    max-width: 768px;
    margin: 0 auto;
  }
  
  .team-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Desktop (web view, 1024px+) */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
  }
  
  .team-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  /* Show sidebar on desktop */
  .sidebar {
    display: block;
  }
}

/* Handle notches and safe areas */
.tab-bar {
  padding-bottom: env(safe-area-inset-bottom);
}

header {
  padding-top: env(safe-area-inset-top);
}
```

---

## 4. Parent Command Center Deep Dive

**This is the killer mobile use case.** Parents are:
- Always on their phone
- Hands are usually full
- Need to capture info quickly (school flyers, homework)
- Voice-first preference

### 4.1 Voice-First Grocery List

**Scenario:** Mom is cooking, realizes she's out of milk

**Flow:**

1. Hold voice button (hands free, phone on counter)
2. "Add milk to the grocery list"
3. Agent (Mel, Meal Planner) confirms with haptic + TTS: "Added milk to your list"
4. Later: Open grocery list, milk is there with checkbox

**Implementation:**

```typescript
// Voice command handler
function handleVoiceCommand(transcript: string) {
  const addToListPattern = /add (.*) to (?:the )?grocery list/i;
  const match = transcript.match(addToListPattern);
  
  if (match) {
    const item = match[1];
    addToGroceryList(item);
    
    // Haptic + TTS confirmation
    hapticSuccess();
    speak(`Added ${item} to your list`);
  } else {
    // Route to general agent chat
    sendToAgent('mel', transcript);
  }
}
```

---

### 4.2 Photo Homework Flow

**Scenario:** Kid comes home with math homework, parent snaps photo

**Flow:**

1. Tap camera button in chat with Prof (Homework Helper)
2. Take photo of problem: "What is 3/4 + 1/2?"
3. GPT-4 Vision extracts: `{ problem: "3/4 + 1/2", type: "fraction_addition", grade: "2-3" }`
4. Prof responds (tutoring mode, NO direct answer):
   ```
   Great question! Let's work through this together.
   
   First, remember that to add fractions, they need the same denominator (bottom number).
   
   We have 3/4 and 1/2. The denominators are 4 and 2.
   
   What number can both 4 and 2 divide into evenly? (Hint: Think small!)
   ```
5. Kid types answer, Prof guides step-by-step
6. Final step: "Now YOU try the final addition. What's your answer?"
7. Kid gets it right → Prof celebrates, parents get notification "Emma completed math homework"

**Prof's Tutoring Prompt:**

```typescript
const PROF_SYSTEM_PROMPT = `
You are Prof, the Homework Helper for ${familyProfile.childName} (age ${familyProfile.childAge}).

**Your mission:** Help kids LEARN, not just get answers.

**Rules:**
1. NEVER give direct answers
2. Ask leading questions that guide them to the solution
3. Praise effort, not just correctness
4. If stuck for >2 turns, give a hint
5. Adjust language for age/grade level
6. Final step: ask THEM to solve it

**Example (fraction addition):**
- ❌ DON'T: "The answer is 1 1/4"
- ✅ DO: "What's the first step when adding fractions with different denominators?"

Now help with this problem: ${problem}
`;
```

---

### 4.3 School Flyer Parsing

**Scenario:** Kid brings home paper flyer for "Science Fair — March 15, permission slip due March 10"

**Flow:**

1. Parent snaps photo in chat with Cal (Calendar Manager)
2. Vision API extracts:
   ```json
   {
     "event": "Science Fair",
     "date": "2026-03-15",
     "time": "6:00 PM",
     "location": "School Gym",
     "deadline": "2026-03-10",
     "notes": "Permission slip due March 10, $5 entry fee"
   }
   ```
3. Cal responds:
   ```
   Found: Science Fair on March 15 at 6pm (School Gym)
   
   ⚠️ Permission slip due March 10
   💵 $5 entry fee
   
   Should I:
   • Add event to calendar
   • Set reminder for March 9 (sign permission slip)
   • Add $5 to budget tracker
   ```
4. Parent taps "Yes, do all" → Done in 1 tap

---

### 4.4 Meal Planning with What You Have

**Scenario:** Mom opens fridge, has chicken and rice, doesn't know what to make

**Flow:**

1. Open chat with Mel (Meal Planner)
2. Tap camera, take photo of fridge contents
3. Vision API identifies: chicken breast, broccoli, carrots, leftover rice, eggs, cheese
4. Mel responds:
   ```
   I see chicken, broccoli, carrots, and leftover rice! Here are 3 quick ideas:
   
   1. **Chicken Fried Rice** (15 min)
      - Perfect for using that leftover rice
      - Add veggies + soy sauce
   
   2. **Sheet Pan Chicken & Veggies** (25 min)
      - Roast everything at 400°F
      - Minimal cleanup
   
   3. **Chicken Quesadillas** (10 min)
      - Shred chicken, melt cheese
      - Serve with veggies on the side
   
   Which sounds good? I can give you the full recipe!
   ```
5. Mom taps "Chicken fried rice"
6. Mel provides step-by-step recipe, reads it aloud if requested

**Voice Mode for Cooking:**

```tsx
// Hands-free recipe mode
function RecipeVoiceMode({ recipe }) {
  const [currentStep, setCurrentStep] = useState(0);
  
  useEffect(() => {
    // Read current step aloud
    speak(recipe.steps[currentStep]);
  }, [currentStep]);
  
  function nextStep() {
    if (currentStep < recipe.steps.length - 1) {
      setCurrentStep(s => s + 1);
      hapticLight();
    }
  }
  
  function previousStep() {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
      hapticLight();
    }
  }
  
  return (
    <div className="recipe-voice-mode">
      <h2>{recipe.title}</h2>
      
      <div className="step-display">
        <h3>Step {currentStep + 1} of {recipe.steps.length}</h3>
        <p className="step-text">{recipe.steps[currentStep]}</p>
      </div>
      
      <div className="voice-controls">
        <button onClick={previousStep}>← Previous</button>
        <button onClick={() => speak(recipe.steps[currentStep])}>
          🔊 Repeat
        </button>
        <button onClick={nextStep}>Next →</button>
      </div>
      
      <p className="voice-hint">
        Or say: "Next step", "Repeat", "Go back"
      </p>
    </div>
  );
}
```

---

### 4.5 Family Calendar Sync & Conflict Detection

**Scenario:** Both parents add events, Cal detects conflicts

**Flow:**

1. Dad adds "Dentist appointment Tuesday 3pm"
2. Cal checks existing calendar, sees "Soccer practice Tuesday 3pm"
3. Cal sends notification to both parents:
   ```
   ⚠️ Schedule Conflict Detected
   
   Tuesday, March 12:
   • Dentist appointment (3:00 PM) — added by Dad
   • Soccer practice (3:00 PM) — recurring event
   
   Should I:
   1. Reschedule dentist to Wednesday 3pm? (available)
   2. Skip soccer this week?
   3. Keep both (you decide)
   ```
4. Mom taps "Reschedule dentist" → Cal makes the change, notifies Dad

**Backend: Conflict Detection**

```typescript
// When event is added
async function checkCalendarConflicts(newEvent: CalendarEvent, userId: string) {
  const existingEvents = await db.calendarEvents.findMany({
    where: {
      userId,
      date: newEvent.date,
      // Check for time overlap
      OR: [
        {
          startTime: { lte: newEvent.endTime },
          endTime: { gte: newEvent.startTime },
        },
      ],
    },
  });
  
  if (existingEvents.length > 0) {
    // Found conflict!
    await sendPushNotification(userId, {
      title: '⚠️ Schedule Conflict',
      body: `${newEvent.title} conflicts with ${existingEvents[0].title}`,
      data: {
        route: '/calendar/resolve-conflict',
        conflictId: crypto.randomUUID(),
      },
    });
    
    // Store conflict for resolution
    await db.calendarConflicts.create({
      data: {
        userId,
        newEventId: newEvent.id,
        conflictingEventIds: existingEvents.map(e => e.id),
        status: 'pending',
      },
    });
  }
}
```

---

### 4.6 Emergency Quick Access

**Scenario:** Parent needs to ask agent something FAST (kid fell, need advice)

**Implementation:**

**Option 1: Shake Phone → Voice Input**

```typescript
// src/lib/capacitor/shake-detection.ts
import { DeviceMotionAccelerationData } from '@capacitor/device-motion';

export function enableShakeToActivate(onShake: () => void) {
  let lastShake = 0;
  
  DeviceMotion.addListener('accelerationData', (data: DeviceMotionAccelerationData) => {
    const { x, y, z } = data.acceleration;
    const acceleration = Math.sqrt(x * x + y * y + z * z);
    
    // Shake threshold
    if (acceleration > 15) {
      const now = Date.now();
      if (now - lastShake > 1000) { // Prevent double-trigger
        lastShake = now;
        onShake();
      }
    }
  });
}

// Use in app
useEffect(() => {
  enableShakeToActivate(() => {
    hapticHeavy();
    startVoiceRecording();
  });
}, []);
```

**Option 2: 3D Touch App Icon (iOS)**

```xml
<!-- ios/App/App/Info.plist -->
<key>UIApplicationShortcutItems</key>
<array>
  <dict>
    <key>UIApplicationShortcutItemType</key>
    <string>ai.clawer.mobile.quick-voice</string>
    <key>UIApplicationShortcutItemTitle</key>
    <string>Quick Voice</string>
    <key>UIApplicationShortcutItemIconType</key>
    <string>UIMicrophone</string>
  </dict>
  <dict>
    <key>UIApplicationShortcutItemType</key>
    <string>ai.clawer.mobile.ask-care</string>
    <key>UIApplicationShortcutItemTitle</key>
    <string>Ask Care (Health)</string>
    <key>UIApplicationShortcutItemIconType</key>
    <string>UIHealth</string>
  </dict>
</array>
```

**Handle in app:**

```typescript
import { App } from '@capacitor/app';

App.addListener('appUrlOpen', (data) => {
  if (data.url === 'clawer://quick-voice') {
    // Open voice input immediately
    router.push('/voice');
  } else if (data.url === 'clawer://ask-care') {
    router.push('/chat/wellness-coach');
  }
});
```

---

## 5. App Store Strategy

### 5.1 App Name & Metadata

**App Name (30 chars max):**  
`Clawer: AI Team Assistant`

**Subtitle (30 chars max):**  
`Your personal AI team, always on`

**Keywords (100 chars total):**  
`ai assistant,team,automation,productivity,task,chat,voice,agent,smart,work,helper,organize,plan,research`

**Category:**  
- Primary: Productivity
- Secondary: Business

---

### 5.2 App Store Description (Full)

**First 170 chars (visible without "more"):**

```
Meet your AI team: specialized assistants that work together to run your life. From research to task management to meal planning, they've got you covered. Voice-first, mobile-native, always ready.
```

**Full description (500 words):**

```
# Your AI Team Is Here

Forget single-assistant chatbots. Clawer gives you an entire team of specialized AI agents, each an expert in their domain.

## How It Works

Choose a team template (Personal HQ, Solopreneur, Parent Command Center, and more), and you'll get 3-5 agents ready to help:

**📋 Max (Chief of Staff)** — Your right hand for planning, prioritization, and daily briefings  
**🔍 Scout (Researcher)** — Digs into topics, compares options, saves knowledge  
**⚡ Dash (Task Runner)** — Executes tasks, automates workflows, gets things done  
**🎯 North (Goal Tracker)** — Keeps your goals on track with weekly check-ins  
**💪 Zen (Wellness Coach)** — Helps you maintain balance and well-being

## Why Teams Beat Solo Assistants

Your agents collaborate behind the scenes. Scout researches email tools → Max reviews findings and sets priorities → Dash drafts the actual email. You just ask once, the team handles the rest.

## Voice-First Design

Hold to talk (like a walkie-talkie). Get responses read aloud. Perfect for cooking, driving, or when your hands are full.

## Photo Intelligence

Snap a school flyer → auto-added to calendar. Homework problem → step-by-step tutoring. Receipt → budget tracked. Your camera becomes your input device.

## Automated Workflows

Set it and forget it. Morning briefings at 7 AM. Weekly reviews on Sunday. Budget alerts when you hit 80%. Your team works 24/7.

## Built for Parents (Command Center Template)

The Parent Command Center is a game-changer:
- Voice-first grocery lists
- Homework help that teaches (not cheats)
- Meal planning based on fridge contents
- Calendar sync with conflict detection
- Emergency quick access (shake to activate)

## Privacy & Control

Your data stays in your private container. Agents don't share data across users. You can approve/reject outputs, tune agent behavior, and set budget limits.

## Pricing That Makes Sense

**Free:** 10 interactions/day, text-only  
**Credit Packs:** $4.99 (50 messages), $19.99 (300 messages)  
**Pro Subscription:** $49.99/month unlimited

No contracts. No hidden fees. Cancel anytime.

## Who's This For?

- **Busy professionals** drowning in todo lists
- **Solopreneurs** wearing 10 hats at once
- **Parents** managing kids, meals, and schedules
- **Content creators** juggling research, writing, and promotion
- **Anyone** who wants AI that actually helps, not just answers questions

## What Makes Clawer Different

**Not just a chatbot** — It's a team that works together  
**Not web-only** — Native mobile with voice, camera, push notifications  
**Not generic** — Specialized agents for specific jobs  
**Not passive** — Proactive automation, not reactive Q&A

Download now and meet your team. First 7 days free, all features unlocked.
```

---

### 5.3 Screenshots Plan

**6 screenshots (required for App Store):**

**Screenshot 1: Team Dashboard (Hero Shot)**
- Show team grid with 5 agents (emoji, name, role, status)
- Overlay text: "Your AI Team, Ready to Work"
- Subtext: "5 specialists, 1 command center"

**Screenshot 2: Voice Chat**
- Show voice button pressed, waveform active
- Chat bubbles with agent response
- Overlay: "Talk to Your Team Hands-Free"
- Subtext: "Hold to talk, get instant answers"

**Screenshot 3: Photo Intelligence (School Flyer)**
- Split screen: Left = photo of flyer, Right = calendar event created
- Overlay: "Snap It, Schedule It"
- Subtext: "Photos become actions, automatically"

**Screenshot 4: Activity Feed**
- Show feed with multiple agent activities
- Overlay: "See What Your Team's Working On"
- Subtext: "Morning briefs, research results, task updates — all in one feed"

**Screenshot 5: Parent Command Center**
- Show meal planning chat with photo of fridge → recipe suggestions
- Overlay: "Built for Busy Parents"
- Subtext: "Meal plans, homework help, calendar sync"

**Screenshot 6: Automation & Reliability**
- Show Mission Control dashboard with health metrics, budget tracker
- Overlay: "Automation You Can Trust"
- Subtext: "24/7 agents with built-in reliability and budget controls"

**Design Guidelines:**
- Real device mockups (iPhone 15 Pro, not floating screens)
- Readable text (min 24pt for overlays)
- Brand colors (dark mode preferred, matches app)
- Show actual app UI (no stock photos or fake data)

---

### 5.4 Review Strategy

**When to prompt:**
1. After **3rd successful agent interaction** (not on first use)
2. After **7 days of active use** (at least 1 session/day)
3. After **completing a high-value task** (e.g., meal plan generated, research completed)

**How to prompt:**

```typescript
// src/lib/review-prompt.ts
import { App } from '@capacitor/app';
import StoreReview from '@capacitor-native/store-review';

export async function checkReviewPrompt() {
  // Don't spam - once per 60 days
  const lastPrompt = localStorage.getItem('last_review_prompt');
  if (lastPrompt) {
    const daysSince = (Date.now() - parseInt(lastPrompt)) / (1000 * 60 * 60 * 24);
    if (daysSince < 60) return;
  }
  
  // Check eligibility
  const taskCount = await getCompletedTaskCount();
  const daysActive = await getActiveDaysCount();
  
  if (taskCount >= 3 || daysActive >= 7) {
    // Use native review prompt (iOS SKStoreReviewController, Android In-App Review)
    const result = await StoreReview.requestReview();
    
    localStorage.setItem('last_review_prompt', Date.now().toString());
  }
}
```

---

### 5.5 Privacy Nutrition Labels (Apple)

**Data Collected:**

| **Category** | **Linked to User** | **Used for Tracking** | **Purpose** |
|--------------|--------------------|-----------------------|-------------|
| **Contact Info** (email) | Yes | No | Account creation |
| **User Content** (messages to agents) | Yes | No | Provide AI responses |
| **Usage Data** (agent interactions, features used) | Yes | No | Analytics, improve product |
| **Device ID** (push token) | Yes | No | Send notifications |

**Data NOT Collected:**
- Location (unless user explicitly shares in message)
- Browsing history
- Purchase history outside app
- Financial info (handled by Apple/Stripe, not us)
- Health data
- Contacts, photos (unless user shares via app)

**Third Parties with Access:**
- OpenAI (message content for AI responses)
- Stripe (payment info, we don't see card numbers)
- Sentry (crash reports, anonymized)

---

### 5.6 Launch Plan

**Phase 1: TestFlight Beta (Week 6-7)**
- Invite 50 users (existing Clawer web users + waitlist)
- Focus areas: Onboarding flow, voice UX, push notifications, crash rate
- Success metrics: <5% crash rate, >50% D1 retention, >10 interactions/user

**Phase 2: Soft Launch (Week 8)**
- Submit to App Store + Play Store
- Launch in 1-2 countries (US + Canada)
- Monitor reviews, fix critical bugs
- Limited marketing (no paid ads yet)

**Phase 3: Full Launch (Week 9-10)**
- Expand to all countries
- Marketing push: ProductHunt, Twitter, email to waitlist
- ASO optimizations based on early data
- Paid ads (if unit economics work)

**Phase 4: Iteration (Week 11+)**
- A/B test paywall (pricing, positioning)
- Add requested features (widgets, integrations)
- Platform-specific optimizations (iOS vs Android performance)

---

## 6. Technical Implementation

### 6.1 Capacitor Project Setup

**Directory Structure:**

```
clawer-mobile/
├── android/               # Android native project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── java/ai/clawer/mobile/
│   │   │   └── res/
│   │   └── build.gradle
│   └── gradle.properties
├── ios/                   # iOS native project
│   ├── App/
│   │   ├── App/
│   │   │   ├── Info.plist
│   │   │   ├── AppDelegate.swift
│   │   │   └── capacitor.config.json
│   │   └── App.xcodeproj
│   └── Podfile
├── src/                   # Next.js app source
│   ├── pages/
│   ├── components/
│   ├── lib/
│   │   └── capacitor/     # Capacitor plugin wrappers
│   │       ├── camera.ts
│   │       ├── voice.ts
│   │       ├── push-notifications.ts
│   │       └── ...
│   └── styles/
├── public/                # Static assets
├── capacitor.config.ts    # Capacitor configuration
├── next.config.js         # Next.js configuration
└── package.json           # Dependencies
```

**Key Files:**

`package.json` dependencies:

```json
{
  "dependencies": {
    "next": "16.1.6",
    "react": "^19.0.0",
    "@capacitor/core": "^7.0.0",
    "@capacitor/cli": "^7.0.0",
    "@capacitor/android": "^7.0.0",
    "@capacitor/ios": "^7.0.0",
    "@capacitor/app": "^7.0.0",
    "@capacitor/camera": "^7.0.0",
    "@capacitor/haptics": "^7.0.0",
    "@capacitor/keyboard": "^7.0.0",
    "@capacitor/preferences": "^7.0.0",
    "@capacitor/push-notifications": "^7.0.0",
    "@capacitor/share": "^7.0.0",
    "@capacitor/splash-screen": "^7.0.0",
    "@capacitor/status-bar": "^7.0.0",
    "@aparajita/capacitor-biometric-auth": "^7.0.0",
    "capacitor-voice-recorder": "^7.0.0",
    "@capgo/capacitor-updater": "^8.0.0",
    "react-native-purchases": "^8.0.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build && next export",
    "cap:sync": "npm run build && npx cap sync",
    "cap:open:ios": "npx cap open ios",
    "cap:open:android": "npx cap open android",
    "cap:run:ios": "npm run cap:sync && npx cap run ios",
    "cap:run:android": "npm run cap:sync && npx cap run android"
  }
}
```

---

### 6.2 Plugin List (Complete)

| **Plugin** | **Version** | **Purpose** | **Platforms** |
|------------|-------------|-------------|---------------|
| `@capacitor/app` | 7.0.0 | App state, deep linking | iOS, Android |
| `@capacitor/camera` | 7.0.0 | Photo capture | iOS, Android |
| `@capacitor/haptics` | 7.0.0 | Tactile feedback | iOS, Android |
| `@capacitor/keyboard` | 7.0.0 | Keyboard management | iOS, Android |
| `@capacitor/preferences` | 7.0.0 | Secure storage | iOS, Android |
| `@capacitor/push-notifications` | 7.0.0 | Push via FCM/APNs | iOS, Android |
| `@capacitor/share` | 7.0.0 | Native share sheet | iOS, Android |
| `@capacitor/splash-screen` | 7.0.0 | Launch screen | iOS, Android |
| `@capacitor/status-bar` | 7.0.0 | Status bar styling | iOS, Android |
| `@aparajita/capacitor-biometric-auth` | 7.0.0 | Face ID, Touch ID, fingerprint | iOS, Android |
| `capacitor-voice-recorder` | 7.0.0 | Audio recording | iOS, Android |
| `@capgo/capacitor-updater` | 8.0.0 | Live updates (OTA) | iOS, Android |
| `react-native-purchases` | 8.0.0 | RevenueCat (IAP) | iOS, Android |

---

### 6.3 Native Bridge Patterns

**Detect Native vs Web:**

```typescript
// src/lib/platform.ts
import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const isIOS = Capacitor.getPlatform() === 'ios';
export const isAndroid = Capacitor.getPlatform() === 'android';
export const isWeb = Capacitor.getPlatform() === 'web';

// Use throughout app
if (isNative) {
  // Use native camera
  await takePicture();
} else {
  // Use HTML5 file input
  const file = await pickFile();
}
```

**Conditional Feature Loading:**

```typescript
// src/hooks/useVoice.ts
import { isNative } from '@/lib/platform';
import { startRecording as nativeRecording } from '@/lib/capacitor/voice';
import { startRecording as webRecording } from '@/lib/web/voice';

export function useVoice() {
  const startRecording = isNative ? nativeRecording : webRecording;
  const stopRecording = isNative ? nativeStopRecording : webStopRecording;
  
  return { startRecording, stopRecording };
}
```

---

### 6.4 Push Notification Backend

**API Endpoint:**

```typescript
// pages/api/push/send.ts (detailed implementation in section 2.1)
```

**Webhook from Container:**

```typescript
// OpenClaw container: ~/.clawd/skills/notify.sh
#!/bin/bash
# Triggered after agent completes task

AGENT_ID="$1"
TASK_TYPE="$2"
OUTPUT="$3"

curl -X POST https://api.clawer.ai/webhooks/agent-complete \
  -H "Content-Type: application/json" \
  -H "X-Container-Token: $CONTAINER_TOKEN" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"agentId\": \"$AGENT_ID\",
    \"taskType\": \"$TASK_TYPE\",
    \"output\": \"$OUTPUT\"
  }"
```

---

### 6.5 CI/CD Pipeline

**GitHub Actions Workflow:**

```yaml
# .github/workflows/mobile-deploy.yml
name: Mobile Deploy

on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'android/**'
      - 'ios/**'
      - 'capacitor.config.ts'

jobs:
  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Next.js
        run: npm run build
      
      - name: Sync Capacitor
        run: npx cap sync ios
      
      - name: Setup Fastlane
        run: |
          cd ios/App
          bundle install
      
      - name: Build & Upload to TestFlight
        env:
          MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
          FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD: ${{ secrets.FASTLANE_PASSWORD }}
        run: |
          cd ios/App
          bundle exec fastlane beta
  
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Next.js
        run: npm run build
      
      - name: Sync Capacitor
        run: npx cap sync android
      
      - name: Build & Upload to Play Console
        env:
          PLAY_STORE_JSON_KEY: ${{ secrets.PLAY_STORE_JSON_KEY }}
        run: |
          cd android
          bundle exec fastlane beta
```

**Fastlane Configuration (iOS):**

```ruby
# ios/App/fastlane/Fastfile
default_platform(:ios)

platform :ios do
  desc "Push a new beta build to TestFlight"
  lane :beta do
    # Increment build number
    increment_build_number(xcodeproj: "App.xcodeproj")
    
    # Match code signing
    match(type: "appstore", readonly: true)
    
    # Build
    build_app(
      scheme: "App",
      workspace: "App.xcworkspace",
      export_method: "app-store"
    )
    
    # Upload to TestFlight
    upload_to_testflight(
      skip_waiting_for_build_processing: true
    )
  end
  
  desc "Deploy to App Store"
  lane :release do
    # Same as beta, but:
    upload_to_app_store(
      submit_for_review: true,
      automatic_release: false,
      submission_information: {
        add_id_info_uses_idfa: false
      }
    )
  end
end
```

---

### 6.6 Analytics

**PostHog Integration:**

```typescript
// src/lib/analytics.ts
import posthog from 'posthog-js';

export function initAnalytics(userId: string) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    loaded: (posthog) => {
      posthog.identify(userId);
    },
  });
}

// Track events
export function trackEvent(event: string, properties?: Record<string, any>) {
  posthog.capture(event, properties);
}

// Usage
trackEvent('agent_interaction', {
  agentId: 'chief-of-staff',
  inputType: 'voice',
  responseTime: 2.3,
});

trackEvent('photo_captured', {
  photoType: 'homework',
  agentId: 'homework-helper',
});

trackEvent('paywall_shown', {
  source: 'message_limit',
  daysActive: 3,
});

trackEvent('purchase_completed', {
  product: 'pro_monthly_iap',
  price: 49.99,
  platform: 'ios',
});
```

**Key Events to Track:**

| **Event** | **Properties** | **Why Track** |
|-----------|----------------|---------------|
| `app_opened` | `source` (push, deep link, icon), `is_returning` | Understand acquisition channels |
| `onboarding_completed` | `team_selected`, `time_to_complete` | Optimize onboarding flow |
| `agent_interaction` | `agent_id`, `input_type` (text/voice/photo), `response_time` | Measure engagement, identify popular agents |
| `voice_used` | `agent_id`, `duration`, `transcription_success` | Voice adoption rate |
| `photo_captured` | `photo_type`, `agent_id`, `vision_confidence` | Photo feature usage |
| `paywall_shown` | `source`, `days_active`, `total_interactions` | Conversion funnel |
| `purchase_completed` | `product`, `price`, `platform` | Revenue tracking |
| `subscription_cancelled` | `reason`, `days_subscribed` | Churn analysis |

---

### 6.7 Crash Reporting (Sentry)

**Setup:**

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/react';
import { CaptureConsole } from '@sentry/integrations';

export function initSentry() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      new CaptureConsole({ levels: ['error'] }),
    ],
    tracesSampleRate: 0.1, // Sample 10% of transactions
    beforeSend(event, hint) {
      // Strip sensitive data
      if (event.request) {
        delete event.request.cookies;
      }
      return event;
    },
  });
}

// Capture custom errors
export function logError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: { custom: context },
  });
}
```

**Native Crash Reporting:**

```swift
// ios/App/App/AppDelegate.swift
import Sentry

func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    
    SentrySDK.start { options in
        options.dsn = "YOUR_SENTRY_DSN"
        options.environment = "production"
        options.tracesSampleRate = 0.1
    }
    
    return true
}
```

---

### 6.8 Performance Optimization

**WebView Optimization:**

```typescript
// capacitor.config.ts
server: {
  androidScheme: 'https', // Faster than 'http'
  iosScheme: 'capacitor',
  // Preload common routes
  cleartext: false,
},
plugins: {
  CapacitorHttp: {
    enabled: true, // Use native HTTP (faster than fetch)
  },
},
```

**Code Splitting:**

```javascript
// next.config.js
const nextConfig = {
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        // Split Capacitor plugins into separate bundle
        capacitor: {
          test: /[\\/]node_modules[\\/]@capacitor[\\/]/,
          name: 'capacitor',
          priority: 10,
        },
        // Split UI components
        commons: {
          name: 'commons',
          minChunks: 2,
          priority: 5,
        },
      },
    };
    return config;
  },
};
```

**Image Optimization:**

```typescript
// Compress images before upload
async function optimizeImage(dataUrl: string): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  
  await new Promise(resolve => img.onload = resolve);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Max width 1200px
  const maxWidth = 1200;
  const scale = Math.min(1, maxWidth / img.width);
  
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  return canvas.toDataURL('image/jpeg', 0.8); // 80% quality
}
```

---

### 6.9 Testing Strategy

**E2E Testing (Detox):**

```javascript
// e2e/onboarding.test.js
describe('Onboarding Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });
  
  it('should complete onboarding and send first message', async () => {
    // Welcome screen
    await expect(element(by.id('welcome-title'))).toBeVisible();
    await element(by.id('get-started-btn')).tap();
    
    // Team selection
    await element(by.id('team-lifeos')).tap();
    await element(by.id('continue-btn')).tap();
    
    // Skip agent intros
    await element(by.id('skip-intros-btn')).tap();
    
    // Skip permissions
    await element(by.id('skip-permissions-btn')).tap();
    
    // First task
    await element(by.id('message-input')).typeText('What should I focus on today?');
    await element(by.id('send-btn')).tap();
    
    // Verify agent response
    await waitFor(element(by.id('agent-response'))).toBeVisible().withTimeout(10000);
  });
});
```

---

## 7. Timeline & Phases

### Phase 1: Foundation (Week 1-2)

**Goal:** Capacitor wrapper working with push notifications and voice MVP

| **Week** | **Deliverable** | **Owner** | **Est. Hours** |
|----------|----------------|-----------|----------------|
| Week 1 | Capacitor project scaffolded, Next.js static export working in iOS simulator + Android emulator | Frontend | 16h |
| Week 1 | Push notification registration (device token → backend → FCM/APNs) | Backend | 12h |
| Week 1 | Clerk auth working in webview context, token persistence | Frontend | 8h |
| Week 2 | Voice input MVP: hold-to-talk → Whisper STT → inject into chat | Frontend + Backend | 20h |
| Week 2 | Container webhook → push notification pipeline (agent complete, cron results) | Backend | 16h |
| Week 2 | Deep linking (clawer:// scheme, universal links) | Frontend | 8h |

**Milestone:** App opens, user can sign in, receive push notifications, send voice messages to agents.

**Risks:**
- **Clerk in webview quirks** — Clerk's JS SDK may have issues in Capacitor's WKWebView. *Mitigation:* Test early (Day 1), have fallback to custom JWT auth if needed.
- **Push notification certificate setup** — Apple provisioning profiles are painful. *Mitigation:* Use Expo's push service or OneSignal as abstraction layer.

---

### Phase 2: Native Features + UX (Week 3-4)

| **Week** | **Deliverable** | **Owner** | **Est. Hours** |
|----------|----------------|-----------|----------------|
| Week 3 | Camera integration (photo capture → agent attachment) | Frontend | 12h |
| Week 3 | Share Extension (iOS) + Share Target (Android) | Native | 16h |
| Week 3 | Bottom tab navigation, activity feed page | Frontend | 16h |
| Week 4 | Team grid view with agent status indicators | Frontend | 12h |
| Week 4 | Haptic feedback throughout app | Frontend | 4h |
| Week 4 | Biometric auth (Face ID / fingerprint lock) | Frontend | 8h |
| Week 4 | Mobile chat UX overhaul (input bar, quick actions) | Frontend | 16h |

**Milestone:** App feels native — bottom tabs, haptics, camera, share sheet, biometric lock.

**Risks:**
- **Share Extension complexity** — iOS Share Extensions run in a separate process with limited memory. *Mitigation:* Keep extension minimal (store to app group, open main app).
- **WebView performance** — Complex UI may feel sluggish vs native. *Mitigation:* Profile early, optimize critical paths, use native HTTP plugin.

---

### Phase 3: Parent Command Center + Polish (Week 5-6)

| **Week** | **Deliverable** | **Owner** | **Est. Hours** |
|----------|----------------|-----------|----------------|
| Week 5 | Photo homework flow (camera → vision → tutoring response) | Full Stack | 16h |
| Week 5 | School flyer parsing (OCR → calendar integration) | Backend | 12h |
| Week 5 | Meal planning with fridge photo | Backend | 12h |
| Week 5 | Continuous voice mode for hands-free interaction | Frontend | 12h |
| Week 6 | iOS home screen widget (agent status) | Native (Swift) | 16h |
| Week 6 | App Store assets (screenshots, description, metadata) | Design | 12h |
| Week 6 | TestFlight build + internal testing | DevOps | 8h |
| Week 6 | Onboarding flow (team selection → agent intros) | Frontend | 12h |

**Milestone:** Parent Command Center features working, TestFlight build ready for beta testers.

**Risks:**
- **Vision API costs** — GPT-4V is expensive per image. *Mitigation:* Compress images aggressively, cache results, consider Moondream for simple OCR tasks.
- **Widget data freshness** — iOS limits widget refresh to ~15min intervals. *Mitigation:* Use push-triggered widget updates for urgent items.

---

### Phase 4: Beta + Launch (Week 7-8)

| **Week** | **Deliverable** | **Owner** | **Est. Hours** |
|----------|----------------|-----------|----------------|
| Week 7 | TestFlight beta (50 users), collect feedback | All | 20h |
| Week 7 | Bug fixes from beta feedback | All | 24h |
| Week 7 | RevenueCat IAP integration + paywall | Frontend + Backend | 16h |
| Week 7 | Capgo live update pipeline | DevOps | 8h |
| Week 8 | App Store submission (iOS) | DevOps | 4h |
| Week 8 | Play Store submission (Android) | DevOps | 4h |
| Week 8 | ASO optimization (based on beta data) | Marketing | 8h |
| Week 8 | CI/CD pipeline (Fastlane + GitHub Actions) | DevOps | 12h |
| Week 8 | Launch marketing (ProductHunt, Twitter, email) | Marketing | 8h |

**Milestone:** Apps live on both stores, IAP working, live updates pipeline operational.

**Risks:**
- **App Store rejection** — Apple may flag the "subscribe via web" button or thin content. *Mitigation:* Ensure IAP is prominent, don't explicitly direct users away from IAP. Have appeal ready.
- **Android WebView fragmentation** — Older Android WebViews may render differently. *Mitigation:* Target Android 12+ (API 31+), test on 3+ device models.

---

### Total Estimated Effort

| **Category** | **Hours** | **Cost (at $150/hr)** |
|--------------|-----------|----------------------|
| Frontend (React/Next.js) | 140h | $21,000 |
| Backend (API/webhooks) | 80h | $12,000 |
| Native (Swift/Kotlin) | 32h | $4,800 |
| DevOps (CI/CD, infra) | 32h | $4,800 |
| Design (assets, UX) | 24h | $3,600 |
| **Total** | **308h** | **$46,200** |

*Note: Solo developer estimate would be ~6-8 weeks full-time. Team of 2-3 could compress to 4-5 weeks.*

---

## 8. Competitive Positioning

### Feature Comparison Matrix

| **Feature** | **Clawer** | **QuickClaw** | **ChatGPT App** | **Standalone AI** |
|-------------|-----------|---------------|-----------------|-------------------|
| **AI Team (multiple agents)** | ✅ 3-5 per team | ❌ Single assistant | ❌ Single model | ❌ Single purpose |
| **Team Templates** | ✅ 8 templates | ❌ | ❌ | ❌ |
| **Automated Workflows (cron)** | ✅ Built-in | ❌ | ❌ | ❌ |
| **Immune System (reliability)** | ✅ Self-healing | ❌ | ❌ | ❌ |
| **Push Notifications** | ✅ Rich + actionable | ✅ Basic | ❌ | Varies |
| **Voice Input** | ✅ Hold-to-talk + continuous | ✅ | ✅ | Varies |
| **Camera / Photo Intelligence** | ✅ OCR, homework, receipts | ❌ | ✅ (GPT-4V) | Varies |
| **Share Extension** | ✅ Share to any agent | ❌ | ❌ | ❌ |
| **Widgets** | ✅ Agent status widget | ❌ | ❌ | Varies |
| **iOS** | ✅ | ✅ | ✅ | Varies |
| **Android** | ✅ | ❌ | ✅ | Varies |
| **Web** | ✅ | ❌ | ✅ | Varies |
| **Pricing** | $49/mo flat | Credit-based IAP | $20/mo (Plus) | Varies |
| **Offline** | Partial (cached) | ❌ | Partial | ❌ |
| **Family/Parent Features** | ✅ Full Command Center | ❌ | ❌ | ❌ |
| **Budget Controls** | ✅ Built-in | ❌ | ❌ | ❌ |
| **Output Verification** | ✅ Immune system | ❌ | ❌ | ❌ |
| **Deep Linking** | ✅ | ❌ | ✅ | Varies |
| **Live Updates (OTA)** | ✅ Capgo | ❌ (native) | ✅ | Varies |

### Why We Win Long-Term

**1. Depth vs Breadth**
QuickClaw is a polished single-assistant app. That's a shrinking market. As AI becomes commoditized, the value shifts from "access to AI" to "AI that does real work." Teams > solo agents.

**2. Platform Coverage**
QuickClaw is iOS-only. We're iOS + Android + Web from day one. That's 2x the addressable market.

**3. Automation Moat**
Cron jobs, webhooks, immune system — these are infrastructure features that take months to build. QuickClaw would need to rebuild their entire architecture to match.

**4. Parent Command Center**
No competitor has purpose-built parent features. This is a blue ocean niche with massive TAM (100M+ parents in the US alone).

**5. Web-to-Mobile Conversion**
Our web users become mobile users (and vice versa). QuickClaw has no web presence. We can acquire users via SEO/content and convert them to mobile power users.

### Positioning Statement

> **For busy professionals and parents** who need more than a chatbot,  
> **Clawer** is the **AI team platform** that gives you  
> **specialized agents working together** on your tasks.  
> **Unlike** ChatGPT or QuickClaw, which offer a single generic assistant,  
> **Clawer delivers** a complete team with automation, reliability, and native mobile integration.

### Head-to-Head: Clawer vs QuickClaw

| **Dimension** | **Clawer Wins** | **QuickClaw Wins** |
|---------------|-----------------|---------------------|
| Feature depth | ✅ Team, automation, reliability | |
| Platform coverage | ✅ iOS + Android + Web | |
| Parent features | ✅ Full Command Center | |
| Onboarding speed | | ✅ Simpler (1 assistant) |
| Native polish | | ✅ Full native app (for now) |
| Price sensitivity | | ✅ Pay-per-use option |
| Time to market | | ✅ Already launched |

**Strategy:** Don't compete on QuickClaw's terms (native polish, simple UX). Compete on our terms: **team depth, automation, reliability, parent features**. Our Capacitor wrapper gets us "good enough" native UX in 8 weeks, then we iterate.

---

## Appendix A: Database Schema Changes

```sql
-- New tables for mobile features

-- Device push tokens
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  platform VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android')),
  app_version VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_push_tokens_user (user_id)
);

-- Notification history
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  category VARCHAR(50), -- 'agent_output', 'cron_result', 'immune_alert', 'budget_warning'
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_notifications_user_unread (user_id, read_at)
);

-- IAP purchase records
CREATE TABLE iap_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  product_id VARCHAR(100) NOT NULL,
  platform VARCHAR(10) NOT NULL,
  receipt_data TEXT,
  credits_granted INTEGER,
  amount_cents INTEGER,
  currency VARCHAR(3) DEFAULT 'USD',
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_iap_user (user_id)
);

-- Message credit balance (for IAP users)
CREATE TABLE credit_balances (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Offline message queue (server-side backup)
CREATE TABLE offline_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  agent_id VARCHAR(100) NOT NULL,
  message_text TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  
  INDEX idx_offline_queue_pending (user_id, processed_at)
);
```

## Appendix B: API Endpoints (New for Mobile)

```
POST /api/push/register          — Register device push token
DELETE /api/push/unregister       — Remove device token
POST /api/push/send              — Internal: send push notification
GET  /api/notifications          — List user notifications (paginated)
PATCH /api/notifications/:id/read — Mark notification as read

POST /api/voice/transcribe       — Upload audio → return transcript
POST /api/vision/analyze         — Upload image → return extracted data

POST /api/purchases/validate     — Validate IAP receipt
GET  /api/purchases/credits      — Get remaining credit balance
POST /api/purchases/deduct       — Deduct credits for message

GET  /api/widgets/latest-activity — Widget data endpoint
GET  /api/agents/updates          — Background refresh: latest agent status

POST /api/webhooks/agent-complete — Container webhook: agent finished task
POST /api/webhooks/cron-result    — Container webhook: cron job completed
POST /api/webhooks/immune-alert   — Container webhook: immune system alert
```

---

*End of specification. This document should be treated as a living document — update as implementation progresses and decisions evolve.*
