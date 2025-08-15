# Structure Analysis API — Türkçe Dökümantasyon

## İçindekiler

1. [Proje Genel Bakış](#proje-genel-bak%C4%B1%C5%9F)
2. [Hızlı Başlangıç (Quickstart)](#h%C4%B1zl%C4%B1-ba%C5%9Flang%C4%B1%C3%A7-quickstart)
3. [Ortam Değişkenleri (.env)](#ortam-de%C4%9Fi%C5%9Fkenleri-env)
4. [Dosya Yapısı](#dosya-yap%C4%B1s%C4%B1)
5. [API Endpoint Referansı](#api-endpoint-referans%C4%B1)
6. [Çekirdek Modüller & Servisler](#%C3%A7ekirdek-mod%C3%BCller--servisler)
7. [Güvenlik](#g%C3%BCvenlik)
8. [Performans & Ölçeklenebilirlik](#performans--%C3%B6l%C3%A7eklenebilirlik)
9. [Hata Yönetimi ve Loglama](#hata-y%C3%B6netimi-ve-loglama)
10. [Geliştirici Rehberi](#geli%C5%9Ftirme-rehberi)
11. [Sık Karşılaşılan Sorunlar (FAQ)](#s%C4%B1k-kar%C5%9F%C4%B1la%C5%9F%C4%B1lan-sorunlar-faq)
12. [Katkıda Bulunma & Lisans](#katk%C4%B1da-bulunma--lisans)

---

## Proje Genel Bakış

**Structure Analysis API**, yazılım projelerinin bağımlılıklarını analiz eden, mimari tiplerini (monolit, mikroservis, serverless, modüler monolit, event-driven, cqrs, micro-frontend, hybrid vb.) tespit eden ve iyileştirme önerileri üreten RESTful bir servistir.

**Ana yetenekler:**

- Mimari tespiti (monolit, mikroservis, serverless, modüler monolit, event-driven, cqrs, micro-frontend, hybrid vb.)
- Klasör yapısı, dosya ağacı, deriniği, karmaşıklık analizi, bağımlılık analizi üzerinden karmaşıklık skoru hesaplama
- Bağımlılık taraması ve güvenlik açıkları raporlama
- Dosya yükleme, büyük arşiv işleme (stream tabanlı)
- JWT + CSRF tabanlı güvenli kimlik doğrulama (Access + Refresh token)

**Teknoloji yığını:** `Node.js (v18+)`, `TypeScript`, `Express`, `MongoDB (Mongoose)`, `Winston` (loglama), `Multer` (yükleme), `adm-zip`/`tar` (arşiv işleme) / ve daha fazlası...

---

## Hızlı Başlangıç (Quickstart)

### Ön koşullar

- Node.js v18 veya üzeri
- MongoDB 6.x veya üzeri
- unzip / unrar yardımcı paketleri (sistem bazlı)

### Kurulum

```bash
git clone https://github.com/YakupHadutoglu/structure-analysis-api.git
cd structure-analysis-api
npm install
cp .env.example .env
# .env içeriğini düzenleyin (aşağıda listelenmiştir)
npm run dev
```

### Proje çalıştırma (production)

```bash
    npm start => "start": "node --max-old-space-size=8192 dist/server.js",
    npm run dev => "dev": "node --inspect --max-old-space-size=8192 -r ts-node/register server.ts",
    npm run build => "build": "tsc -p"
```

---

## Ortam Değişkenleri (.env)

Aşağıdaki değişkenler minimum gereklilerdir:

```
PORT=3000
NODE_ENV=devolopment
SECRET_KEY=YOUR_SECRET_KEY
MONGO_URL=YOUR_MONGO_URL
SALT_ROUNDS=10
ACCESS_SECRET=YOUR_ACCESS_SECRET
REFRESH_SECRET=YOUR_REFRESH_SECRET

```

`NOT:` Production ortamı için güçlü ve uzun secret değerleri kullanın; anahtarları gizli tutun.

---

## API Endpoint Referansı

### Kimlik Doğrulama

| Endpoint         | Method |        Auth         | Açıklama                                      |
| ---------------- | -----: | :-----------------: | --------------------------------------------- |
| `/auth/register` |   POST |         ❌          | Kullanıcı kaydı (email, username, password)   |
| `/auth/login`    |   POST |         ❌          | Giriş; access + refresh token üretir          |
| `/auth/logout`   |   POST |         ✅          | Oturumu sonlandırır, refresh token iptal eder |
| `/token/refresh` |   POST | ✅ (refresh cookie) | Access token yenileme                         |
| `/csrf-token`    |    GET |         ❌          | CSRF token alma (double submit)               |

### Analiz

| Endpoint               | Method | Auth | Açıklama                        |
| ---------------------- | -----: | :--: | ------------------------------- |
| `/analyzer/analyze`    |   POST |  ✅  | Proje arşivi yükle ve analiz et |
| `/analyzer/status/:id` |    GET |  ✅  | Analiz durumu / sonuçları alma (kolayca alınabilir şu anda mevcut değil)  |
| `/analyzer/history`    |    GET |  ✅  | Kullanıcının analiz geçmişi (kolayca entegre edilebilir, şu anda mevcut değil)    |

#### Örnek: Dosya yükleyip analiz başlatma

```bash
curl -X POST "http://localhost:3000/analyzer/analyze" \
    POSTMAN RUNTİME
        Body => form-data
            Key => file | Value => your_project | Content type => application/zip

```

## Çekirdek Modüller & Servisler

### Dosya İşleme

- **FileUploadController**: Multer ile gelen arşivleri alır, SHA-256 doğrulaması yapar, path traversal kontrolü uygular.
- **Desteklenen arşivler:** `.zip`, `.tar`, `.tar.gz`, `.tgz`, `.rar` (sadece ekstraksiyon destekleniyorsa)
- **Özellikler**: 2GB limite kadar stream tabanlı işleme, geçici dizin temizleme.

### Zip/Tar Parser

- Stream tabanlı çıkarma, dosya tipi MIME kontrolü, metin tabanlı dosyaları (js, ts, java, py vb.) parse etme.

### Mimari Tespit (Architecture Detector)

- Gösterge (indicator) tabanlı eşleştirme: dosya/klasör adları, bağımlılık dosyaları (package.json, pom.xml vs.), Docker/Compose varlığı vb.
- Her gösterge için ağırlıklandırma ve güven katsayısı hesaplama.

### Karmaşıklık Analizi

- Metrikler: totalFiles, maxDepth, complexityScore (0-100), overcrowdedFolders (30+ dosya), cyclomatic approximations (satır ve fonksiyon sayısına göre tahmini).
- Öneriler oluşturma: `suggestions: string[]`.

### Bağımlılık Analizi

- Desteklenen paket yöneticileri: npm/yarn (package.json), Maven (pom.xml), pip (requirements.txt), Gradle, composer vb.
- CVE veritabanı ile eşleme (local veya 3rd-party DB entegrasyonu - kolayca entegre edilebilir - opsiyonel).

---
## Güvenlik

### Katmanlı Güvenlik Yaklaşımı

Uygulama, çok katmanlı bir güvenlik modeli ile tasarlanmıştır. Amaç, hem istemci hem sunucu tarafında olası saldırı vektörlerini en aza indirmektir.

---

## Önlemler:

**JWT (JSON Web Token):**
- **Access Token**: 60 dakika geçerli.
- **Refresh Token**: 7 gün geçerli, HTTP-only ve Secure flag ile cookie’de saklanır.
- Token imzalama `jsonwebtoken` kütüphanesi ile yapılır, gizli anahtar `.env` dosyasında tutulur.
- API endpoint’lerine erişimde middleware ile doğrulama yapılır.

**CSRF (Cross-Site Request Forgery) Koruması:**
- `csurf` middleware’i kullanılır.
- Double-submit cookie + custom header yöntemi uygulanır.
- CSRF token `/csrf-token` endpoint’inden alınır, her istekle birlikte gönderilir.

**Rate Limiting:**
- `express-rate-limit` ile IP başına istek sayısı sınırlandırılır.
- Varsayılan olarak 15 dakika içinde 20.000 istek limiti uygulanır.
- Brute force ve DDoS saldırılarını engellemek için optimize edilmiştir.

**Dosya Güvenliği:**
- `multer` ile dosya yükleme yapılır, MIME tipi ve uzantı kontrolü zorunludur.
- `.exe`, `.sh` gibi tehlikeli uzantılar otomatik olarak engellenir.
- Path traversal saldırılarına karşı dosya yolları `path` modülü ile normalize edilir.

**Girdi Temizleme:**
- `xss-clean` ile XSS saldırılarına karşı koruma sağlanır.
- `express-mongo-sanitize` ile NoSQL injection önlenir.
- Ek olarak `sanitizeRequest` middleware’i ile body, query ve params verileri temizlenir.

**HTTP ve Session Güvenliği:**
- `helmet` ile Content Security Policy (CSP) ve cross-origin politikaları uygulanır.
- `express-session` ile session yönetimi yapılır, production’da Secure flag aktif edilir.
- `noCache` middleware’i ile hassas verilerin tarayıcıda cache’lenmesi engellenir.

**Loglama ve İzleme:**
- `winston` ve `morgan` ile request/response loglama yapılır.
- Günlük dosyaları `winston-daily-rotate-file` ile döngüsel olarak saklanır.
- İstek yapan IP’ler `geoip-lite` ile konumlandırılır ve loglanır.

**Ek Güvenlik Önlemleri:**
- HTTP header’lar `helmet` ile güçlendirilir.
- Tüm gelen JSON verisi `body-parser` ile parse edilirken boyut limitleri uygulanır.
- Yetkisiz erişimler merkezi hata yakalayıcı ile loglanır ve uygun HTTP kodları ile döndürülür.


## Performans & Ölçeklenebilirlik

### Optimizasyonlar

1. **Paralel Dosya İşleme**: Konfigüre edilebilir concurrency limit (ör. 50)
2. **Stream Tabanlı Çıkarma**: Arşiv çıkarma sırasında bellek kullanımı minimize edilir
3. **Bellek Koruması**: Maksimum çıkarılan içerik boyutu (ör. 5GB) ve extraction timeout (120s)
4. **İş Kuyruğu**: Analizler arka planda worker ile işlenir (Redis / Bull / Bee-Queue entegrasyonu önerilir)
5. **Cache**: Tekrarlanan analizlerde artifact caching (hash tabanlı)

### Örnek Performans Hedefleri

- Ortalama: \~300 dosya/saniye işleme (donanıma bağlı)
- Maks eşzamanlı analiz: donanıma göre (producer/worker mimarisi ile yatay ölçeklenebilir)

---

## Hata Yönetimi ve Loglama

### Hata Kodları

|  Kod | Anahtar                    | Açıklama                          |
| ---: | -------------------------- | --------------------------------- |
| 1001 | INVALID_ARCHIVE            | Geçersiz arşiv formatı            |
| 2001 | ARCHITECTURE_UNKNOWN       | Mimari tespit edilemedi           |
| 3001 | COMPLEXITY_CALC_FAILED     | Karmaşıklık hesaplama başarısız   |
| 4001 | DEPENDENCY_ANALYSIS_FAILED | Bağımlılık analizi sırasında hata |

### Loglama

- Winston + daily-rotate ile log yönetimi
- Log seviyeleri: `error`, `warn`, `info`, `debug`
- Hata log'u örneği (JSON):

```json
{
  "timestamp": "2025-08-15T10:30:00Z",
  "level": "error",
  "endpoint": "/analyzer/analyze",
  "errorCode": 1001,
  "userId": "user-123",
  "ip": "192.168.1.1",
  "context": { "jobId": "job_abc123" }
}
```

---
### Kodlama Standartları


Bu proje, sürdürülebilirlik, okunabilirlik ve bakım kolaylığı sağlamak için **SOLID prensipleri**, **TypeScript strict modu** ve endüstri standartlarına uygun kurallarla geliştirilmiştir.

---

### Genel İlkeler

- **SOLID Prensipleri**:
  - **S**ingle Responsibility: Her sınıf/fonksiyon tek bir sorumluluğa sahip olmalı.
  - **O**pen/Closed: Kod, genişletmeye açık, değiştirmeye kapalı olmalı.
  - **L**iskov Substitution: Türetilmiş sınıflar, base sınıfın yerine sorunsuzca kullanılabilmeli.
  - **I**nterface Segregation: Büyük interface’ler yerine küçük, amaca yönelik interface’ler kullanılmalı.
  - **D**ependency Inversion: Yüksek seviye modüller, düşük seviye modüllere doğrudan bağımlı olmamalı.

- **Fonksiyonlar**: Tek sorumluluk ilkesine uygun, kısa ve okunabilir olmalı.
- **Yorum Satırları**: Karmaşık algoritmalar dışında gereksiz yorum satırları eklenmemeli. Kod, kendi kendini açıklamalı.
- **Magic Number/String**: Sabitler `constants` veya `config` dosyalarında tutulmalı.

---

### TypeScript Standartları

- **strict mode**: `tsconfig.json` içinde `strict: true` aktif.
- **Tip Güvenliği**: `any` tipi kullanılmaz (zorunlu durumlarda açıklama ile).
- **Interface & Type**: API veri yapıları için `interface`, karmaşık tipler için `type` kullanılır.
- **Enum Yerine Literal Union**: Gereksiz enum kullanımı yerine string literal union tercih edilir.
- **Readonly**: Değiştirilmeyecek alanlar için `readonly` kullanılır.
- **Optional Chaining & Nullish Coalescing**: Null/undefined kontrolleri için modern TS operatörleri kullanılır.

---

## Sık Karşılaşılan Sorunlar (FAQ)

**Q:** Arşiv yüklediğimde `INVALID_ARCHIVE` hatası alıyorum.
**A:** Arşiv tipi desteklenmeyebilir veya bozuk olabilir. Ortak nedenler: çok büyük dosya (2GB üzeri), şifreli arşiv, veya tar/zip uyumsuzluğu.

**Q:** Analiz çok uzun sürüyor veya zaman aşımına uğruyor.
**A:** Büyük projeler için worker kuyruğu ve daha yüksek kaynaklar gerekir. `EXTRACTION_TIMEOUT` ve `CONCURRENCY_LIMIT` değerlerini kontrol edin.

**Q:** CSRF token hatası alıyorum.
**A:** `/csrf-token` endpoint'inden token alıp `X-CSRF-Token` header'ına eklemelisiniz; ayrıca cookie'nin sameSite ve secure ayarlarını kontrol edin.

---

## Katkıda Bulunma & Lisans

- **Katkıda bulunma:** Fork -> branch -> commit -> PR. Lütfen PR açıklamasında hangi problemin çözüldüğünü ve nasıl test edildiğini yazın.
- **Kod İnceleme:** Her PR en az bir reviewer tarafından onaylanmalı.

**Lisans:** MIT © 2025 Structure Analysis - Yakup Hadutoğlu

---

## Ekler

### Gerçek JSON Raporu (tam)

```json
    {
    "architecture": {
        "type": "microservices",
        "confidence": 63,
        "details": {
            "monolithic": 0,
            "modularMonolithic": 0,
            "microservices": 60,
            "serverless": 0,
            "eventDriven": 0,
            "cleanArch": 0,
            "cqrs": 0,
            "microFrontend": 0,
            "ddd": 0,
            "hybrid": 0
        },
        "matchedIndicators": {
            "monolithic": [],
            "modularMonolithic": [],
            "microservices": [
                "micro_multi_service_folders"
            ],
            "serverless": [],
            "eventDriven": [],
            "cleanArch": [],
            "cqrs": [],
            "microFrontend": [],
            "ddd": [],
            "hybrid": []
        },
        "suggestions": [
            "✅ Projeniz güçlü bir Mikroservis Mimarisi mimarisi gösteriyor.",
            "   \"Bu mimariyi güçlendirmek için:",
            "   - Servisler arası iletişim için API Gateway kullanın",
            "   - Servis bağımsızlığını artırmak için domain-driven design uygulayın",
            "   - Her servis için ayrı veri depoları kullanın"
        ]
    },
    "fileTree": {
        "README.md": {
            "type": "file",
            "size": 3674,
            "modified": "2025-08-07T17:20:10.000Z"
        },
        "package-lock.json": {
            "type": "file",
            "size": 817098,
            "modified": "2025-08-07T17:20:10.000Z"
        },
        "package.json": {
            "type": "file",
            "size": 1250,
            "modified": "2025-08-07T17:20:10.000Z"
        },
        "styleguide.config.js": {
            "type": "file",
            "size": 108,
            "modified": "2025-08-07T17:20:10.000Z"
        },
        "public": {
            "index.html": {
                "type": "file",
                "size": 1827,
                "modified": "2025-08-07T17:20:10.000Z"
            },
            "logo512.png": {
                "type": "file",
                "size": 9664,
                "modified": "2025-08-07T17:20:10.000Z"
            },
            "manifest.json": {
                "type": "file",
                "size": 399,
                "modified": "2025-08-07T17:20:10.000Z"
            },
            "robots.txt": {
                "type": "file",
                "size": 67,
                "modified": "2025-08-07T17:20:10.000Z"
            }
        },
        "src": {
            "App.js": {
                "type": "file",
                "size": 2697,
                "modified": "2025-08-07T17:20:10.000Z"
            },
            "App.scss": {
                "type": "file",
                "size": 2629,
                "modified": "2025-08-07T17:20:10.000Z"
            },
            "App.test.js": {
                "type": "file",
                "size": 246,
                "modified": "2025-08-07T17:20:10.000Z"
            },
            "firebase.js": {
                "type": "file",
                "size": 543,
                "modified": "2025-08-07T17:20:10.000Z"
            },
            "index.js": {
                "type": "file",
                "size": 506,
                "modified": "2025-08-07T17:20:10.000Z"
            },
            "index.scss": {
                "type": "file",
                "size": 368,
                "modified": "2025-08-07T17:20:10.000Z"
            },
            "reportWebVitals.js": {
                "type": "file",
                "size": 362,
                "modified": "2025-08-07T17:20:10.000Z"
            },
            "setupTests.js": {
                "type": "file",
                "size": 241,
                "modified": "2025-08-07T17:20:10.000Z"
            },
            "Utils": {
                "Theme.js": {
                    "type": "file",
                    "size": 480,
                    "modified": "2025-08-07T17:20:10.000Z"
                }
            },
            "images": {
                "header.jpg": {
                    "type": "file",
                    "size": 1221877,
                    "modified": "2025-08-07T17:20:10.000Z"
                },
                "hotel1.jpg": {
                    "type": "file",
                    "size": 2116010,
                    "modified": "2025-08-07T17:20:10.000Z"
                },
                "hotel2.jpg": {
                    "type": "file",
                    "size": 1329847,
                    "modified": "2025-08-07T17:20:10.000Z"
                },
                "hotel3.jpg": {
                    "type": "file",
                    "size": 2030448,
                    "modified": "2025-08-07T17:20:10.000Z"
                },
                "hotel4.jpg": {
                    "type": "file",
                    "size": 1661811,
                    "modified": "2025-08-07T17:20:10.000Z"
                },
                "hotel5.jpg": {
                    "type": "file",
                    "size": 1944279,
                    "modified": "2025-08-07T17:20:10.000Z"
                },
                "hotel6.jpg": {
                    "type": "file",
                    "size": 3690047,
                    "modified": "2025-08-07T17:20:10.000Z"
                },
                "restaurant.jpg": {
                    "type": "file",
                    "size": 4064537,
                    "modified": "2025-08-07T17:20:10.000Z"
                },
                "room1.jpg": {
                    "type": "file",
                    "size": 1246675,
                    "modified": "2025-08-07T17:20:10.000Z"
                },
                "room2.jpg": {
                    "type": "file",
                    "size": 2291627,
                    "modified": "2025-08-07T17:20:10.000Z"
                }
            },
            "Layout": {
                "Footer": {
                    "Footer.js": {
                        "type": "file",
                        "size": 1341,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                },
                "Context": {
                    "RoomContext.js": {
                        "type": "file",
                        "size": 79,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                },
                "OurHotel": {
                    "OurHotel.js": {
                        "type": "file",
                        "size": 464,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                },
                "OurRooms": {
                    "OurRooms.js": {
                        "type": "file",
                        "size": 4033,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                },
                "Restaurants": {
                    "Restaurants.js": {
                        "type": "file",
                        "size": 963,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                },
                "Header": {
                    "Header.js": {
                        "type": "file",
                        "size": 570,
                        "modified": "2025-08-07T17:20:10.000Z"
                    },
                    "HeaderBooking.js": {
                        "type": "file",
                        "size": 409,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                }
            },
            "components": {
                "Arrow": {
                    "Arrow.js": {
                        "type": "file",
                        "size": 256,
                        "modified": "2025-08-07T17:20:10.000Z"
                    },
                    "Arrow.styles.js": {
                        "type": "file",
                        "size": 321,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                },
                "CarouselContainer": {
                    "Carousel.styles.js": {
                        "type": "file",
                        "size": 200,
                        "modified": "2025-08-07T17:20:10.000Z"
                    },
                    "CarouselContainer.js": {
                        "type": "file",
                        "size": 1985,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                },
                "Container": {
                    "Container.js": {
                        "type": "file",
                        "size": 473,
                        "modified": "2025-08-07T17:20:10.000Z"
                    },
                    "Container.styles.js": {
                        "type": "file",
                        "size": 699,
                        "modified": "2025-08-07T17:20:10.000Z"
                    },
                    "README.md": {
                        "type": "file",
                        "size": 118,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                },
                "Form": {
                    "Form.js": {
                        "type": "file",
                        "size": 4054,
                        "modified": "2025-08-07T17:20:10.000Z"
                    },
                    "Form.styles.js": {
                        "type": "file",
                        "size": 435,
                        "modified": "2025-08-07T17:20:10.000Z"
                    },
                    "FormImages.js": {
                        "type": "file",
                        "size": 890,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                },
                "H1": {
                    "H1.js": {
                        "type": "file",
                        "size": 338,
                        "modified": "2025-08-07T17:20:10.000Z"
                    },
                    "H1.styles.js": {
                        "type": "file",
                        "size": 793,
                        "modified": "2025-08-07T17:20:10.000Z"
                    },
                    "README.md": {
                        "type": "file",
                        "size": 119,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                },
                "H2": {
                    "H2.js": {
                        "type": "file",
                        "size": 520,
                        "modified": "2025-08-07T17:20:10.000Z"
                    },
                    "H2.styles.js": {
                        "type": "file",
                        "size": 510,
                        "modified": "2025-08-07T17:20:10.000Z"
                    },
                    "README.md": {
                        "type": "file",
                        "size": 120,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                },
                "Image": {
                    "Image.js": {
                        "type": "file",
                        "size": 129,
                        "modified": "2025-08-07T17:20:10.000Z"
                    },
                    "Image.styles.js": {
                        "type": "file",
                        "size": 404,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                },
                "ImageContainer": {
                    "ImageContainer.styles.js": {
                        "type": "file",
                        "size": 279,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                },
                "Input": {
                    "Input.js": {
                        "type": "file",
                        "size": 445,
                        "modified": "2025-08-07T17:20:10.000Z"
                    },
                    "Input.styles.js": {
                        "type": "file",
                        "size": 274,
                        "modified": "2025-08-07T17:20:10.000Z"
                    },
                    "README.md": {
                        "type": "file",
                        "size": 152,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                },
                "Li": {
                    "Li.js": {
                        "type": "file",
                        "size": 321,
                        "modified": "2025-08-07T17:20:10.000Z"
                    },
                    "Li.styles.js": {
                        "type": "file",
                        "size": 317,
                        "modified": "2025-08-07T17:20:10.000Z"
                    },
                    "README.md": {
                        "type": "file",
                        "size": 122,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                },
                "Navbar": {
                    "Nav.js": {
                        "type": "file",
                        "size": 1328,
                        "modified": "2025-08-07T17:20:10.000Z"
                    },
                    "SidebarData.js": {
                        "type": "file",
                        "size": 389,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                },
                "P": {
                    "P.js": {
                        "type": "file",
                        "size": 384,
                        "modified": "2025-08-07T17:20:10.000Z"
                    },
                    "P.styles.js": {
                        "type": "file",
                        "size": 474,
                        "modified": "2025-08-07T17:20:10.000Z"
                    },
                    "README.md": {
                        "type": "file",
                        "size": 115,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                },
                "Price": {
                    "Price.js": {
                        "type": "file",
                        "size": 189,
                        "modified": "2025-08-07T17:20:10.000Z"
                    },
                    "Price.styles.js": {
                        "type": "file",
                        "size": 513,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                },
                "TextContainer": {
                    "TextContainer.styles.js": {
                        "type": "file",
                        "size": 432,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                },
                "Weather": {
                    "Weather.js": {
                        "type": "file",
                        "size": 1098,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                },
                "Button": {
                    "Button.js": {
                        "type": "file",
                        "size": 506,
                        "modified": "2025-08-07T17:20:10.000Z"
                    },
                    "Button.styles.js": {
                        "type": "file",
                        "size": 688,
                        "modified": "2025-08-07T17:20:10.000Z"
                    },
                    "README.md": {
                        "type": "file",
                        "size": 280,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                }
            },
            "views": {
                "Booking": {
                    "Booking.js": {
                        "type": "file",
                        "size": 410,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                },
                "Home": {
                    "Home.js": {
                        "type": "file",
                        "size": 808,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                },
                "NotFound": {
                    "NotFound.js": {
                        "type": "file",
                        "size": 130,
                        "modified": "2025-08-07T17:20:10.000Z"
                    }
                }
            }
        }
    },
    "complexityReport": {
        "totalFiles": 83,
        "totalFolders": 30,
        "maxDepth": 12,
        "averageFilesPerFolder": 0,
        "complexityScore": 100,
        "rootLevelFiles": 0,
        "emptyFolders": 27,
        "deepNestedFolders": 0,
        "overcrowdedFolders": 0,
        "sparseFolders": 0,
        "folderSizeDistribution": {
            "empty": 31
        },
        "depthDistribution": {
            "1": 1,
            "2": 5,
            "3": 25
        },
        "suggestions": [
            "27 adet boş klasör tespit edildi. Bunları kaldırarak proje yapısını basitleştirebilirsiniz.",
            "Yüksek karmaşıklık skoru (100.00/100) proje bakımını zorlaştırabilir. Modülerleştirme ve soyutlama seviyelerini artırmayı düşünün.",
            "High complexity score (100.00/100) may impact maintainability. Consider increasing modularization and abstraction levels."
        ]
    },
    "namingProblems": {
        "errors": [],
        "warnings": [],
        "stats": {
            "totalFiles": 148,
            "validFiles": 148,
            "conventions": {
                "kebabCase": 0,
                "pascalCase": 0,
                "camelCase": 0,
                "snakeCase": 0,
                "upperSnake": 0,
                "unknown": 0
            }
        }
    },
    "suggestions": [
        "Proje genel olarak çok yüksek karmaşıklığa sahip (100/100). Acilen refactoring düşünülmeli, modülerizasyon ve sorumluluk ayrılığı prensiplerine odaklanılmalı.",
        "Proje karmaşıklığı (100/100) yüksek seviyede. Gelecekteki bakımı kolaylaştırmak için modüler yapılandırmaya ve sorumluluk ayrılığına daha fazla özen gösterilebilir.",
        "Git depolarına gereksiz dosyaları (örn: node_modules, dist) eklememek için bir \".gitignore\" dosyası oluşturun."
    ],
    "dependencyReport": {
        "technologies": [
            "Node.js",
            "JavaScript/TypeScript"
        ],
        "dependencies": [
            {
                "name": "@testing-library/jest-dom",
                "version": "^5.14.1",
                "type": "production"
            },
            {
                "name": "@testing-library/react",
                "version": "^11.2.7",
                "type": "production"
            },
            {
                "name": "@testing-library/user-event",
                "version": "^12.8.3",
                "type": "production"
            },
            {
                "name": "firebase",
                "version": "^8.9.1",
                "type": "production"
            },
            {
                "name": "lodash",
                "version": "^4.17.21",
                "type": "production",
                "vulnerability": {
                    "severity": "high",
                    "advisory": "Prototype Pollution vulnerability",
                    "patchedVersions": ">=4.17.12"
                }
            },
            {
                "name": "node-sass",
                "version": "^6.0.1",
                "type": "production"
            },
            {
                "name": "prop-types",
                "version": "^15.7.2",
                "type": "production"
            },
            {
                "name": "react",
                "version": "^17.0.2",
                "type": "production"
            },
            {
                "name": "react-calendar",
                "version": "^3.4.0",
                "type": "production"
            },
            {
                "name": "react-date-picker",
                "version": "^8.2.0",
                "type": "production"
            },
            {
                "name": "react-datepicker",
                "version": "^4.1.1",
                "type": "production"
            },
            {
                "name": "react-dom",
                "version": "^17.0.2",
                "type": "production"
            },
            {
                "name": "react-icons",
                "version": "^4.2.0",
                "type": "production"
            },
            {
                "name": "react-router-dom",
                "version": "^5.2.0",
                "type": "production"
            },
            {
                "name": "react-router-hash-link",
                "version": "^2.4.3",
                "type": "production"
            },
            {
                "name": "react-scripts",
                "version": "4.0.3",
                "type": "production"
            },
            {
                "name": "react-scroll",
                "version": "^1.8.2",
                "type": "production"
            },
            {
                "name": "styled-components",
                "version": "^5.3.0",
                "type": "production"
            },
            {
                "name": "web-vitals",
                "version": "^1.1.2",
                "type": "production"
            },
            {
                "name": "react-styleguidist",
                "version": "^11.1.7",
                "type": "development"
            }
        ],
        "packageManagers": [
            "npm"
        ],
        "buildTools": [],
        "ciTools": [],
        "securityAdvisories": [
            {
                "library": "lodash",
                "severity": "high",
                "advisory": "Prototype Pollution vulnerability",
                "affectedVersions": "^4.17.21",
                "patchedVersions": ">=4.17.12"
            }
        ],
        "framework": "React"
    },
    "performanceMetrics": {
        "totalTime": 33.5903340280056,
        "steps": {
            "inputProcessing": 0.13468101620674133,
            "treeGeneration": 13.487670004367828,
            "architectureAnalysis": 2.768766015768051,
            "complexityAnalysis": 3.2616460025310516,
            "dependencyAnalysis": 6.649125009775162,
            "namingCheck": 4.001998990774155,
            "suggestionGeneration": 3.0354859828948975
        }
    }
}
```
