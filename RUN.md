# Futtatás

Expo SDK 58, React Native. A `node_modules` és a generált `android` / `ios` mappa nincs a repóban.

## Előkészítés

```bash
npm install
```

## Web

```bash
npm run web
```

Megnyílik a `http://localhost:8081` címen. A képernyő 430 px széles oszlopban jelenik meg.

## Android

Android Studio, SDK és JDK 17 kell. Emulátor vagy USB-n hibakeresésre engedélyezett telefon.

```bash
npm run android
```

Az első futás legenerálja az `android` mappát, lefordítja a debug APK-t, és telepíti a csatlakoztatott készülékre. Ha több eszköz van, Expo megkérdezi, melyikre menjen.

## iOS

macOS és Xcode kell.

```bash
npm run ios
```

## Dev szerver

```bash
npm start
```

Innen a `w`, `a` és `i` billentyű indítja a webet, az Androidot és az iOS-t.
