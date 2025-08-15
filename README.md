For Turkish documentation, see [README.tr.md](README.tr.md)

# Structure Analysis API — English Documentation

## Contents

1. [Project Overview](#project-overview)
2. [Quickstart](#quickstart)
3. [Environment Variables (.env)](#environment-variables-env)
4. [File Structure](#file-structure)
5. [API Endpoint Reference](#api-endpoint-reference)
6. [Core Modules & Services](#core-modules--services)
7. [Security](#security)
8. [Performance & Scalability](#performance--scalability)
9. [Error Management and Logging](#error-management-and-logging)
10. [Developer Guide](#developer-guide)
11. [Frequently Asked Questions (FAQ)](#frequently-asked-questions-faq)
12. [Contribution & License](#contribution--license)

---

## Project Overview

**Structure Analysis API** is a RESTful service that analyzes software project dependencies, detects architectural types (monolithic, microservices, serverless, modular monolith, event-driven, cqrs, micro-frontend, hybrid, etc.), and generates improvement suggestions.

**Key capabilities:**
- Architecture detection (monolithic, microservices, serverless, modular monolith, event-driven, cqrs, micro-frontend, hybrid, etc.)
- Complexity score calculation based on folder structure, file tree, depth, complexity analysis, dependency analysis
- Dependency scanning and vulnerability reporting
- File upload, large archive processing (stream-based)
- JWT + CSRF based secure authentication (Access + Refresh token)

**Technology stack:** `Node.js (v18+)`, `TypeScript`, `Express`, `MongoDB (Mongoose)`, `Winston` (logging), `Multer` (uploads), `adm-zip`/`tar` (archive processing) / and more...

---

## Quickstart

### Prerequisites
- Node.js v18 or higher
- MongoDB 6.x or higher
- unzip/unrar helper packages (system-specific)

### Installation
```bash
git clone https://github.com/YakupHadutoglu/structure-analysis-api.git
cd structure-analysis-api
npm install
cp .env.example .env
# Edit .env content (listed below)
npm run dev
```

### Running the project (production)
```bash
    npm start => "start": "node --max-old-space-size=8192 dist/server.js",
    npm run dev => "dev": "node --inspect --max-old-space-size=8192 -r ts-node/register server.ts",
    npm run build => "build": "tsc -p"
```

---

## Environment Variables (.env)

Minimum required variables:
```
PORT=3000
NODE_ENV=devolopment
SECRET_KEY=YOUR_SECRET_KEY
MONGO_URL=YOUR_MONGO_URL
SALT_ROUNDS=10
ACCESS_SECRET=YOUR_ACCESS_SECRET
REFRESH_SECRET=YOUR_REFRESH_SECRET
```

`NOTE:` Use strong/long secret values for production; keep keys confidential.

---

## API Endpoint Reference

### Authentication
| Endpoint         | Method |        Auth         | Description                                      |
| ---------------- | -----: | :-----------------: | --------------------------------------------- |
| `/auth/register` |   POST |         ❌          | User registration (email, username, password)   |
| `/auth/login`    |   POST |         ❌          | Login; generates access + refresh token         |
| `/auth/logout`   |   POST |         ✅          | Terminates session, revokes refresh token       |
| `/token/refresh` |   POST | ✅ (refresh cookie) | Access token refresh                            |
| `/csrf-token`    |    GET |         ❌          | Get CSRF token (double submit)                  |

### Analysis
| Endpoint               | Method | Auth | Description                        |
| ---------------------- | -----: | :--: | ------------------------------- |
| `/analyzer/analyze`    |   POST |  ✅  | Upload and analyze project archive |
| `/analyzer/status/:id` |    GET |  ✅  | Get analysis status/results (currently unavailable) |
| `/analyzer/history`    |    GET |  ✅  | User's analysis history (currently unavailable) |

#### Example: Upload file and start analysis
```bash
curl -X POST "http://localhost:3000/analyzer/analyze" \
    POSTMAN RUNTİME
        Body => form-data
            Key => file | Value => your_project | Content type => application/zip
```

## Core Modules & Services

### File Processing
- **FileUploadController**: Receives archives via Multer, performs SHA-256 verification, applies path traversal control.
- **Supported archives:** `.zip`, `.tar`, `.tar.gz`, `.tgz`, `.rar` (only if extraction supported)
- **Features**: Stream-based processing up to 2GB limit, temporary directory cleanup.

### Zip/Tar Parser
- Stream-based extraction, MIME type control, parsing text-based files (js, ts, java, py, etc.).

### Architecture Detection (Architecture Detector)
- Indicator-based matching: file/folder names, dependency files (package.json, pom.xml, etc.), Docker/Compose presence, etc.
- Weighting and confidence coefficient calculation for each indicator.

### Complexity Analysis
- Metrics: totalFiles, maxDepth, complexityScore (0-100), overcrowdedFolders (30+ files), cyclomatic approximations (estimated based on lines/function count).
- Generate suggestions: `suggestions: string[]`.

### Dependency Analysis
- Supported package managers: npm/yarn (package.json), Maven (pom.xml), pip (requirements.txt), Gradle, composer, etc.
- CVE database mapping (local or 3rd-party DB integration - easily integrable - optional).

---
## Security

### Layered Security Approach
The application is designed with a multi-layered security model to minimize potential attack vectors on both client and server sides.

---

## Measures:

**JWT (JSON Web Token):**
- **Access Token**: Valid for 60 minutes.
- **Refresh Token**: Valid for 7 days, stored in HTTP-only + Secure flag cookie.
- Token signing with `jsonwebtoken` library, secret key in `.env`.
- API endpoint access validated via middleware.

**CSRF (Cross-Site Request Forgery) Protection:**
- Uses `csurf` middleware.
- Double-submit cookie + custom header method applied.
- CSRF token obtained from `/csrf-token` endpoint, sent with each request.

**Rate Limiting:**
- `express-rate-limit` for per-IP request limiting.
- Default limit: 20,000 requests in 15 minutes.
- Optimized against brute force/DDoS attacks.

**File Security:**
- `multer` for file uploads, MIME type/extension control mandatory.
- Dangerous extensions (`.exe`, `.sh`) automatically blocked.
- File paths normalized with `path` module against path traversal attacks.

**Input Sanitization:**
- `xss-clean` for XSS protection.
- `express-mongo-sanitize` prevents NoSQL injection.
- Additional `sanitizeRequest` middleware cleans body/query/params data.

**HTTP and Session Security:**
- `helmet` enforces Content Security Policy (CSP) and cross-origin policies.
- `express-session` manages sessions, enables Secure flag in production.
- `noCache` middleware prevents sensitive data caching in browsers.

**Logging and Monitoring:**
- `winston` and `morgan` for request/response logging.
- Daily log files rotated with `winston-daily-rotate-file`.
- Requesting IPs geolocated with `geoip-lite` and logged.

**Additional Security Measures:**
- HTTP headers hardened with `helmet`.
- JSON parsing with `body-parser` includes size limits.
- Unauthorized accesses logged and returned with appropriate HTTP codes.

## Performance & Scalability

### Optimizations
1. **Parallel File Processing**: Configurable concurrency limit (e.g. 50)
2. **Stream-Based Extraction**: Minimizes memory usage during archive extraction
3. **Memory Protection**: Maximum extracted content size (e.g. 5GB) and extraction timeout (120s)
4. **Job Queue**: Analyses processed in background workers (Redis/Bull/Bee-Queue integration recommended)
5. **Cache**: Artifact caching for repeated analyses (hash-based)

### Sample Performance Targets
- Average: ~300 files/second processing (hardware-dependent)
- Max concurrent analyses: hardware-dependent (horizontally scalable with producer/worker architecture)

---

## Error Management and Logging

### Error Codes
|  Code | Key                    | Description                          |
| ---: | -------------------------- | --------------------------------- |
| 1001 | INVALID_ARCHIVE            | Invalid archive format            |
| 2001 | ARCHITECTURE_UNKNOWN       | Architecture not detected         |
| 3001 | COMPLEXITY_CALC_FAILED     | Complexity calculation failed     |
| 4001 | DEPENDENCY_ANALYSIS_FAILED | Dependency analysis error         |

### Logging
- Winston + daily-rotate for log management
- Log levels: `error`, `warn`, `info`, `debug`
- Sample error log (JSON):
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
### Coding Standards

This project follows **SOLID principles**, **TypeScript strict mode**, and industry-standard rules for sustainability, readability, and maintainability.

---

### General Principles
- **SOLID Principles**:
  - **S**ingle Responsibility: Each class/function has single responsibility.
  - **O**pen/Closed: Code open for extension, closed for modification.
  - **L**iskov Substitution: Derived classes substitutable for base classes.
  - **I**nterface Segregation: Small purpose-specific interfaces over large ones.
  - **D**ependency Inversion: High-level modules not dependent on low-level modules.

- **Functions**: Short, readable, single-responsibility principle compliant.
- **Comments**: No unnecessary comments except complex algorithms. Self-explanatory code.
- **Magic Number/String**: Constants stored in `constants` or `config` files.

---

### TypeScript Standards
- **strict mode**: `strict: true` in `tsconfig.json`.
- **Type Safety**: No `any` type (with explanation if mandatory).
- **Interface & Type**: `interface` for API data structures, `type` for complex types.
- **Literal Union over Enum**: String literal union preferred over unnecessary enums.
- **Readonly**: `readonly` for immutable fields.
- **Optional Chaining & Nullish Coalescing**: Modern TS operators for null/undefined checks.

---

## Frequently Asked Questions (FAQ)

**Q:** I get `INVALID_ARCHIVE` error when uploading archive.
**A:** Archive type may be unsupported or corrupted. Common causes: oversized file (>2GB), encrypted archive, or tar/zip incompatibility.

**Q:** Analysis takes too long or times out.
**A:** Worker queue and higher resources needed for large projects. Check `EXTRACTION_TIMEOUT` and `CONCURRENCY_LIMIT` values.

**Q:** I get CSRF token error.
**A:** Get token from `/csrf-token` endpoint and add to `X-CSRF-Token` header; also check cookie sameSite/secure settings.

---

## Contribution & License
- **Contribution:** Fork → branch → commit → PR. Describe problem solved and testing in PR description.
- **Code Review:** Each PR requires at least one reviewer approval.

**License:** MIT © 2025 Structure Analysis - Yakup Hadutoğlu

---

## Appendices

### Real JSON Report (full)
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
            "✅ Your project shows strong Microservices Architecture.",
            "   \"To strengthen this architecture:",
            "   - Use API Gateway for inter-service communication",
            "   - Apply domain-driven design for service independence",
            "   - Use separate data stores for each service"
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
            "27 empty folders detected. Simplify project structure by removing them.",
            "High complexity score (100.00/100) may complicate project maintenance. Consider increasing modularization and abstraction levels.",
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
        "Project has very high complexity (100/100). Urgent refactoring needed, focus on modularization and separation of concerns.",
        "Project complexity (100/100) is high. Consider focusing more on modular structure and separation of concerns to facilitate future maintenance.",
        "Create \".gitignore\" file to avoid adding unnecessary files (e.g. node_modules, dist) to Git repositories."
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
