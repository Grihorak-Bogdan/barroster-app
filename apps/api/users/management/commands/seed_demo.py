"""
python manage.py seed_demo

Creates a full set of demo data:
  - 2 branches
  - 1 owner, 1 manager, 2 supervisors, 6 staff
  - Employments + compensations for each
  - 20 shifts (past + upcoming) with assignments
  - A few leave requests (pending/approved/rejected)
  - One payroll period in draft

Pass --clear to wipe all existing data first.
"""
import random
from datetime import date, datetime, timedelta, timezone

from django.core.management.base import BaseCommand
from django.db import transaction

from branches.models import Branch
from employment.models import Compensation, Employment, EmploymentRole, PaymentType
from leave_requests.models import LeaveRequest, LeaveStatus, LeaveType
from shifts.models import Shift, ShiftAssignment, ShiftStatus
from users.models import User
from payroll.models import PayrollPeriod, PayrollRecord


def utc(dt: datetime) -> datetime:
    return dt.replace(tzinfo=timezone.utc)


def date_to_utc(d: date, hour: int = 0, minute: int = 0) -> datetime:
    return utc(datetime(d.year, d.month, d.day, hour, minute))


class Command(BaseCommand):
    help = "Seed demo data for development / staging"

    def add_arguments(self, parser):
        parser.add_argument("--clear", action="store_true", help="Delete all existing data first")

    @transaction.atomic
    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write("Clearing existing data...")
            PayrollRecord.objects.all().delete()
            PayrollPeriod.objects.all().delete()
            ShiftAssignment.objects.all().delete()
            Shift.objects.all().delete()
            LeaveRequest.objects.all().delete()
            Compensation.objects.all().delete()
            Employment.objects.all().delete()
            Branch.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()

        today = date.today()

        # ── Branches ──────────────────────────────────────────────────────────

        branch_a = Branch.objects.create(
            name="Downtown Bar",
            address="12 Main Street, City Centre",
            status="active",
        )
        branch_b = Branch.objects.create(
            name="Airport Lounge",
            address="Terminal 2, International Airport",
            status="active",
        )
        self.stdout.write(f"  Branches: {branch_a.name}, {branch_b.name}")

        # ── Users ─────────────────────────────────────────────────────────────

        def make_user(email, first, last, password="Password1!"):
            return User.objects.create_user(
                email=email,
                password=password,
                first_name=first,
                last_name=last,
            )

        owner    = make_user("owner@demo.com",      "Alex",    "Thompson")
        manager  = make_user("manager@demo.com",    "Jordan",  "Casey")
        sup_a    = make_user("supervisor1@demo.com","Morgan",  "Reed")
        sup_b    = make_user("supervisor2@demo.com","Taylor",  "Brooks")
        staff_1  = make_user("staff1@demo.com",     "Sam",     "Williams")
        staff_2  = make_user("staff2@demo.com",     "Chris",   "Davis")
        staff_3  = make_user("staff3@demo.com",     "Jamie",   "Miller")
        staff_4  = make_user("staff4@demo.com",     "Riley",   "Wilson")
        staff_5  = make_user("staff5@demo.com",     "Drew",    "Moore")
        staff_6  = make_user("staff6@demo.com",     "Casey",   "Taylor")
        self.stdout.write(f"  Users: 10 created (password: Password1!)")

        # ── Employments + Compensations ───────────────────────────────────────

        hire = today - timedelta(days=180)

        def emp(user, branch, position, role, rate=None, salary=None,
                pay_type=PaymentType.HOURLY):
            e = Employment.objects.create(
                user=user, branch=branch, position=position,
                role=role, hire_date=hire, status="active",
            )
            if pay_type == PaymentType.HOURLY:
                Compensation.objects.create(
                    employment=e, payment_type=pay_type,
                    hourly_rate=rate or "20.00", effective_from=hire,
                )
            else:
                Compensation.objects.create(
                    employment=e, payment_type=pay_type,
                    base_salary=salary or "3500.00", effective_from=hire,
                )
            return e

        emp(owner,   branch_a, "Owner",           EmploymentRole.OWNER,   salary="5000.00", pay_type=PaymentType.MONTHLY)
        emp(owner,   branch_b, "Owner",           EmploymentRole.OWNER,   salary="5000.00", pay_type=PaymentType.MONTHLY)
        emp(manager, branch_a, "Bar Manager",     EmploymentRole.MANAGER, salary="4000.00", pay_type=PaymentType.MONTHLY)
        emp(manager, branch_b, "Lounge Manager",  EmploymentRole.MANAGER, salary="4000.00", pay_type=PaymentType.MONTHLY)
        emp(sup_a,   branch_a, "Head Bartender",  EmploymentRole.SUPERVISOR, rate="22.00")
        emp(sup_b,   branch_b, "Shift Lead",      EmploymentRole.SUPERVISOR, rate="22.00")
        emp(staff_1, branch_a, "Bartender",  EmploymentRole.STAFF, rate="18.00")
        emp(staff_2, branch_a, "Bartender",  EmploymentRole.STAFF, rate="18.00")
        emp(staff_3, branch_a, "Waiter",     EmploymentRole.STAFF, rate="16.00")
        emp(staff_4, branch_b, "Bartender",  EmploymentRole.STAFF, rate="18.00")
        emp(staff_5, branch_b, "Waiter",     EmploymentRole.STAFF, rate="16.00")
        emp(staff_6, branch_b, "Barback",    EmploymentRole.STAFF, rate="15.00")
        self.stdout.write("  Employments + compensations: done")

        # ── Shifts ────────────────────────────────────────────────────────────

        def shift(branch, start_h, end_h, days_offset, status=ShiftStatus.PLANNED, note=""):
            d = today + timedelta(days=days_offset)
            return Shift.objects.create(
                branch=branch,
                created_by=owner,
                start_time=date_to_utc(d, start_h),
                end_time=date_to_utc(d, end_h) if end_h > start_h else date_to_utc(d + timedelta(days=1), end_h),
                status=status,
                note=note,
            )

        def assign(s: Shift, user, start_h, end_h, days_offset=0):
            base = today + timedelta(days=days_offset)
            ShiftAssignment.objects.create(
                shift=s,
                user=user,
                start_time=date_to_utc(base, start_h),
                end_time=date_to_utc(base, end_h) if end_h > start_h else date_to_utc(base + timedelta(days=1), end_h),
            )

        # Past completed shifts (last 2 weeks)
        for offset in [-14, -13, -12, -11, -10, -9, -8, -7, -6, -5, -4]:
            s = shift(branch_a, 17, 1, offset, ShiftStatus.COMPLETED)
            assign(s, staff_1, 17, 23, offset)
            assign(s, staff_2, 18, 1,  offset)
            if offset % 3 == 0:
                assign(s, sup_a, 17, 1, offset)

            s2 = shift(branch_b, 12, 22, offset, ShiftStatus.COMPLETED)
            assign(s2, staff_4, 12, 20, offset)
            assign(s2, staff_5, 14, 22, offset)

        # Confirmed upcoming shifts
        for offset in [0, 1, 2, 3]:
            s = shift(branch_a, 18, 2, offset, ShiftStatus.CONFIRMED)
            assign(s, staff_1, 18, 0, offset)
            assign(s, staff_2, 19, 2, offset)
            assign(s, staff_3, 18, 1, offset)

            s2 = shift(branch_b, 10, 20, offset, ShiftStatus.CONFIRMED)
            assign(s2, staff_4, 10, 18, offset)
            assign(s2, staff_5, 12, 20, offset)

        # Planned future shifts
        for offset in [4, 5, 6, 7]:
            shift(branch_a, 18, 2, offset, ShiftStatus.PLANNED)
            shift(branch_b, 10, 20, offset, ShiftStatus.PLANNED)

        self.stdout.write("  Shifts + assignments: done")

        # ── Leave Requests ────────────────────────────────────────────────────

        LeaveRequest.objects.create(
            user=staff_3,
            leave_type=LeaveType.VACATION,
            start_date=today + timedelta(days=10),
            end_date=today + timedelta(days=14),
            reason="Annual summer vacation",
            status=LeaveStatus.PENDING,
        )
        LeaveRequest.objects.create(
            user=staff_6,
            leave_type=LeaveType.SICK_LEAVE,
            start_date=today - timedelta(days=3),
            end_date=today - timedelta(days=1),
            reason="Flu",
            status=LeaveStatus.APPROVED,
            reviewed_by=manager,
        )
        LeaveRequest.objects.create(
            user=staff_5,
            leave_type=LeaveType.DAY_OFF,
            start_date=today + timedelta(days=2),
            end_date=today + timedelta(days=2),
            reason="Personal errand",
            status=LeaveStatus.REJECTED,
            reviewed_by=manager,
        )
        self.stdout.write("  Leave requests: 3 created")

        # ── Payroll Period ────────────────────────────────────────────────────

        period_start = today.replace(day=1)
        period_end = (period_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        PayrollPeriod.objects.create(
            branch=branch_a,
            frequency="monthly",
            start_date=period_start,
            end_date=period_end,
            status="draft",
            created_by=manager,
        )
        self.stdout.write("  Payroll period: 1 draft created")

        self.stdout.write(self.style.SUCCESS("\nDemo data seeded successfully!"))
        self.stdout.write("\nDemo logins (password: Password1!):")
        self.stdout.write("  owner@demo.com      — Owner (both branches)")
        self.stdout.write("  manager@demo.com    — Manager (both branches)")
        self.stdout.write("  supervisor1@demo.com — Supervisor (Downtown Bar)")
        self.stdout.write("  supervisor2@demo.com — Supervisor (Airport Lounge)")
        self.stdout.write("  staff1@demo.com     — Staff (Downtown Bar)")
        self.stdout.write("  staff4@demo.com     — Staff (Airport Lounge)")
