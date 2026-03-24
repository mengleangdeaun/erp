# s_cool_crm ERP

> A Laravel-based CRM + Inventory & Service Management Platform for small businesses.

## 🚀 Project Overview

This repository contains `s_cool_crm/erp`, a Laravel 11 web application for managing customers, inventory, sales, services, job cards, employee leave, and system activity logs. It provides RESTful APIs (see `routes/api.php` and `routes.txt`) and a backend for rapid business operations.

## ✨ Why This Project is Useful

- Inventory management: categories, locations, products, suppliers, tags, UOMs.
- Procurement workflows: purchase orders, purchase receives, stock adjustments.
- CRM & sales order handling: customers, quotations, orders, deposits, invoices.
- Service operations: job cards, parts/materials usage, service pricing.
- Employee management: leave allocation, leave requests, policies, balances.
- Media and document settings: file/folder management, configurable system settings.
- Notification system and audit logging with activity history.

## 📦 Tech Stack

- PHP ^8.1
- Laravel Framework ^11.0
- Sanctum (API auth)
- MySQL / Postgres / SQLite (configurable in `.env`)
- AWS S3 / Google Drive file storage adapters
- Vue or React front end (project includes `resources/js` infrastructure)
- PHPUnit and Laravel Pint for tests and code style

## 🧩 Repository Structure

- `app/`: Models, Controllers, Requests, Services, Traits, Notifications
- `config/`: App config and installed packages
- `routes/`: `api.php`, `web.php`, etc.
- `database/`: migrations, seeders, factories
- `resources/`: views, assets (`js`, `css`)
- `tests/`: unit & feature tests

## 📥 Getting Started

1. Clone repository

```bash
git clone https://github.com/<your-org>/s_cool_crm.git
cd s_cool_crm/erp
```

2. Install PHP dependencies

```bash
composer install
```

3. Install JavaScript dependencies

```bash
npm install
```

4. Copy environment file

```bash
cp .env.example .env
```

5. Generate application key

```bash
php artisan key:generate
```

6. Configure `.env`

- `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- `FILESYSTEM_DRIVER` (local, s3, google)

7. Run migrations and seeders

```bash
php artisan migrate --seed
```

8. Build frontend assets

```bash
npm run build
```

9. Start local server

```bash
php artisan serve
npm run dev
```

## 🧪 Running Tests

```bash
vendor/bin/phpunit
php artisan test
```

## 🛡️ Coding Standards

- `composer test` (if configured, otherwise run `php artisan pint`)
- `php artisan pint -- --fix` for code formatting

## 📚 API Documentation

For endpoint details, refer to:
- `routes/api.php`
- `routes.txt` (generated route list)

This README avoids extensive API docs; use the project wiki or docs folder for full specs.

## 💬 Support & Help

- Check `storage/logs/laravel.log` for runtime errors
- Open an issue in the repository
- Use your team’s internal support channels (Slack/Teams)

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/name`)
3. Commit changes with clear messages
4. Push to origin and open a pull request

See `CONTRIBUTING.md` (if available) for formal guidelines.

## 👤 Maintainers

- Primary maintainer: project team (update this with names/emails as needed)
- Add recognized contributors to a `MAINTAINERS.md` or GitHub team

## 📜 License

MIT (see `LICENSE`)
