// Labor Law Leave Entitlements Configuration

// Employees with 5+ years of service get 21 days annual leave
// Employees under 5 years get 14 days annual leave
// All employees get 14 days sick leave

export const SENIOR_EMPLOYEES = ['Rania', 'Amjad', 'Rana', 'Tareq'];

export interface LeaveEntitlement {
  annual: number;
  sick: number;
}

export function getLeaveEntitlement(employeeName: string): LeaveEntitlement {
  const isSenior = SENIOR_EMPLOYEES.some(
    name => name.toLowerCase() === employeeName?.toLowerCase()
  );
  
  return {
    annual: isSenior ? 21 : 14,
    sick: 14, // All employees get 14 days sick leave
  };
}

export function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  // Normalize dates to start of day
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    // Count if not Saturday (6) or Sunday (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return Math.max(count, 1); // At least 1 day
}
