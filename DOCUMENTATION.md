# BarRoster — Dokumentacja projektu

> System zarządzania personelem i zmianami dla barów i restauracji.

---

## Spis treści

1. [Ogólny przegląd](#1-ogólny-przegląd)
2. [Architektura projektu](#2-architektura-projektu)
3. [Uruchomienie lokalne](#3-uruchomienie-lokalne)
4. [Uruchomienie przez Docker](#4-uruchomienie-przez-docker)
5. [Zmienne środowiskowe](#5-zmienne-środowiskowe)
6. [Baza danych — modele](#6-baza-danych--modele)
7. [API — wszystkie endpointy](#7-api--wszystkie-endpointy)
8. [System ról i uprawnień](#8-system-ról-i-uprawnień)
9. [Logika biznesowa](#9-logika-biznesowa)
10. [Frontend — strony](#10-frontend--strony)
11. [Frontend — klient API](#11-frontend--klient-api)
12. [Typy TypeScript](#12-typy-typescript)
13. [Dane demonstracyjne](#13-dane-demonstracyjne)

---

## 1. Ogólny przegląd

BarRoster — system SaaS dla branży gastronomicznej (bary, restauracje). Umożliwia:

- Zarządzanie wieloma oddziałami
- Prowadzenie ewidencji pracowników (Employment + Compensation)
- Planowanie i potwierdzanie zmian (Shifts)
- Śledzenie obecności (check-in / check-out)
- Obsługę wniosków urlopowych z wykrywaniem konfliktów
- Generowanie rozliczeń wynagrodzeń (stawka godzinowa, stała, per zmiana)
- Prowadzenie pełnego dziennika audytu
- Wysyłanie powiadomień (prywatnych i globalnych)

---

## 2. Architektura projektu

```
barroster-app/
├── apps/
│   ├── api/                    # Django REST API
│   │   ├── config/             # settings.py, urls.py, wsgi.py, permissions.py
│   │   ├── users/              # Własny model użytkownika
│   │   ├── branches/           # Oddziały
│   │   ├── employment/         # Zatrudnienie i wynagrodzenia
│   │   ├── shifts/             # Zmiany i przypisania
│   │   ├── leave_requests/     # Wnioski urlopowe
│   │   ├── payroll/            # Rozliczanie wynagrodzeń
│   │   ├── audit_log/          # Dziennik działań
│   │   ├── notifications/      # Powiadomienia
│   │   └── requirements.txt
│   └── web/                    # React + TypeScript SPA
│       └── src/
│           ├── api/            # Klienty HTTP
│           ├── components/     # Komponenty UI
│           ├── contexts/       # React Context (Auth, Toast, Theme)
│           ├── hooks/          # Hooki (useRole, useBranches, ...)
│           ├── pages/          # Strony aplikacji
│           ├── types/          # Typy TypeScript
│           └── utils/          # format.ts, ui.ts
├── docker-compose.yml
├── .env                        # Zmienne środowiskowe (nie w git)
└── .dockerignore
```

**Stos technologiczny:**

| Warstwa | Technologia |
|---|---|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4, React Router v7 |
| Backend | Django 5, Django REST Framework, SimpleJWT |
| Baza danych | PostgreSQL (produkcja), SQLite (lokalne dev) |
| Infrastruktura | Docker, nginx, gunicorn |
| Monorepo | pnpm workspaces, Turborepo |

---

## 3. Uruchomienie lokalne

### Wymagania
- Python 3.12+
- Node.js 20+
- pnpm (`npm install -g pnpm`)

### Backend

```bash
cd apps/api
cp .env.example .env        # skonfiguruj według potrzeb
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo  # dane demo (opcjonalnie)
python manage.py runserver
```

API: `http://localhost:8000`

### Frontend

```bash
# z katalogu głównego projektu
pnpm install
pnpm --filter @barroster/web dev
```

Frontend: `http://localhost:5173`

---

## 4. Uruchomienie przez Docker

```bash
# 1. Utwórz plik .env w katalogu głównym projektu
SECRET_KEY=your-secret-key-here
POSTGRES_PASSWORD=your-db-password

# 2. Uruchom
docker compose up --build -d

# 3. Załaduj dane demo (pierwsze uruchomienie)
docker compose exec api python manage.py seed_demo
```

Otwórz: `http://localhost`

**Przydatne komendy:**

```bash
docker compose down            # zatrzymaj
docker compose up -d           # uruchom (bez rebuild)
docker compose logs -f api     # logi backendu
docker compose logs -f web     # logi nginx
```

---

## 5. Zmienne środowiskowe

Plik `apps/api/.env` (lub zmienne kontenera):

| Zmienna | Domyślna | Opis |
|---|---|---|
| `SECRET_KEY` | `django-insecure-...` | Django secret key — **obowiązkowo zmienić** |
| `DATABASE_URL` | SQLite | `postgres://user:pass@host:5432/db` |
| `DEBUG` | auto | `true` / `false` |
| `ALLOWED_HOSTS` | `127.0.0.1,localhost` | Oddzielone przecinkiem |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Oddzielone przecinkiem |
| `JWT_ACCESS_MINUTES` | `60` | Czas życia access tokena |
| `JWT_REFRESH_DAYS` | `30` | Czas życia refresh tokena |
| `POSTGRES_PASSWORD` | `barroster_dev` | Hasło PostgreSQL (docker-compose) |
| `PORT` | `80` | Port kontenera web |
| `SECURE_SSL_REDIRECT` | `true` | Przekierowanie HTTP→HTTPS (gdy DEBUG=false) |

---

## 6. Baza danych — modele

### users.User

Własny model — używa email zamiast username.

| Pole | Typ | Opis |
|---|---|---|
| `id` | UUID | Klucz główny |
| `email` | EmailField (unique) | Login |
| `first_name` | CharField(100) | Imię |
| `last_name` | CharField(100) | Nazwisko |
| `phone` | CharField(30) | Telefon (opcjonalne) |
| `created_at` | DateTimeField | Data rejestracji |

---

### branches.Branch

| Pole | Typ | Opis |
|---|---|---|
| `id` | UUID | |
| `name` | CharField(150) | Nazwa oddziału |
| `address` | TextField | Adres |
| `status` | CharField | `active` / `inactive` / `maintenance` |
| `created_at` | DateTimeField | |

---

### employment.Employment

Powiązanie między użytkownikiem a oddziałem.

| Pole | Typ | Opis |
|---|---|---|
| `id` | UUID | |
| `user` | FK → User | |
| `branch` | FK → Branch | |
| `position` | CharField(100) | Stanowisko (dowolny tekst) |
| `role` | CharField | `owner` / `manager` / `supervisor` / `staff` |
| `hire_date` | DateField | Data zatrudnienia |
| `end_date` | DateField | Data zwolnienia (opcjonalne) |
| `status` | CharField | `active` / `terminated` / `suspended` |
| `termination_reason` | TextField | Powód zwolnienia (opcjonalne) |

**Ograniczenie:** unikalna para (user, branch, hire_date).

---

### employment.Compensation

Warunki wynagrodzenia dla konkretnego zatrudnienia.

| Pole | Typ | Opis |
|---|---|---|
| `id` | UUID | |
| `employment` | FK → Employment | |
| `payment_type` | CharField | `hourly` / `monthly` / `shift_based` |
| `hourly_rate` | Decimal(10,2) | Stawka godzinowa (dla hourly/shift_based) |
| `base_salary` | Decimal(10,2) | Wynagrodzenie podstawowe (dla monthly) |
| `bonus_type` | CharField | `none` / `fixed` / `percent` |
| `bonus_value` | Decimal(10,2) | Wartość premii |
| `effective_from` | DateField | Od kiedy obowiązuje |
| `effective_to` | DateField | Do kiedy obowiązuje (opcjonalne) |

---

### shifts.Shift

| Pole | Typ | Opis |
|---|---|---|
| `id` | UUID | |
| `branch` | FK → Branch | |
| `created_by` | FK → User | |
| `start_time` | DateTimeField | Początek zmiany (UTC) |
| `end_time` | DateTimeField | Koniec zmiany (UTC) |
| `status` | CharField | `planned` / `confirmed` / `completed` / `cancelled` |
| `note` | TextField | Notatka (opcjonalne) |

---

### shifts.ShiftAssignment

Przypisanie konkretnego pracownika do zmiany.

| Pole | Typ | Opis |
|---|---|---|
| `id` | UUID | |
| `shift` | FK → Shift | |
| `user` | FK → User | |
| `status` | CharField | `assigned` / `accepted` / `rejected` |
| `start_time` | DateTimeField | Rzeczywisty początek (opcjonalne, nadpisuje shift) |
| `end_time` | DateTimeField | Rzeczywisty koniec (opcjonalne) |
| `check_in_time` | DateTimeField | Godzina przyjścia (opcjonalne) |
| `check_out_time` | DateTimeField | Godzina wyjścia (opcjonalne) |

**Ograniczenie:** każdy użytkownik może być przypisany do zmiany tylko raz.

---

### leave_requests.LeaveRequest

| Pole | Typ | Opis |
|---|---|---|
| `id` | UUID | |
| `user` | FK → User | |
| `employment` | FK → Employment | opcjonalne |
| `leave_type` | CharField | `day_off` / `vacation` / `sick_leave` |
| `start_date` | DateField | |
| `end_date` | DateField | |
| `reason` | TextField | opcjonalne |
| `status` | CharField | `pending` / `approved` / `rejected` / `cancelled` |
| `reviewed_by` | FK → User | Kto sprawdził (opcjonalne) |
| `reviewed_at` | DateTimeField | opcjonalne |

---

### payroll.PayrollPeriod

| Pole | Typ | Opis |
|---|---|---|
| `id` | UUID | |
| `branch` | FK → Branch | null = wszystkie oddziały |
| `frequency` | CharField | `weekly` / `biweekly` / `monthly` |
| `start_date` / `end_date` | DateField | Zakres dat |
| `status` | CharField | `draft` / `approved` / `paid` |
| `created_by` | FK → User | |
| `approved_by` | FK → User | opcjonalne |
| `approved_at` / `paid_at` | DateTimeField | opcjonalne |

---

### payroll.PayrollRecord

Obliczony zapis dla jednego pracownika w jednym okresie.

| Pole | Typ | Opis |
|---|---|---|
| `id` | UUID | |
| `period` | FK → PayrollPeriod | |
| `employment` | FK → Employment | |
| `compensation` | FK → Compensation | opcjonalne (snapshot) |
| `hours_worked` | Decimal(8,2) | Przepracowane godziny |
| `shifts_count` | PositiveInteger | Liczba zmian |
| `base_amount` | Decimal(12,2) | Wynagrodzenie podstawowe |
| `bonus_amount` | Decimal(12,2) | Premia |
| `total_amount` | Decimal(12,2) | Kwota łączna |

---

### audit_log.AuditLog

Pełna historia działań w systemie.

| Pole | Typ | Opis |
|---|---|---|
| `user` | FK → User | Kto wykonał (opcjonalne) |
| `action` | CharField | Kod działania (28 wariantów) |
| `resource_type` | CharField | Typ obiektu (branch, shift, ...) |
| `resource_id` | CharField | ID obiektu |
| `resource_name` | CharField | Nazwa obiektu |
| `metadata` | JSONField | Dodatkowe dane |
| `ip_address` | GenericIPAddressField | opcjonalne |
| `created_at` | DateTimeField | |

**Śledzone działania:**
`branch_created/updated/deleted`, `employment_created/updated/deleted`,
`shift_created/updated/cancelled`, `assignment_created/removed/checked_in/checked_out`,
`leave_created/approved/rejected/cancelled`,
`payroll_created/generated/approved/paid`

---

### notifications.Notification

| Pole | Typ | Opis |
|---|---|---|
| `user` | FK → User | null = globalne |
| `scope` | CharField | `private` / `global` |
| `type` | CharField | Typ powiadomienia |
| `title` | CharField(256) | Tytuł |
| `body` | TextField | Treść |
| `resource_type` / `resource_id` | CharField | Odniesienie do obiektu |
| `read_at` | DateTimeField | opcjonalne |

---

## 7. API — wszystkie endpointy

### Uwierzytelnianie

| Metoda | URL | Opis |
|---|---|---|
| POST | `/api/auth/login/` | Logowanie → access + refresh token |
| POST | `/api/auth/refresh/` | Odśwież access token |
| POST | `/api/auth/register/` | Rejestracja nowego użytkownika |
| GET | `/api/auth/me/` | Aktualny użytkownik |
| PATCH | `/api/auth/me/` | Aktualizuj profil (imię, telefon) |
| POST | `/api/auth/change-password/` | Zmień hasło |

### Użytkownicy

| Metoda | URL | Opis |
|---|---|---|
| GET | `/api/users/` | Lista wszystkich użytkowników |

### Oddziały

| Metoda | URL | Dostęp | Opis |
|---|---|---|---|
| GET | `/api/branches/` | Wszyscy | Lista oddziałów |
| POST | `/api/branches/` | Owner | Utwórz oddział |
| GET | `/api/branches/{id}/` | Wszyscy | Szczegóły oddziału |
| PATCH | `/api/branches/{id}/` | Owner | Zaktualizuj oddział |
| DELETE | `/api/branches/{id}/` | Owner | Usuń oddział |

### Zatrudnienie

| Metoda | URL | Dostęp | Opis |
|---|---|---|---|
| GET | `/api/employments/` | Wszyscy | Lista (`?branch={id}`) |
| POST | `/api/employments/` | Manager+ | Utwórz |
| GET | `/api/employments/{id}/` | Wszyscy | Szczegóły |
| PATCH | `/api/employments/{id}/` | Manager+ | Zaktualizuj |
| DELETE | `/api/employments/{id}/` | Manager+ | Usuń |
| POST | `/api/compensations/` | Manager+ | Dodaj wynagrodzenie |
| PATCH | `/api/compensations/{id}/` | Manager+ | Zaktualizuj wynagrodzenie |
| DELETE | `/api/compensations/{id}/` | Manager+ | Usuń wynagrodzenie |

### Zmiany

| Metoda | URL | Dostęp | Opis |
|---|---|---|---|
| GET | `/api/shifts/` | Wszyscy | Lista zmian |
| POST | `/api/shifts/` | Manager+ | Utwórz zmianę |
| GET | `/api/shifts/{id}/` | Wszyscy | Szczegóły + przypisania + konflikty |
| PATCH | `/api/shifts/{id}/` | Manager+ | Zaktualizuj / zmień status |
| DELETE | `/api/shifts/{id}/` | Manager+ | Anuluj zmianę |
| POST | `/api/shift-assignments/` | Manager+ | Przypisz pracownika |
| PATCH | `/api/shift-assignments/{id}/` | Manager+ | Zaktualizuj (start/end/check-in/out) |
| DELETE | `/api/shift-assignments/{id}/` | Manager+ | Usuń przypisanie |

### Urlopy

| Metoda | URL | Dostęp | Opis |
|---|---|---|---|
| GET | `/api/leave-requests/` | Wszyscy | Lista (`?status=`, `?date=`) |
| POST | `/api/leave-requests/` | Wszyscy | Złóż wniosek |
| GET | `/api/leave-requests/{id}/` | Wszyscy | Szczegóły |
| PATCH | `/api/leave-requests/{id}/` | Manager+ | Edytuj |
| DELETE | `/api/leave-requests/{id}/` | Manager+ | Usuń |
| POST | `/api/leave-requests/{id}/approve/` | Manager+ | Zatwierdź |
| POST | `/api/leave-requests/{id}/reject/` | Manager+ | Odrzuć |
| POST | `/api/leave-requests/{id}/cancel/` | Manager+ | Anuluj |

### Wynagrodzenia

| Metoda | URL | Dostęp | Opis |
|---|---|---|---|
| GET | `/api/payroll-periods/` | Manager+ | Lista (`?status=`, `?branch=`, `?from_date=`, `?to_date=`) |
| POST | `/api/payroll-periods/` | Manager+ | Utwórz okres |
| GET | `/api/payroll-periods/{id}/` | Manager+ | Szczegóły + zapisy |
| DELETE | `/api/payroll-periods/{id}/` | Manager+ | Usuń |
| POST | `/api/payroll-periods/{id}/generate/` | Manager+ | Generuj zapisy |
| POST | `/api/payroll-periods/{id}/approve/` | Manager+ | Zatwierdź |
| POST | `/api/payroll-periods/{id}/mark_paid/` | Manager+ | Oznacz jako wypłacone |
| GET | `/api/payroll-records/` | Manager+ | Lista zapisów (`?period={id}`) |
| GET | `/api/payroll-records/{id}/` | Manager+ | Szczegóły zapisu |

### Audyt i powiadomienia

| Metoda | URL | Dostęp | Opis |
|---|---|---|---|
| GET | `/api/audit-logs/` | Manager+ | Dziennik działań |
| GET | `/api/notifications/` | Wszyscy | Powiadomienia aktualnego użytkownika |
| GET | `/api/notifications/unread_count/` | Wszyscy | Liczba nieprzeczytanych |
| POST | `/api/notifications/{id}/mark_read/` | Wszyscy | Oznacz jako przeczytane |
| POST | `/api/notifications/mark_all_read/` | Wszyscy | Wszystkie przeczytane |
| POST | `/api/notifications/broadcast/` | Manager+ | Globalne ogłoszenie |
| GET | `/api/reports/hours/` | Wszyscy | Raport godzin (`?from_date=`, `?to_date=`, `?branch=`) |
| GET | `/` | — | Health check |

---

## 8. System ról i uprawnień

### Hierarchia ról

```
Owner      (4)  — pełny dostęp, zarządzanie oddziałami
Manager    (3)  — zarządzanie personelem, zmianami, wynagrodzeniami
Supervisor (2)  — odczyt wszystkiego, ograniczony zapis
Staff      (1)  — tylko własne: zmiany, urlopy, profil
```

Rola jest określana jako **najwyższa** spośród wszystkich aktywnych zatrudnień użytkownika (`get_effective_role(user)`).

### Tabela uprawnień

| Działanie | Staff | Supervisor | Manager | Owner |
|---|:---:|:---:|:---:|:---:|
| Przeglądaj zmiany | ✓ | ✓ | ✓ | ✓ |
| Twórz/edytuj zmiany | — | — | ✓ | ✓ |
| Składaj wniosek urlopowy | ✓ | ✓ | ✓ | ✓ |
| Zatwierdzaj urlopy | — | — | ✓ | ✓ |
| Przeglądaj wszystkich pracowników | ✓ | ✓ | ✓ | ✓ |
| Widz wynagrodzenia innych | — | — | ✓ | ✓ |
| Zarządzaj wynagrodzeniami | — | — | ✓ | ✓ |
| Przeglądaj dziennik audytu | — | — | ✓ | ✓ |
| Zarządzaj oddziałami | — | — | — | ✓ |
| Broadcast powiadomień | — | — | ✓ | ✓ |

### Szczegóły

- **Staff** widzi tylko **swoje** wnioski urlopowe i **swój** raport godzin
- **Manager+** widzi wszystko
- Wynagrodzenia w `EmploymentSerializer` są automatycznie ukrywane dla Staff/Supervisor
- `is_staff` w Django = automatycznie traktowany jako Owner

---

## 9. Logika biznesowa

### Obliczanie godzin

Używane w dwóch miejscach: raport godzin i generowanie wynagrodzenia.

**Priorytet danych dla każdego przypisania:**
1. `assignment.start_time` / `assignment.end_time` — jeśli ustawione przez managera
2. `assignment.check_in_time` / `assignment.check_out_time` — jeśli jest rzeczywiste przybycie/wyjście
3. `shift.start_time` / `shift.end_time` — wariant zapasowy

```python
if assignment.start_time and assignment.end_time:
    secs = (assignment.end_time - assignment.start_time).total_seconds()
elif assignment.check_in_time and assignment.check_out_time:
    secs = (assignment.check_out_time - assignment.check_in_time).total_seconds()
else:
    secs = (shift.end_time - shift.start_time).total_seconds()
hours = Decimal(str(secs / 3600)).quantize(Decimal('0.01'))
```

**Uwzględniane statusy zmian:** `planned`, `confirmed`, `completed`

---

### Generowanie wynagrodzenia

`payroll/utils.py` → `calculate_period_hours()` + `calculate_amounts()`

**Kroki:**
1. Znajdź wszystkie aktywne zatrudnienia (zatrudnieni przed końcem okresu)
2. Dla każdego zatrudnienia znajdź aktywne wynagrodzenie (według daty)
3. Oblicz godziny i zmiany dla zakresu dat
4. Oblicz kwotę wypłaty

**Typy wypłat:**

| Typ | Wzór |
|---|---|
| `hourly` | `hourly_rate × hours_worked` |
| `shift_based` | `hourly_rate × shifts_count` |
| `monthly` | `base_salary × (period_days ÷ 30)` |

**Typy premii:**

| Typ | Wzór |
|---|---|
| `none` | 0 |
| `fixed` | `bonus_value` |
| `percent` | `base_amount × (bonus_value ÷ 100)` |

Wszystkie kwoty są zaokrąglane do 2 miejsc po przecinku (`ROUND_HALF_UP`).

---

### Wykrywanie konfliktów urlopowych

Podczas wyświetlania zmian system sprawdza, czy przypisani pracownicy mają zatwierdzony urlop (`status=approved`) pokrywający się z datą zmiany.

Konflikty są zwracane w polu `conflicts[]` każdej zmiany i podświetlane w UI.

---

### Przepływ wniosków urlopowych

```
Użytkownik składa wniosek → status: pending
       ↓
Manager zatwierdza/odrzuca → status: approved / rejected
       ↓
System wysyła powiadomienie do użytkownika
       ↓
Zatwierdzony urlop → wyświetlany jako konflikt w zmianach
```

---

### Przepływ wynagrodzenia

```
Manager tworzy PayrollPeriod → status: draft
       ↓
POST /generate → system oblicza PayrollRecord dla każdego pracownika
       ↓
Manager sprawdza → POST /approve → status: approved
       ↓
Wypłata → POST /mark_paid → status: paid
       ↓
System wysyła powiadomienia do wszystkich pracowników
```

---

### Strefy czasowe

- Backend: `USE_TZ=True`, `TIME_ZONE="UTC"` — wszystkie DateTimeField w UTC
- Frontend: do wyświetlania używa `new Date(iso).getHours()` (lokalna strefa czasowa przeglądarki)
- Do zapisywania: `new Date(local).toISOString()` → konwertuje na UTC przed wysłaniem

---

## 10. Frontend — strony

| Strona | Plik | Dostęp | Co robi |
|---|---|---|---|
| Landing | `LandingPage.tsx` | Publiczna | Strona startowa dla niezalogowanych |
| Login | `LoginPage.tsx` | Publiczna | Formularz logowania |
| Register | `RegisterPage.tsx` | Publiczna | Rejestracja |
| Dashboard | `DashboardPage.tsx` | Wszyscy | Tygodniowy przegląd: pokrycie zmian, personel według ról, status oddziałów, oczekujące urlopy, strumień aktywności |
| Shifts | `ShiftsPage.tsx` | Wszyscy | Lista/kalendarz zmian. Zakładki: wszystkie, nieprzypisane, konflikty. Filtry według oddziału i statusu |
| Shift Detail | `ShiftDetailPage.tsx` | Wszyscy | Szczegóły zmiany, lista przypisań, check-in/out, edycja |
| Create Shift | `CreateShiftPage.tsx` | Manager+ | Formularz tworzenia zmiany |
| Employees | `EmployeesPage.tsx` | Wszyscy | Lista personelu z wyszukiwaniem. Wynagrodzenia widoczne tylko dla Manager+ |
| Leave Requests | `LeaveRequestsPage.tsx` | Wszyscy | Wnioski urlopowe. Staff widzi tylko swoje. Manager+ może zatwierdzać/odrzucać |
| Branches | `BranchesPage.tsx` | Owner | CRUD oddziałów |
| Payroll | `PayrollPage.tsx` | Manager+ | Lista okresów płatności. Tworzenie, generowanie, zatwierdzanie, wypłata |
| Payroll Detail | `PayrollDetailPage.tsx` | Manager+ | Szczegóły okresu płatności z tabelą wypłat |
| Reports | `ReportsPage.tsx` | Wszyscy | Raport godzin z filtrami. Staff — tylko własne dane |
| Audit Log | `AuditLogPage.tsx` | Manager+ | Dziennik wszystkich działań w systemie |
| Settings | `SettingsPage.tsx` | Wszyscy | Profil, zmiana hasła, wybór motywu sidebar |

---

## 11. Frontend — klient API

### Klient bazowy (`src/api/client.ts`)

- `apiFetch<T>(endpoint, options)` — główna funkcja z automatycznym odświeżaniem tokena
- Po otrzymaniu `401` → automatycznie odświeża access token i powtarza żądanie
- Po `403` → rzuca `ForbiddenError` i generuje zdarzenie `api:forbidden`
- Tokeny przechowywane w `localStorage` (`access_token`, `refresh_token`)

### Pliki klientów

| Plik | Funkcje |
|---|---|
| `auth.ts` | `loginApi`, `registerApi`, `refreshTokenApi`, `meApi`, `updateMeApi`, `changePasswordApi` |
| `branches.ts` | `getBranches`, `getBranch`, `createBranch`, `updateBranch`, `deleteBranch` |
| `employments.ts` | `getEmployments`, `createEmployment`, `updateEmployment`, `deleteEmployment`, `createCompensation`, `updateCompensation` |
| `shifts.ts` | `getShifts`, `getShift`, `createShift`, `updateShift`, `deleteShift`, `createAssignment`, `updateAssignment`, `deleteAssignment`, `checkInAssignment`, `checkOutAssignment` |
| `leaves.ts` | `getLeaveRequests`, `getApprovedLeavesOnDate`, `createLeaveRequest`, `approveLeaveRequest`, `rejectLeaveRequest`, `cancelLeaveRequest`, `deleteLeaveRequest` |
| `payroll.ts` | `getPayrollPeriods`, `getPayrollPeriod`, `createPayrollPeriod`, `deletePayrollPeriod`, `generatePayroll`, `approvePayroll`, `markPayrollPaid` |
| `notifications.ts` | `getNotifications`, `getUnreadCount`, `markRead`, `markAllRead`, `broadcastNotification` |
| `reports.ts` | `getHoursSummary` |
| `auditLog.ts` | `getAuditLogs` |
| `users.ts` | `getUsers` |

---

## 12. Typy TypeScript

Wszystkie typy w `src/types/`:

```typescript
// branch.ts
type BranchStatus = 'active' | 'inactive' | 'maintenance'
interface Branch { id, name, address, status, created_at }

// employment.ts
interface Employment { id, user, user_email, user_first_name, user_last_name,
  branch, branch_name, position, role, hire_date, status, compensations[] }
interface Compensation { id, employment, payment_type, hourly_rate, base_salary,
  bonus_type, bonus_value, effective_from, effective_to }

// shift.ts
interface Shift { id, branch, branch_name, start_time, end_time, status,
  note, assignments[], conflicts[] }
interface ShiftAssignment { id, shift, user, status,
  start_time?, end_time?, check_in_time?, check_out_time? }

// leave.ts
type LeaveType = 'day_off' | 'vacation' | 'sick_leave'
type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
interface LeaveRequest { id, user, leave_type, start_date, end_date,
  reason, status, reviewed_by?, reviewed_at? }

// payroll.ts (uproszczone)
type PayrollStatus = 'draft' | 'approved' | 'paid'
type PayrollFrequency = 'weekly' | 'biweekly' | 'monthly'
interface PayrollPeriod { id, branch?, frequency, start_date, end_date,
  status, record_count, total_amount }
interface PayrollRecord { id, period, employment, hours_worked, shifts_count,
  base_amount, bonus_amount, total_amount }

// auditLog.ts
type AuditAction = 'branch_created' | 'shift_created' | ... // 28 działań
interface AuditLog { id, user, action, resource_type, resource_id,
  resource_name, metadata, created_at }

// notification.ts
type NotificationScope = 'private' | 'global'
interface Notification { id, scope, type, title, body, is_read, read_at }
```

### Wspólne narzędzia

**`src/utils/format.ts`**
```typescript
formatDate(dt)        // "May 20, 2026"
formatDateShort(dt)   // "May 20"
formatTime(iso)       // "9:00 AM"
formatDateTime(iso)   // "May 20 · 9:00 AM"
diffHours(start, end) // różnica w godzinach
formatHours(h)        // "12h" lub "12h 30m"
formatCurrency(n)     // "$1,234.56"
```

**`src/utils/ui.ts`**
```typescript
AVATAR_COLORS         // tablica kolorów do awatarów
ROLE_LABELS           // { owner: 'Owner', manager: 'Manager', ... }
getDisplayName(obj)   // "Imię Nazwisko" lub email jako fallback
getInitials(obj)      // "IN" (pierwsze litery)
```

---

## 13. Dane demonstracyjne

```bash
# Wypełnij bazę danych testowymi danymi
python manage.py seed_demo

# Wyczyść i wypełnij od nowa
python manage.py seed_demo --clear
```

lub przez npm:

```bash
pnpm seed         # z katalogu głównego monorepo
pnpm seed:clear
```

**Co tworzy komenda:**
- 2 oddziały: Downtown Bar, Airport Lounge
- 10 użytkowników z różnymi rolami
- Zatrudnienia + wynagrodzenia dla każdego
- ~40 zmian z przypisaniami (2 tygodnie wstecz + następny tydzień)
- 3 wnioski urlopowe (pending / approved / rejected)
- 1 okres płatności w statusie draft

**Dane logowania testowe (hasło: `Password1!`):**

| Email | Rola | Oddział |
|---|---|---|
| `owner@demo.com` | Owner | Oba |
| `manager@demo.com` | Manager | Oba |
| `supervisor1@demo.com` | Supervisor | Downtown Bar |
| `supervisor2@demo.com` | Supervisor | Airport Lounge |
| `staff1@demo.com` | Staff | Downtown Bar |
| `staff2@demo.com` | Staff | Downtown Bar |
| `staff4@demo.com` | Staff | Airport Lounge |
