# Vefa Bağış Yönetimi

Veritabanı ve sunucu kurulumu gerektirmeyen, hızlı ve tarayıcı tabanlı bağış yönetim sistemi.

## Özellikler

- Bağışçıları telefon numarasıyla otomatik tanıma
- Ülkeye göre kurban hisse fiyatı ve otomatik sıra tahsisi
- Yedi hisse dolduğunda sonraki kurbana geçiş
- WhatsApp teşekkür mesajı hazırlama
- Kullanıcı ve işlem yapan personel kaydı
- Yazdırılabilir ve CSV olarak indirilebilir raporlar
- JSON veri yedeği
- Responsive kurumsal arayüz

## Çalıştırma

```bash
npm install
npm run dev
```

Üretim kontrolü:

```bash
npm run lint
npm run build
```

## Veri saklama

Tüm kayıtlar tarayıcının `localStorage` alanında tutulur. Sunucuya veya veritabanına veri gönderilmez. Farklı tarayıcılar ve cihazlar aynı kayıtları paylaşmaz. Tarayıcı verileri temizlenmeden önce Ayarlar ekranından JSON yedeği alınmalıdır.

Bu sürüm tek cihazlı kullanım için tasarlanmıştır. Merkezi kullanıcı doğrulaması, cihazlar arası eşzamanlama ve gerçek sunucu tarafı yetkilendirme gerektiren kullanımlarda bir sunucu/veritabanı katmanı eklenmelidir.
