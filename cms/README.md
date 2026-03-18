# Client Management System

- Handles client projects, payment tracking, and tax-related documentation.

- Supports structured payment workflows, including scheduled payments, transaction tracking, and automatic generation of Official Receipts (OR). Each OR can be associated with a Form 2307 for withholding tax reporting.

- Centralizes client, project, and financial data while enforcing relationships between payments, receipts, and tax records.

## SETUP
./vendor/bin/sail up -d
./vendor/bin/sail composer install
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate

## DATABASE

Core flow:
Client → Project → ClientProject → Payment → PaymentSchedule → PaymentTransaction → OfficialReceipt → Form2307

## RELATIONSHIPS
Client
 └── ClientProject
      └── Project
      └── Payment
           └── PaymentSchedule
                └── PaymentTransaction
                     └── OfficialReceipt
                          └── Form2307
                          
## NOTES

- Uses Laravel Sail (Docker-based dev environment)
- Default DB: MySQL (configured in .env)
- If ports conflict, update compose.yaml
