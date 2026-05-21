from decimal import ROUND_HALF_UP, Decimal


def _q(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def get_effective_compensation(employment, period):
    from django.db.models import Q
    from employment.models import Compensation

    return (
        Compensation.objects.filter(
            employment=employment,
            effective_from__lte=period.end_date,
        )
        .filter(Q(effective_to__isnull=True) | Q(effective_to__gte=period.start_date))
        .order_by("-effective_from")
        .first()
    )


def calculate_period_hours(employment, period):
    """Return (total_hours, total_shifts) from shift assignments in the period."""
    from shifts.models import ShiftAssignment

    assignments = ShiftAssignment.objects.filter(
        user=employment.user,
        shift__branch=employment.branch,
        shift__start_time__date__gte=period.start_date,
        shift__start_time__date__lte=period.end_date,
        shift__status__in=["planned", "confirmed", "completed"],
    ).select_related("shift")

    total_hours = Decimal("0")
    total_shifts = 0
    for a in assignments:
        if a.start_time and a.end_time:
            secs = (a.end_time - a.start_time).total_seconds()
        elif a.check_in_time and a.check_out_time:
            secs = (a.check_out_time - a.check_in_time).total_seconds()
        else:
            secs = (a.shift.end_time - a.shift.start_time).total_seconds()
        total_hours += Decimal(str(round(secs / 3600, 2)))
        total_shifts += 1

    return _q(total_hours), total_shifts


def calculate_amounts(compensation, hours_worked: Decimal, shifts_count: int, period):
    """Return (base_amount, bonus_amount)."""
    pt = compensation.payment_type
    rate = Decimal(str(compensation.hourly_rate or 0))
    salary = Decimal(str(compensation.base_salary or 0))

    if pt == "hourly":
        base = _q(rate * hours_worked)
    elif pt == "shift_based":
        base = _q(rate * Decimal(str(shifts_count)))
    else:  # monthly — prorate by period days vs 30-day reference month
        period_days = (period.end_date - period.start_date).days + 1
        base = _q(salary * Decimal(str(period_days)) / Decimal("30"))

    bt = compensation.bonus_type
    bv = Decimal(str(compensation.bonus_value or 0))
    if bt == "fixed":
        bonus = _q(bv)
    elif bt == "percent":
        bonus = _q(base * bv / Decimal("100"))
    else:
        bonus = Decimal("0")

    return base, bonus
