import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TelesalesContact } from '@/hooks/useTelesalesContacts';
import { useTelesalesCalls, TelesalesCall, CALL_OUTCOMES } from '@/hooks/useTelesalesCalls';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { startOfDay, subDays, format, isToday, isThisWeek } from 'date-fns';

interface Props {
  contacts: TelesalesContact[];
}

const PIE_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#6b7280', '#8b5cf6', '#10b981'];

export function TelesalesKPIs({ contacts }: Props) {
  const { calls } = useTelesalesCalls();

  const stats = useMemo(() => {
    const callsToday = calls.filter(c => isToday(new Date(c.call_date))).length;
    const callsThisWeek = calls.filter(c => isThisWeek(new Date(c.call_date), { weekStartsOn: 0 })).length;

    const contacted = contacts.filter(c => c.status !== 'new');
    const converted = contacts.filter(c => c.status === 'converted');
    const conversionRate = contacted.length > 0 ? ((converted.length / contacted.length) * 100).toFixed(1) : '0';

    // Follow-up compliance: contacts that had a follow-up, and a call was logged on or before
    const withFollowUp = contacts.filter(c => c.next_follow_up);
    const compliant = withFollowUp.filter(contact => {
      const followUp = contact.next_follow_up;
      if (!followUp) return false;
      return calls.some(call =>
        call.contact_id === contact.id &&
        call.call_date.split('T')[0] <= followUp
      );
    });
    const compliance = withFollowUp.length > 0 ? ((compliant.length / withFollowUp.length) * 100).toFixed(0) : '100';

    return { callsToday, callsThisWeek, conversionRate, compliance };
  }, [calls, contacts]);

  const dailyCalls = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      const dayStr = format(day, 'yyyy-MM-dd');
      const count = calls.filter(c => c.call_date.startsWith(dayStr)).length;
      days.push({ date: format(day, 'dd MMM'), count });
    }
    return days;
  }, [calls]);

  const outcomeDist = useMemo(() => {
    const map: Record<string, number> = {};
    calls.forEach(c => { map[c.outcome] = (map[c.outcome] || 0) + 1; });
    return CALL_OUTCOMES.map(o => ({ name: o.label, value: map[o.value] || 0 })).filter(o => o.value > 0);
  }, [calls]);

  const funnel = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    contacts.forEach(c => { statusCounts[c.status] = (statusCounts[c.status] || 0) + 1; });
    return [
      { stage: 'New', count: statusCounts['new'] || 0 },
      { stage: 'In Progress', count: statusCounts['in_progress'] || 0 },
      { stage: 'Interested', count: calls.filter(c => c.outcome === 'interested').length },
      { stage: 'Converted', count: statusCounts['converted'] || 0 },
    ];
  }, [contacts, calls]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Calls Today</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats.callsToday}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Calls This Week</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats.callsThisWeek}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Conversion Rate</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats.conversionRate}%</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Follow-up Compliance</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats.compliance}%</p></CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Calls per Day (Last 14 Days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyCalls}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Outcome Distribution</CardTitle></CardHeader>
          <CardContent>
            {outcomeDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={outcomeDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                    {outcomeDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No call data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Conversion Funnel</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={funnel} layout="vertical">
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="stage" width={90} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
