# Vefa Bağış Yönetim Sistemi

Next.js, TypeScript, Tailwind CSS, Prisma ve PostgreSQL tabanlı bağış ve kurban yönetim paneli.

## Başlangıç

1. `.env.example` dosyasını `.env` olarak kopyalayın.
2. PostgreSQL bağlantı adresini ve `NEXTAUTH_SECRET` değerini düzenleyin.
3. Veritabanını hazırlayın:

```bash
npm run db:migrate
npm run db:seed
```

4. Uygulamayı çalıştırın:

```bash
npm run dev
```

## Komutlar

- `npm run dev`: Geliştirme sunucusu
- `npm run build`: Üretim derlemesi
- `npm run lint`: Kod kalite kontrolü
- `npm run typecheck`: TypeScript kontrolü
- `npm run db:generate`: Prisma istemcisini üretir
- `npm run db:migrate`: Geliştirme migrasyonu oluşturur
- `npm run db:seed`: Rol, izin, bağış türü, kurban ve ilk yönetici kayıtlarını oluşturur

## Mimari notlar

- `src/components/ui`: shadcn/ui yaklaşımıyla yeniden kullanılabilir arayüz temelleri
- `src/components/layout`: Panel kabuğu, sidebar ve header
- `src/lib`: doğrulama, yetki, biçimlendirme, authentication ve Prisma yardımcıları
- `prisma/schema.prisma`: kullanıcı, bağışçı, bağış, kurban hissesi, SMS ve denetim kayıtları
- `src/app/api/auth`: Auth.js/NextAuth credentials sağlayıcısı

Geliştirme ortamında SMS işlemleri `MockSmsProvider` üzerinden yürütülür ve gerçek gönderim yapılmaz.

İlk yönetici hesabı `yonetici@vefa.org` adresiyle oluşturulur. Şifre `.env`
dosyasındaki `SEED_ADMIN_PASSWORD` değerinden alınır ve ilk girişten sonra
değiştirilmelidir.
