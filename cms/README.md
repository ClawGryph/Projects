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
User → Role → RoleUser

## RELATIONSHIPS
Client
 └── ClientProject
      └── Project
      └── Payment
           └── PaymentSchedule
                └── PaymentTransaction
                     └── OfficialReceipt
                          └── Form2307
- Client → Project 
One client can have multpile projects.
- Projects → Clients
One project can have multiple clients.
- Payments → Clients Projects
One Payment can have multiple clients project.
- Official Receipt → Payments
One official receipt can only have one payment.
- Form2307 → Official Receipt
One form 2307 can only have one official receipt.

User ──< RoleUser >── Role
- Users → System access
Users are assigned roles such as Super Admin, Admin, or Viewer to control access levels.
                          
## NOTES

- Uses Laravel Sail (Docker-based dev environment)
- Default DB: MySQL (configured in .env)
- If ports conflict, update compose.yaml
