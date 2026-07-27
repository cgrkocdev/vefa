# Vefa Bağış Yönetim Sistemi

Next.js, TypeScript ve Tailwind CSS ile geliştirilmiş, verilerini tamamen tarayıcıda saklayan bağış ve kurban yönetim paneli.

## Başlangıç

```bash
npm install
npm run dev
```

Veritabanı, migration veya ortam değişkeni gerekmez.

## Yerel giriş

- E-posta: `yonetici@vefa.org`
- Şifre: `Degistir123!`

## Veri saklama

Bağışlar, bağışçılar, kurban hisseleri, kullanıcılar, ayarlar ve mesaj kayıtları `localStorage` içinde tutulur. Oturum bilgisi sekme boyunca `sessionStorage` içinde saklanır.

Tarayıcı verileri temizlenirse kayıtlar silinir. Bu sürüm tek tarayıcı/tek cihaz kullanımına yöneliktir; farklı cihazlar arasında veri eşzamanlaması yapmaz.

## Kontroller

```bash
npm run lint
npm run typecheck
npm run build
```
